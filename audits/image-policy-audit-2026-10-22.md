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

## Owner follow-up (2026-10-22 10:26 JST): publish stock, remove all duplicates
The owner asked to publish the stock photos as-is and to replace every duplicated AI image.

**Duplicates withdrawn (24 more AI mappings, issue `duplicate`):** r04 r29 r31 r32 r33 r36 r37 r38 r41 r44 (one sushi-chef image), r05 r34 r42 (second chef image), a27 a31 r52 (matcha set), a26 a39 (tea), a28 a37 (calligraphy), a29 a36 (samurai), w05 w06 (onsen). r32 r34 a36 already show approved photos. Total quarantined: 42 of 50; 6 unique AI tiles remain (r45 r49 r51 a30 a32 a40).

**Stock published: 29 venues, 29 different photos** (no image appears on two cards). Each photo page was read on 2026-10-22 and states it is free to use under the Unsplash License (commercial use; credit shown though not required). Records carry `ownerApproved:"2026-10-22"`; `fileVerified` and `contentVerified` stay **false** because image CDNs were unreachable from the build sandbox, so no one has looked at these pixels yet. CI on GitHub requires each to decode (naturalWidth > 0); a load failure shows the SVG instead.

| Venue | Photographer | Unsplash page |
|---|---|---|
| r01 Udatsu Sushi | MChe Lee | https://unsplash.com/photos/tuna-nigiri-sushi-with-lime-on-a-plate-0GLzjcRBJQ8 |
| r02 Sushi Takeuchi | HANVIN CHEONG | https://unsplash.com/photos/tuna-sushi-with-ginger-and-wasabi-on-wooden-plate-Jm5uc0Z-5MQ |
| r39 Sushi Yuji | kimia kazemi | https://unsplash.com/photos/a-black-plate-topped-with-sushi-covered-in-sauce-6h67YVuQggI |
| r40 Ikina Sushi Dokoro Abe Hiroo Bekkan | Tadahiro Higuchi | https://unsplash.com/photos/a-variety-of-sushi-on-a-black-plate-6ZLJkVvqcB4 |
| r43 Sushi Ebisu KOURIN | Marina Grynykha | https://unsplash.com/photos/sushi-on-black-ceramic-plate-FBgCgJhPO2I |
| r38 Sushi Somei | Kristina Truniak | https://unsplash.com/photos/a-plate-of-sushi-cDKRNUG4uec |
| r41 Tsukiji Sushiko Ebisu | Derek Duran | https://unsplash.com/photos/sushi-on-white-ceramic-plate-Jz4QMhLvGgw |
| r42 Bikkuri Sushi Ebisu | Andrea Riezzo | https://unsplash.com/photos/a-plate-of-sushi-with-chopsticks-and-a-bowl-of-sauce-I_sG8AZFpNs |
| r44 Ebisu Sushi Shiori-an Yamashiro | Israel Albornoz | https://unsplash.com/photos/a-platter-of-sushi-with-various-toppings-kNH31Q7MDUY |
| r29 Kura Sushi Nakameguro Ekimae | Andrey Câmara | https://unsplash.com/photos/a-plate-of-sushi-and-chopsticks-on-a-table-CTKZoGi-hwU |
| r31 Mawashi Sushi Katsu Midori Seibu Shibuya | Fadya Azhary | https://unsplash.com/photos/sushi-on-wooden-platter-5KS7T3Gs3CA |
| r33 Ganso Sushi Ebisu Ekimae | Riccardo Bergamini | https://unsplash.com/photos/food-photography-of-varieties-of-sushies-O2yNzXdqOu0 |
| r36 Hinatomaru Asakusa Honten | David Foodphototasty | https://unsplash.com/photos/sushi-on-a-wooden-cutting-board-8nFtscE1D_w |
| r37 Kura Sushi Oshiage | Szegedi Attila | https://unsplash.com/photos/a-table-topped-with-plates-of-sushi-and-chopsticks-_0tRthXYh1U |
| r03 Tempura Miyashiro | Markus Winkler | https://unsplash.com/photos/tempura-set-paMbZ0iNka8 |
| r04 Ten-Masa | Lee Soo hyun | https://unsplash.com/photos/tempura--wC0yYRdGIY |
| r05 Tempura Kusunoki | Fernando Andrade | https://unsplash.com/photos/a-white-bowl-filled-with-food-on-top-of-a-table-LiD0OJ3KJ7c |
| r06 Seirinkan | Ari Kurniawan | https://unsplash.com/photos/pizza-being-removed-from-a-wood-fired-oven-zyvkmq1yJBs |
| r08 Il Lupone | Fabrizio Pullara | https://unsplash.com/photos/pizza-baking-in-wood-fired-oven-vHRFraV4U00 |
| r09 Ristorante ASO | engin akyurt | https://unsplash.com/photos/yfs1UJziyoM |
| r11 Yoroniku | Stanley Kustamin | https://unsplash.com/photos/meat-sizzling-on-a-hot-grill-with-steam-rising-oiS-Tjtemvs |
| r52 Nagatacho Ouka | Yosuke Ota | https://unsplash.com/photos/a-japanese-multi-course-meal-with-various-small-dishes-xSHQF1rKaVE |
| a26 Shizu-Kokoro Tea Ceremony | Tiago Ebisui | https://unsplash.com/photos/woman-in-kimono-performs-traditional-tea-ceremony-TmgR2If58HM |
| a27 Tokyo Maikoya Tea Ceremony | Rod Long | https://unsplash.com/photos/woman-prepares-traditional-tea-in-a-serene-setting--Sc01q9zBbw |
| a39 DENTÔ Experiences | Emma THERON | https://unsplash.com/photos/matcha-powder-in-a-wooden-spoon-with-whisk-and-bowl-FqzpQmrHrik |
| a37 Wabunka Cultural Experiences | Qdal Studio | https://unsplash.com/photos/someone-is-whisking-matcha-tea-in-a-bowl-GThopTGQEGc |
| a31 Hasegawa Eiga Sake Tasting | Frederick Shaw | https://unsplash.com/photos/a-group-of-people-pouring-liquid-into-small-cups-kmvUaRxhjb4 |
| a28 Wanariya Indigo Dyeing | Jimmy Liu | https://unsplash.com/photos/wall-display-of-indigo-dyed-fabric-squares-nQX99aOzyXE |
| a29 Ninja Trick House | Daniel Lincoln | https://unsplash.com/photos/xm49F658RyM |

**Candidates rejected** (location-tagged to a real competing business, or an identifiable person/place): Sushiro Taichung conveyor photo (would mislabel Kura Sushi r29), Daikokuya Tempura photo, Japanile restaurant (2 photos), Yun – taste of japan, KIM999 Berlin, a Tokyo "man in chef suit" portrait, Niigata Saito villa tea room, Fushimi Inari water bucket, Rotorua NZ hot pool, snow-monkey onsen photos.

**SVG only (7):** r47 r50 a34 a38 s15 (no fitting generic image), w05 w06 (no generic urban bathhouse photo on Unsplash or Pexels; only named onsen towns or monkeys).

**Official images:** 0. Prior outreach records no reuse grant for these venues; official galleries stay linked.

**Editorial source tiles:** `assets/photos/tsukiji-sushi.webp` (and similar district tiles such as `ginza.webp`, `nihonbashi.webp`) also contain baked "Chuo"/badge text, but no page code references them; the site loads only 5 local photos, all approved. Left untouched as protected originals.
