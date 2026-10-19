#!/usr/bin/env python3
"""Validate photographs actually displayed on venue cards (not hidden legacy AI assets)."""
import hashlib
import pathlib
import re
import sys
from collections import defaultdict
from PIL import Image

root = pathlib.Path(__file__).resolve().parents[1]
html = (root / "index.html").read_text(encoding="utf-8")
match = re.search(r"const LICENSED_VENUE_PHOTOS=\{(.*?)\};", html, re.S)
if not match:
    sys.exit("ERROR: licensed venue photo registry missing")
entries = re.findall(r"\b([a-z]\d+):\{url:\"([^\"]+)\"", match.group(1))
issues = []
if not entries:
    issues.append("No displayed licensed photos found; check registry parser")
metadata_entries = re.findall(r'\\b([a-z]\\d+):\\{([^{}]+)\\}', match.group(1))
if len(metadata_entries) != len(entries):
    issues.append(f"Photo registry parse mismatch: {len(metadata_entries)} objects vs {len(entries)} image URLs")
for venue_id, fields in metadata_entries:
    for required in ('source', 'credit', 'license', 'licenseUrl'):
        if not re.search(r'\\b' + required + r':"[^"]+"', fields):
            issues.append(f"{venue_id}: missing {required} attribution field")
    for field in ('source', 'licenseUrl'):
        value = re.search(r'\\b' + field + r':"([^"]+)"', fields)
        if value and not value.group(1).startswith("https://"):
            issues.append(f"{venue_id}: {field} must use HTTPS")
ids = [key for key, _ in entries]
if len(ids) != len(set(ids)):
    issues.append("Duplicate licensed venue IDs")
url_ids = defaultdict(list)
hash_ids = defaultdict(list)
local_count = 0
for venue_id, url in entries:
    url_ids[url].append(venue_id)
    if url.startswith("http"):
        if not url.startswith("https://"):
            issues.append(f"{venue_id}: insecure external image URL")
        continue
    if not url.startswith("assets/photos/") or ".." in url:
        issues.append(f"{venue_id}: unsafe image path {url}")
        continue
    path = root / url
    if not path.is_file():
        issues.append(f"{venue_id}: missing local photo {url}")
        continue
    local_count += 1
    try:
        with Image.open(path) as img:
            if img.width < 320 or img.height < 240:
                issues.append(f"{venue_id}: image too small")
            img.verify()
        hash_ids[hashlib.sha256(path.read_bytes()).hexdigest()].append(venue_id)
    except Exception as exc:
        issues.append(f"{venue_id}: unreadable image: {exc}")
for url, keys in url_ids.items():
    if len(keys) > 1:
        issues.append(f"Same photo URL reused for {', '.join(keys)}: {url}")
for keys in hash_ids.values():
    if len(keys) > 1:
        issues.append(f"Identical local photo bytes for {', '.join(keys)}")
print(f"Displayed licensed photos: {len(entries)}; local decoded: {local_count}; external: {len(entries)-local_count}")
print("Note: external URL availability and venue identity require separate live/manual verification.")
for issue in issues:
    print("ERROR:", issue)
if issues:
    sys.exit(1)
print("PASS: displayed photo registry has no repeated URLs, and local photos decode")
