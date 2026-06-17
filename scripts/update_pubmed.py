#!/usr/bin/env python3
"""Update data/publications.json from PubMed.

This script is designed for GitHub Actions. It uses NCBI E-utilities without
third-party packages. Adjust PUBMED_QUERY if the author query needs tightening.
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "publications.json"
PUBMED_QUERY = os.environ.get("PUBMED_QUERY", 'Ricciuti R[Author] OR Ricciuti RA[Author]')
MAX_RESULTS = int(os.environ.get("PUBMED_MAX_RESULTS", "30"))
EMAIL = os.environ.get("NCBI_EMAIL", "")
TOOL = "ricciuti-github-pages-site"
BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"


def fetch(url: str) -> bytes:
    with urllib.request.urlopen(url, timeout=30) as response:
        return response.read()


def esearch() -> list[str]:
    params = {
        "db": "pubmed",
        "term": PUBMED_QUERY,
        "retmode": "json",
        "retmax": MAX_RESULTS,
        "sort": "date",
        "tool": TOOL,
    }
    if EMAIL:
        params["email"] = EMAIL
    url = BASE + "esearch.fcgi?" + urllib.parse.urlencode(params)
    payload = json.loads(fetch(url).decode("utf-8"))
    return payload.get("esearchresult", {}).get("idlist", [])


def text(node: ET.Element | None, default: str = "") -> str:
    return "".join(node.itertext()).strip() if node is not None else default


def parse_article(article: ET.Element) -> dict:
    medline = article.find("MedlineCitation")
    citation = medline.find("Article") if medline is not None else None
    journal = citation.find("Journal") if citation is not None else None
    title = text(citation.find("ArticleTitle")) if citation is not None else "Untitled"
    journal_title = text(journal.find("Title")) if journal is not None else ""
    pub_date = journal.find("JournalIssue/PubDate") if journal is not None else None
    year = text(pub_date.find("Year")) if pub_date is not None else ""
    if not year and pub_date is not None:
        medline_date = text(pub_date.find("MedlineDate"))
        year = medline_date[:4]
    authors = []
    for author in citation.findall("AuthorList/Author") if citation is not None else []:
        last = text(author.find("LastName"))
        initials = text(author.find("Initials"))
        collective = text(author.find("CollectiveName"))
        if collective:
            authors.append(collective)
        elif last:
            authors.append(f"{last} {initials}".strip())
    doi = ""
    for article_id in article.findall("PubmedData/ArticleIdList/ArticleId"):
        if article_id.attrib.get("IdType") == "doi":
            doi = text(article_id)
            break
    return {
        "year": year,
        "title": title,
        "authors": ", ".join(authors),
        "journal": journal_title,
        "doi": doi,
        "tags": infer_tags(title),
    }


def infer_tags(title: str) -> list[str]:
    lower = title.lower()
    tags = []
    checks = {
        "DBS": ["deep brain stimulation", "dbs"],
        "Parkinson": ["parkinson"],
        "Epilepsy": ["epilep"],
        "Awake surgery": ["awake"],
        "Monitoring": ["monitoring", "neurophysiological"],
        "Pituitary": ["pituitary", "pitnet", "adenoma"],
    }
    for tag, needles in checks.items():
        if any(n in lower for n in needles):
            tags.append(tag)
    return tags


def efetch(ids: list[str]) -> list[dict]:
    if not ids:
        return []
    params = {
        "db": "pubmed",
        "id": ",".join(ids),
        "retmode": "xml",
        "tool": TOOL,
    }
    if EMAIL:
        params["email"] = EMAIL
    url = BASE + "efetch.fcgi?" + urllib.parse.urlencode(params)
    root = ET.fromstring(fetch(url))
    return [parse_article(article) for article in root.findall("PubmedArticle")]


def main() -> int:
    ids = esearch()
    time.sleep(0.4)
    publications = efetch(ids)
    if not publications:
        print("No publications found; leaving file unchanged.", file=sys.stderr)
        return 1
    OUT.write_text(json.dumps(publications, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Updated {OUT} with {len(publications)} PubMed records.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
