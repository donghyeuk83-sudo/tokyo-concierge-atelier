#!/usr/bin/env python3
"""Validate photographs actually displayed on venue cards (not hidden legacy AI assets)."""
import hashlib
import pathlib
import re
import sys
from collections import defaultdict
from PIL import Image

root = pathlib.Path(__file__).resolve().parents[1]
html = (root / "assets/atelier-media.js").read_text(encoding="utf-8")
catalogue = (root / "assets/atelier-catalog.js").read_text(encoding="utf-8")
match = re.search(r"const LICENSED_VENUE_PHOTOS=\{(.*?)\};", html, re.S)
if not match:
    sys.exit("ERROR: licensed venue photo registry missing")
entries = re.findall(r"\b([a-z]\d+):\{url:\"([^\"]+)\"", match.group(1))
issues = []
if not entries:
    issues.append("No displayed licensed photos found; check registry parser")
metadata_entries = re.findall(r'\b([a-z]\d+):\{([^{}]+)\}', match.group(1))
if len(metadata_entries) != len(entries):
    issues.append(f"Photo registry parse mismatch: {len(metadata_entries)} objects vs {len(entries)} image URLs")
for venue_id, fields in metadata_entries:
    for required in ('source', 'credit', 'license', 'licenseUrl'):
        if not re.search(r'\b' + required + r':"[^"]+"', fields):
            issues.append(f"{venue_id}: missing {required} attribution field")
    license_match = re.search(r'\blicense:"([^"]+)"', fields)
    license_url_match = re.search(r'\blicenseUrl:"([^"]+)"', fields)
    if license_match and license_url_match:
        label = license_match.group(1)
        url = license_url_match.group(1).rstrip("/")
        accepted = {
            "CC0 1.0": "https://creativecommons.org/publicdomain/zero/1.0",
            "Public domain": "https://creativecommons.org/publicdomain/mark/1.0",
            "CC BY 2.0": "https://creativecommons.org/licenses/by/2.0",
            "CC BY 2.5": "https://creativecommons.org/licenses/by/2.5",
            "CC BY 4.0": "https://creativecommons.org/licenses/by/4.0",
            "CC BY-SA 2.0": "https://creativecommons.org/licenses/by-sa/2.0",
            "CC BY-SA 3.0": "https://creativecommons.org/licenses/by-sa/3.0",
            "CC BY-SA 4.0": "https://creativecommons.org/licenses/by-sa/4.0",
            "CC BY-ND 2.0": "https://creativecommons.org/licenses/by-nd/2.0",
        }
        if label not in accepted or url != accepted[label]:
            issues.append(f"{venue_id}: unrecognized or mismatched photo license {label} / {url}")

    for field in ('source', 'licenseUrl'):
        value = re.search(r'\b' + field + r':"([^"]+)"', fields)
        if value and not value.group(1).startswith("https://"):
            issues.append(f"{venue_id}: {field} must use HTTPS")
# Every licensed photo must point to an actual card in the published DATA registry.
data_match = re.search(r"const DATA=\[(.*?)\]\.map\(", catalogue, re.S)
if not data_match:
    data_match = re.search(r"const DATA=\[(.*?)\];", catalogue, re.S)
if not data_match:
    issues.append("Could not locate venue DATA registry")
else:
    venue_ids = set(re.findall(r'\["([a-z]\d+)",', data_match.group(1)))
    if not venue_ids:
        issues.append("No venue IDs parsed from DATA registry")
    for venue_id, _ in entries:
        if venue_id not in venue_ids:
            issues.append(f"{venue_id}: photo does not match any published venue card")

# Report coverage gaps without treating absent, unlicensed photos as errors.
if data_match:
    card_rows = re.findall(r'\["([a-z]\d+)","[^"]+","([^"]+)"', data_match.group(1))
    photo_ids = {venue_id for venue_id, _ in entries}
    missing_cards = [(venue_id, name) for venue_id, name in card_rows if venue_id not in photo_ids]
    print(f"Venue photo coverage: {len(photo_ids)}/{len(card_rows)} cards; missing: {len(missing_cards)}")
    for venue_id, name in missing_cards:
        print(f"PHOTO NEEDED: {venue_id} | {name} (use only venue-matched, reuse-cleared media)")

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
