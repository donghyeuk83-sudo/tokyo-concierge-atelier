#!/usr/bin/env python3
"""Add manually supplied venue photos.

Usage (local):  python scripts/manual-photo-intake.py --metadata meta.txt
In CI the metadata comes from the pull-request description (env PR_BODY).

Images are read from assets/manual-photos/inbox/<venueId>[-anything].<jpg|jpeg|png|webp|heic|heif>.
Each is validated, resized to <=1280px, re-encoded as WebP (all EXIF/GPS metadata dropped),
saved as assets/manual-photos/<venueId>.webp, recorded in registry.json, and the browser
registry assets/atelier-manual-photos.js is regenerated. Existing photos are never
overwritten unless the metadata says `replace: <venueId>`.

Metadata lines (one per line, case-insensitive keys):
  credit: Who took or supplied the photo (shown on the card)
  rights: Why it may be published, e.g. "Owner's own photo" or "Written permission from the venue, 2026-10-22"
  source: official | owner        (official = supplied by the venue/operator; default owner)
  actual: yes | no                (does it show this exact venue? default yes)
  permission: https://...         (optional link to the permission or source)
  alt: short description          (optional)
  replace: r02                    (optional, required to replace an existing photo)
"""
import argparse, datetime, json, os, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INBOX = ROOT / 'assets/manual-photos/inbox'
OUT_DIR = ROOT / 'assets/manual-photos'
REGISTRY = OUT_DIR / 'registry.json'
JS_OUT = ROOT / 'assets/atelier-manual-photos.js'
ROW = re.compile(r'^\["([a-z]\d+)","([a-z]+)","((?:[^"\\]|\\.)*)"', re.M)
EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'}
MAX_BYTES = 25 * 1024 * 1024


def fail(msg):
    print('::error title=Manual photo intake::' + msg if os.environ.get('GITHUB_ACTIONS') else 'ERROR: ' + msg)
    sys.exit(1)


def venue_ids():
    ids = {}
    for f in ('assets/atelier-catalog.js', 'assets/atelier-catalog-additions.js'):
        for m in ROW.finditer((ROOT / f).read_text(encoding='utf8')):
            ids[m.group(1)] = m.group(3)
    return ids


def licensed_ids():
    media = (ROOT / 'assets/atelier-media.js').read_text(encoding='utf8')
    start = media.index('const LICENSED_VENUE_PHOTOS={')
    block = media[start:media.index('};', start)]
    return set(re.findall(r'^([a-z]\d+):\{', block, re.M))


def parse_meta(text):
    meta = {}
    for line in (text or '').splitlines():
        m = re.match(r'^\s*[-*]?\s*(credit|rights|source|actual|permission|alt|replace)\s*[:：]\s*(.+?)\s*$', line, re.I)
        if m:
            meta[m.group(1).lower()] = m.group(2)
    return meta


def write_js(photos):
    body = ',\n'.join(json.dumps(p['venueId']) + ':' + json.dumps(p, ensure_ascii=False, separators=(',', ':')) for p in photos)
    JS_OUT.write_text(
        '// Tokyo Concierge Atelier — manually added venue photos.\n'
        '"use strict";\n'
        '// GENERATED from assets/manual-photos/registry.json by scripts/manual-photo-intake.py. Do not edit by hand.\n'
        '// Shown after an approved registry photo and before stock (see atelier-image-policy.js).\n'
        'const MANUAL_VENUE_PHOTOS={\n' + body + ('\n' if body else '') + '};\n', encoding='utf8')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--metadata', help='file with metadata lines (default: env PR_BODY)')
    ap.add_argument('--regenerate-only', action='store_true')
    a = ap.parse_args()
    reg = json.loads(REGISTRY.read_text(encoding='utf8'))
    photos = {p['venueId']: p for p in reg['photos']}
    if a.regenerate_only:
        write_js(sorted(photos.values(), key=lambda p: p['venueId']))
        return
    files = sorted(p for p in INBOX.iterdir() if p.suffix.lower() in EXTS) if INBOX.exists() else []
    if not files:
        print('No photos in inbox; nothing to do.')
        return
    meta = parse_meta(Path(a.metadata).read_text(encoding='utf8') if a.metadata else os.environ.get('PR_BODY', ''))
    credit, rights = meta.get('credit', '').strip(), meta.get('rights', '').strip()
    if len(credit) < 2:
        fail('Add a line "credit: <who took or supplied the photo>" to the pull-request description.')
    if len(rights) < 10:
        fail('Add a line "rights: <why this photo may be published>" (e.g. "Owner\'s own photo") to the pull-request description.')
    source = meta.get('source', 'owner').strip().lower()
    if source not in ('official', 'owner'):
        fail('source must be "official" or "owner".')
    actual = meta.get('actual', 'yes').strip().lower() not in ('no', 'n', 'false', '아니오', 'いいえ')
    permission = meta.get('permission', '').strip()
    if permission and not permission.startswith('https://'):
        fail('permission must be an https:// link.')
    replace = {x.strip() for x in meta.get('replace', '').split(',') if x.strip()}
    ids, licensed = venue_ids(), licensed_ids()

    from PIL import Image, ImageOps
    try:
        import pillow_heif
        pillow_heif.register_heif_opener()
    except ImportError:
        pass
    today = datetime.date.today().isoformat()
    for f in files:
        vid = re.match(r'^([a-z]\d+)', f.name)
        vid = vid.group(1) if vid else ''
        if vid not in ids:
            fail(f'{f.name}: file name must start with an existing venue ID (e.g. r02.jpg).')
        if vid in licensed:
            fail(f'{f.name}: {vid} already shows an approved registry photo, which always takes priority.')
        if vid in photos and vid not in replace:
            fail(f'{f.name}: {vid} already has a manual photo. Add "replace: {vid}" to replace it.')
        if f.stat().st_size > MAX_BYTES:
            fail(f'{f.name}: larger than 25 MB.')
        try:
            with Image.open(f) as im:
                im = ImageOps.exif_transpose(im).convert('RGB')
        except Exception as e:  # unreadable or not an image
            fail(f'{f.name}: not a readable image ({e}).')
        if min(im.size) < 320:
            fail(f'{f.name}: too small ({im.size[0]}x{im.size[1]}); at least 320px on the short side.')
        im.thumbnail((1280, 1280))
        dest = OUT_DIR / f'{vid}.webp'
        im.save(dest, 'WEBP', quality=82, method=6)  # no exif= argument: metadata (incl. GPS) is dropped
        rec = {'venueId': vid, 'file': f'assets/manual-photos/{vid}.webp', 'sourceType': source,
               'credit': credit, 'rightsBasis': rights, 'isActualVenue': actual,
               'alt': meta.get('alt', '').strip() or ids[vid], 'addedOn': today,
               'width': im.size[0], 'height': im.size[1]}
        if permission:
            rec['permissionUrl'] = permission
        photos[vid] = rec
        f.unlink()
        print(f'Added {vid}: {dest.relative_to(ROOT)} {im.size[0]}x{im.size[1]}')
    reg['photos'] = sorted(photos.values(), key=lambda p: p['venueId'])
    REGISTRY.write_text(json.dumps(reg, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
    write_js(reg['photos'])


if __name__ == '__main__':
    main()
