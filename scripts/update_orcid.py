#!/usr/bin/env python3
"""Aggiorna data/publications.json dal profilo ORCID pubblico.

Questa versione non fallisce più silenziosamente: se ORCID non viene letto
correttamente, il workflow GitHub Actions deve diventare rosso. Così si capisce
subito che le pubblicazioni non sono state aggiornate.
"""
from __future__ import annotations

import json
import os
import pathlib
import re
import sys
import time
import urllib.parse
import urllib.request
from typing import Any

ORCID = os.environ.get("ORCID_ID", "0000-0003-4970-2065")
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "publications.json"
META = ROOT / "data" / "publications.meta.json"
API_ROOT = f"https://pub.orcid.org/v3.0/{ORCID}"
MIN_WORKS = int(os.environ.get("ORCID_MIN_WORKS", "5"))

BASE_HEADERS = {
    "User-Agent": "ricciuti-site/2.0 (+https://github.com/vittorioricciuti/riccardoricciuti-site)",
}


def request_json(url: str, accept: str = "application/vnd.orcid+json") -> Any:
    headers = dict(BASE_HEADERS)
    headers["Accept"] = accept
    token = os.environ.get("ORCID_ACCESS_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=45) as response:
        raw = response.read().decode("utf-8")
        return json.loads(raw)


def get_json_with_retries(url: str) -> Any:
    errors: list[str] = []
    # Prova prima il media type ORCID, poi JSON generico.
    for attempt in range(1, 4):
        for accept in ("application/vnd.orcid+json", "application/json"):
            try:
                return request_json(url, accept=accept)
            except Exception as exc:  # noqa: BLE001
                errors.append(f"attempt {attempt}, accept {accept}: {exc}")
        if attempt < 3:
            time.sleep(2 * attempt)
    raise RuntimeError("; ".join(errors[-6:]))


def value(obj: dict | None, *path: str) -> str:
    cur: Any = obj or {}
    for key in path:
        if not isinstance(cur, dict):
            return ""
        cur = cur.get(key)
    return str(cur or "").strip()


def pick_title(work: dict) -> str:
    return value(work.get("title"), "title", "value")


def pick_year(work: dict) -> str:
    return value(work.get("publication-date"), "year", "value")


def external_ids(work: dict) -> dict[str, str]:
    out: dict[str, str] = {}
    ids = value_list((work.get("external-ids") or {}).get("external-id"))
    for item in ids:
        kind = str(item.get("external-id-type") or "").lower().strip()
        val = str(item.get("external-id-value") or "").strip()
        if kind and val and kind not in out:
            out[kind] = val
    return out


def value_list(v: Any) -> list[dict]:
    return v if isinstance(v, list) else []


def contributors(work: dict) -> str:
    people = []
    for item in value_list(((work.get("contributors") or {}).get("contributor"))):
        credit = value(item.get("credit-name"), "value")
        if credit:
            people.append(credit)
    if len(people) > 8:
        return ", ".join(people[:8]) + ", et al."
    return ", ".join(people)


def tags_for(text: str) -> list[str]:
    text = text.lower()
    rules = [
        ("DBS", r"deep brain stimulation|\bdbs\b|subthalamic|brain sense|frameless"),
        ("Parkinson", r"parkinson"),
        ("Spine", r"spine|spinal|vertebral|lumbar|cervical|spondyl|disc|stenosis"),
        ("Pituitary", r"pituitary|pitnet|adenoma|sellar|parasellar|cushing"),
        ("Epilepsy", r"epilep|seizure|thalamus"),
        ("Monitoring", r"monitoring|neurophysiological|intraoperative"),
        ("VNS", r"vagus|vns"),
        ("Tumors", r"tumou?r|glioma|metasta|neoplasm|neurocytoma"),
        ("Awake", r"awake"),
        ("Vascular", r"stroke|aneurysm|hemorrhage|haemorrhage|ischemic|ischaemic"),
    ]
    tags = [tag for tag, pattern in rules if re.search(pattern, text)]
    return tags or ["Neurosurgery"]


def make_pub(work: dict, group_index: int) -> dict | None:
    title = pick_title(work)
    if not title:
        return None
    year = pick_year(work)
    journal = value(work.get("journal-title"), "value")
    ids = external_ids(work)
    doi = ids.get("doi", "")
    pmid = ids.get("pmid", "") or ids.get("pubmed", "")
    url = ids.get("uri", "") or ids.get("url", "")
    pubmed_url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else "https://pubmed.ncbi.nlm.nih.gov/?term=" + urllib.parse.quote(title)
    put_code = work.get("put-code")
    authors = contributors(work)
    # display-index è spesso usato da ORCID per l'ordine di visualizzazione.
    display_index = int(str(work.get("display-index") or "0").split(".")[0] or 0)
    return {
        "year": year,
        "title": title,
        "authors": authors,
        "journal": journal,
        "doi": doi,
        "doiUrl": f"https://doi.org/{doi}" if doi else "",
        "pubmedSearchUrl": pubmed_url,
        "orcidUrl": f"https://orcid.org/{ORCID}/work/{put_code}" if put_code else f"https://orcid.org/{ORCID}",
        "sourceUrl": url,
        "source": "ORCID",
        "tags": tags_for(" ".join([title, journal, authors])),
        "_groupIndex": group_index,
        "_displayIndex": display_index,
    }


def sort_key(pub: dict) -> tuple:
    m = re.search(r"\d{4}", str(pub.get("year") or ""))
    y = int(m.group(0)) if m else 0
    # Prima anno decrescente; nello stesso anno manteniamo l'ordine ORCID il più possibile.
    return (-y, -int(pub.get("_displayIndex") or 0), int(pub.get("_groupIndex") or 0), str(pub.get("title") or ""))


def main() -> int:
    works_url = f"{API_ROOT}/works"
    print(f"Reading ORCID works: {works_url}")
    try:
        data = get_json_with_retries(works_url)
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: cannot read ORCID works for {ORCID}: {exc}", file=sys.stderr)
        return 1

    groups = value_list(data.get("group"))
    print(f"ORCID groups found: {len(groups)}")
    pubs: list[dict] = []
    seen: set[str] = set()

    for group_index, group in enumerate(groups):
        summaries = value_list(group.get("work-summary"))
        if not summaries:
            continue
        # Il primo summary di ogni gruppo è normalmente quello mostrato da ORCID.
        summary = summaries[0]
        pub = make_pub(summary, group_index)
        if not pub:
            continue
        key_parts = [str(pub.get("doi") or "").lower().strip(), re.sub(r"\s+", " ", str(pub.get("title") or "").lower()).strip()]
        key = key_parts[0] or key_parts[1]
        if not key or key in seen:
            continue
        seen.add(key)
        pubs.append(pub)

    if len(pubs) < MIN_WORKS:
        print(f"ERROR: ORCID returned only {len(pubs)} usable works; expected at least {MIN_WORKS}.", file=sys.stderr)
        return 1

    pubs.sort(key=sort_key)
    for p in pubs:
        p.pop("_groupIndex", None)
        p.pop("_displayIndex", None)

    OUT.write_text(json.dumps(pubs, ensure_ascii=False, indent=2), encoding="utf-8")
    years = [p.get("year") for p in pubs[:8]]
    META.write_text(json.dumps({
        "source": "ORCID",
        "orcid": ORCID,
        "works": len(pubs),
        "top_years": years,
        "generated_by": "scripts/update_orcid.py",
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Updated {OUT} with {len(pubs)} ORCID works")
    print("First publications:")
    for p in pubs[:5]:
        print(f"- {p.get('year')} | {p.get('title')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
