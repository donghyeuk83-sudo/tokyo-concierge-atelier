# Image policy audit — 2026-10-22

Trigger: iPhone Safari screenshot showed a baked-in "Chuo" map pin on the Sushi Takeuchi (r02) card.

## Root cause
`assets/photos/ai-unique-r02.webp` (mapped in `AI_VENUE_VISUALS.r02`) is not a Sushi Takeuchi image. It is a generated tile titled "Tsukiji Outer Market" with a "Chuo" pin and an "AI VISUAL · PHOTO" badge baked into the pixels. The card crop hid the title and left "Chuo" visible. Same class of defect as r11 (PR #69).

## Full visual review of all 50 AI files (640×480, full frame + corner crops)
Per-file SHA-256 and verdict: `audits/ai-visual-audit-2026-10-22.csv`. 18 quarantined, 32 clean.

| Defect | IDs |
|---|---|
| Wrong baked-in place title / area pin / badge | r02 r09 r11 r18 r28 r40 r43 r47 s15 |
| `pollinations.ai` watermark | a34 a38 r01 r03 r08 r39 r50 |
| Invented storefront with garbled pseudo-name | r06 r21 (r08 also) |

r18, r21, r28 already show an approved registry photo, so 15 cards changed (to SVG): a34 a38 r01 r02 r03 r06 r08 r09 r11 r39 r40 r43 r47 r50 s15.
Files are kept on disk; only the card mapping is suppressed (protected originals and `atelier-media.js` byte-identical).

Not a defect but noted: many clean AI tiles are near-duplicates (same sushi chef in r04 r05 r29 r31–r38 r41 r42 r44; same matcha set a27 a31 r52; same onsen w05 w06). They carry the "VENUE ILLUSTRATION" label.

## Official images
0 applied. Prior outreach (`photo-permission-*`, `photo-rightsholder-routing-*`) records NO_EXPLICIT_LICENSE_OR_PERMISSION for all 42 pending venues; no new written grant found. Official galleries remain linked via "Photos & venue details".

## Free stock candidates (license verified, NOT yet displayed)
Each Unsplash photo page states "Free to use under the Unsplash License" (commercial use allowed, attribution not required, credit shown anyway). The sandbox could not reach image CDNs, so the file (naturalWidth) and the pixel content (no text/watermark/signage) were NOT verified. They stay hidden (`fileVerified`/`contentVerified` false) until a person opens each link and confirms.

| Key | Venues | Photographer | Page |
|---|---|---|---|
| sushi | r01 r02 r39 r40 r43 | HANVIN CHEONG | https://unsplash.com/photos/tuna-sushi-with-ginger-and-wasabi-on-wooden-plate-Jm5uc0Z-5MQ |
| tempura | r03 | Markus Winkler | https://unsplash.com/photos/tempura-set-paMbZ0iNka8 |
| pizza | r06 r08 | Ari Kurniawan | https://unsplash.com/photos/pizza-being-removed-from-a-wood-fired-oven-zyvkmq1yJBs |
| italian | r09 | engin akyurt | https://unsplash.com/photos/yfs1UJziyoM |
| yakiniku | r11 | Stanley Kustamin | https://unsplash.com/photos/meat-sizzling-on-a-hot-grill-with-steam-rising-oiS-Tjtemvs |

Rejected: a Shinjuku robata photo for r47 (location-tagged real restaurant — could be mistaken for another business). No candidate for r50, s15, a34, a38 (no generic image fits without identifiable people/venues).

To enable one: confirm visually, set `fileVerified:true` and `contentVerified:true` in `assets/atelier-image-policy.js`, bump its `?v=` in `index.html`, run CI (the 4-combo sweep then checks naturalWidth on the live CDN).
