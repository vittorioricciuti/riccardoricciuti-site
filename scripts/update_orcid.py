#!/usr/bin/env python3
"""Aggiorna data/publications.json dal profilo ORCID pubblico.

Il deploy GitHub Pages esegue questo script prima della pubblicazione. Se ORCID non
risponde, il sito mantiene il file JSON già presente, evitando interruzioni del deploy.
"""
from __future__ import annotations
import json, pathlib, re, sys, urllib.request
ORCID = "0000-0003-4970-2065"
OUT = pathlib.Path(__file__).resolve().parents[1] / "data" / "publications.json"
API = f"https://pub.orcid.org/v3.0/{ORCID}/works"
HEADERS = {"Accept": "application/vnd.orcid+json", "User-Agent": "ricciuti-site/1.0"}

def get_json(url: str):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))

def pick_title(title_obj):
    if not title_obj: return ""
    t = title_obj.get("title") or {}
    return t.get("value", "")

def tags_for(text: str):
    text = text.lower()
    tags=[]
    rules=[('DBS',r'deep brain stimulation|\bdbs\b|subthalamic|brain sense'),('Parkinson',r'parkinson'),('Spine',r'spine|spinal|vertebral|lumbar|cervical'),('Pituitary',r'pituitary|pitnet|adenoma|sellar'),('Epilepsy',r'epilep|seizure'),('Monitoring',r'monitoring|neurophysiological'),('VNS',r'vagus|vns'),('Tumors',r'tumou?r|glioma|metasta'),('Awake',r'awake'),('Vascular',r'stroke|aneurysm|hemorrhage|ischa?emic')]
    for tag,pat in rules:
        if re.search(pat,text): tags.append(tag)
    return tags or ['Neurosurgery']

def doi_from(work):
    for ext in (work.get('external-ids') or {}).get('external-id') or []:
        if (ext.get('external-id-type') or '').lower() == 'doi':
            return ext.get('external-id-value') or ''
    return ''

def main():
    try:
        data = get_json(API)
    except Exception as e:
        print(f"ORCID update skipped: {e}", file=sys.stderr); return 0
    pubs=[]; seen=set()
    for group in data.get('group', []):
        summaries = group.get('work-summary') or []
        if not summaries: continue
        w = summaries[0]
        title = pick_title(w.get('title'))
        if not title or title.lower() in seen: continue
        seen.add(title.lower())
        year = (((w.get('publication-date') or {}).get('year') or {}).get('value') or '')
        journal = (w.get('journal-title') or {}).get('value') or ''
        doi = doi_from(w)
        text = ' '.join([title,journal])
        pubs.append({
            'year': year,
            'title': title,
            'authors': '',
            'journal': journal,
            'doi': doi,
            'doiUrl': f'https://doi.org/{doi}' if doi else '',
            'pubmedSearchUrl': 'https://pubmed.ncbi.nlm.nih.gov/?term=' + urllib.request.pathname2url(title),
            'tags': tags_for(text)
        })
    if not pubs:
        print('ORCID returned no works; keeping existing publications.json'); return 0
    pubs.sort(key=lambda x: str(x.get('year','')), reverse=True)
    OUT.write_text(json.dumps(pubs, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Updated {OUT} with {len(pubs)} ORCID works')
    return 0
if __name__ == '__main__': raise SystemExit(main())
