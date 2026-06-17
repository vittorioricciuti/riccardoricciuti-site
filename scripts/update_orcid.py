#!/usr/bin/env python3
"""Aggiorna data/publications.json dal profilo ORCID pubblico.

Il deploy GitHub Pages esegue questo script prima della pubblicazione. La fonte
principale è ORCID. I risultati vengono ordinati per anno decrescente, così le
pubblicazioni più recenti presenti su ORCID compaiono per prime sul sito.
Se ORCID non risponde, il sito mantiene il file JSON già presente.
"""
from __future__ import annotations

import json
import pathlib
import re
import sys
import urllib.parse
import urllib.request

ORCID = "0000-0003-4970-2065"
OUT = pathlib.Path(__file__).resolve().parents[1] / "data" / "publications.json"
API = f"https://pub.orcid.org/v3.0/{ORCID}/works"
HEADERS = {"Accept": "application/vnd.orcid+json", "User-Agent": "ricciuti-site/1.1"}


def get_json(url: str):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def pick_title(title_obj: dict | None) -> str:
    if not title_obj:
        return ""
    return ((title_obj.get("title") or {}).get("value") or "").strip()


def pick_year(work: dict) -> str:
    date = work.get("publication-date") or {}
    year = (date.get("year") or {}).get("value") or ""
    return str(year).strip()


def external_ids(work: dict) -> dict[str, str]:
    out: dict[str, str] = {}
    ids = ((work.get("external-ids") or {}).get("external-id") or [])
    for item in ids:
        kind = (item.get("external-id-type") or "").lower().strip()
        value = (item.get("external-id-value") or "").strip()
        if kind and value and kind not in out:
            out[kind] = value
    return out


def tags_for(text: str) -> list[str]:
    text = text.lower()
    rules = [
        ("DBS", r"deep brain stimulation|\bdbs\b|subthalamic|brain sense"),
        ("Parkinson", r"parkinson"),
        ("Spine", r"spine|spinal|vertebral|lumbar|cervical|spondyl|disc"),
        ("Pituitary", r"pituitary|pitnet|adenoma|sellar|parasellar"),
        ("Epilepsy", r"epilep|seizure"),
        ("Monitoring", r"monitoring|neurophysiological"),
        ("VNS", r"vagus|vns"),
        ("Tumors", r"tumou?r|glioma|metasta|neoplasm"),
        ("Awake", r"awake"),
        ("Vascular", r"stroke|aneurysm|hemorrhage|haemorrhage|ischemic|ischaemic"),
    ]
    tags = [tag for tag, pattern in rules if re.search(pattern, text)]
    return tags or ["Neurosurgery"]


def sort_key(pub: dict):
    year = pub.get("year") or "0"
    try:
        y = int(re.match(r"\d{4}", str(year)).group(0))
    except Exception:
        y = 0
    # Keep ORCID relative order within the same year using the original index.
    return (-y, pub.get("_orcidIndex", 0), pub.get("title", ""))


def main() -> int:
    try:
        data = get_json(API)
    except Exception as exc:
        print(f"ORCID update skipped: {exc}", file=sys.stderr)
        return 0

    pubs: list[dict] = []
    seen: set[str] = set()
    for index, group in enumerate(data.get("group", [])):
        summaries = group.get("work-summary") or []
        if not summaries:
            continue
        work = summaries[0]
        title = pick_title(work.get("title"))
        key = re.sub(r"\s+", " ", title.lower()).strip()
        if not title or key in seen:
            continue
        seen.add(key)
        year = pick_year(work)
        journal = ((work.get("journal-title") or {}).get("value") or "").strip()
        ids = external_ids(work)
        doi = ids.get("doi", "")
        pmid = ids.get("pmid", "") or ids.get("pubmed", "")
        pubmed_url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else "https://pubmed.ncbi.nlm.nih.gov/?term=" + urllib.parse.quote(title)
        put_code = work.get("put-code")
        record = {
            "year": year,
            "title": title,
            "authors": "",
            "journal": journal,
            "doi": doi,
            "doiUrl": f"https://doi.org/{doi}" if doi else "",
            "pubmedSearchUrl": pubmed_url,
            "orcidUrl": f"https://orcid.org/{ORCID}/work/{put_code}" if put_code else f"https://orcid.org/{ORCID}",
            "source": "ORCID",
            "tags": tags_for(" ".join([title, journal])),
            "_orcidIndex": index,
        }
        pubs.append(record)

    if not pubs:
        print("ORCID returned no works; keeping existing publications.json")
        return 0

    pubs.sort(key=sort_key)
    for p in pubs:
        p.pop("_orcidIndex", None)
    OUT.write_text(json.dumps(pubs, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Updated {OUT} with {len(pubs)} ORCID works")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
