#!/usr/bin/env python3
"""Validate all AI venue photo links against actual decodable WebP files."""
import hashlib
import pathlib
import re
import sys
from collections import defaultdict
from PIL import Image

root = pathlib.Path(__file__).resolve().parents[1]
html = (root / "index.html").read_text(encoding="utf-8")
match = re.search(r"const AI_VENUE_VISUALS=\\{(.*?)\\};", html, re.S)
if not match:
    sys.exit("ERROR: AI_VENUE_VISUALS registry missing")
entries = re.findall(r"\\b([a-z]\\d+):\\{url:'([^']+)'\\}", match.group(1))
issues = []
if len(entries) != 50 or len(set(k for k, _ in entries)) != 50:
    issues.append(f"Expected 50 distinct cards; got {len(entries)}")
hashes = defaultdict(list)
for venue_id, relative in entries:
    if not re.fullmatch(r"assets/photos/ai-unique-[a-z]\\d+\\.webp", relative):
        issues.append(f"{venue_id}: unexpected image path {relative}")
        continue
    if pathlib.PurePosixPath(relative).stem != f"ai-unique-{venue_id}":
        issues.append(f"{venue_id}: image assigned to wrong card")
    path = root / relative
    if not path.is_file():
        issues.append(f"{venue_id}: missing file {relative}")
        continue
    try:
        with Image.open(path) as image:
            if image.format != "WEBP" or image.width < 320 or image.height < 240:
                issues.append(f"{venue_id}: invalid image format or dimensions")
            image.verify()
        hashes[hashlib.sha256(path.read_bytes()).hexdigest()].append(venue_id)
    except Exception as exc:
        issues.append(f"{venue_id}: image decode failed: {exc}")
for ids in hashes.values():
    if len(ids) > 1:
        issues.append(f"Identical image bytes for cards: {', '.join(ids)}")
print(f"Validated {len(entries)} photo cards, {len(hashes)} distinct WebP files")
for issue in issues:
    print("ERROR:", issue)
if issues:
    sys.exit(1)
print("PASS: all photo links resolve to valid, byte-distinct WebP files")
