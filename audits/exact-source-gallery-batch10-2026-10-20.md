# Tokyo Concierge Atelier — Batch 10 exact-venue gallery and commercial CC audit
Reviewed 2026-10-20 · base main `bdac0d576beda495e8d1a96c9847e9452c51c87c`

## Dataset and licensing guarantee

Existing **131 venue records, 89 image mappings, 42 missing-photo illustrations, 46 linked photo sources, EN/JA/KO, design and venue alerts** must remain unchanged. Only four photo-source records and regression tests are modified. Source pages are **links**, not per-file redistribution permission. Neither image URLs nor file binaries were copied to the hotel website.

## Confirmed exact venues and updated links

| ID | Exact documented subject | New source (not a cleared upload) | Evidence / why |
|---|---|---|---|
| `r32` | Kanazawa Maimon Sushi Shibuya PARCO branch, 7F, 15-1 Udagawacho, Shibuya | https://tabelog.com/tokyo/A1303/A130301/13240931/dtlphotolst/3/smp2/ | Tabelog interior photo tab: 34 images (including five by venue), address and branch label match; previous chain operator branch page was less photo-focused. The gallery includes third-party guest photos, so `listing` provenance is mandatory. |
| `r47` | Roppongi Robataya, 1F Kyowa Building Nishikan, Roppongi 4-4-3 | https://tabelog.com/tokyo/A1307/A130701/13025665/dtlphotolst/3/smp2/ | Tabelog interior tab shows **11 interior images**, some venue-provided. Original `https://www.roppongi-robataya.com/information/` was mostly an access/seat-info page; restaurant's own access page and Tabelog show matching business and address. |
| `a34` | THE SUMO LIVE RESTAURANT HIRAKUZA GINZA TOKYO, 1-9-13 Ginza, B1 | https://hirakuza.net/tokyo/news/202601113508/ | **Original official operator report of the January 7, 2026 Ginza branch opening**, containing real launch-day sumo performance and guest photos. Unlike the broad homepage, documented live photographs identify the exact venue, not Osaka HIRAKUZA. No implicit person/press reuse consent. |
| `a27` | MAIKOYA tea ceremonies in Tokyo (Asakusa and Shinjuku operator, multi-site concept) | https://mai-ko.com/culture/tea-ceremony/tokyo.html?locale=en | MAIKOYA original Tokyo-only tea-ceremony overview has specific experience photographs and booking paths for Asakusa and Shinjuku; the catalogue is for the combined Tokyo provider, not an invented single location. Retain `operator` provenance. |

## Targeted Commons original-file screening

- **CC0** source `File:Robataya Ginmasa Shinjuku-Nomura-building branch 2018-02-21.jpg`, author **Asanagi**: original photographed venue is **Robataya Ginmasa / Shinjuku Nomura Building B2**, not **Roppongi Robataya** at 4-4-3 Roppongi. Despite CC0 allowing commercial use, reject as wrong subject. https://commons.wikimedia.org/wiki/File:Robataya_Ginmasa_Shinjuku-Nomura-building_branch_2018-02-21.jpg
- **Public-domain** source `File:Seirinkan High School Hommachi Campus.JPG`, author **Abasaa**, photographed in **Tsushima, Aichi**: is a high school (清林館高等学校), not Seirinkan **pizza restaurant** in Nakameguro (`r06`). Reject. https://commons.wikimedia.org/wiki/File:Seirinkan_High_School_Hommachi_Campus.JPG
- **CC BY-SA-4.0** source `File:Edomaezushi-Hinatomaru---2025-08-28 010.jpg` in prior batch is Hinatomaru at **Tokyo Station Gransta**, not Asakusa Honten; rejected in preceding audit.
- **CC0** source `File:Robataya Ginmasa Shinjuku-Nomura-building branch 2018-02-21.jpg` is not the same business despite similar 'Robataya' prefix; avoid image substitution.
- Exact-name Wikimedia Commons searches also considered Ristorante ASO Daikanyama, MAIKOYA Tokyo, Hirakuza Ginza, Kanazawa Maimon Sushi Shibuya, Tokyo Somei Onsen SAKURA, Ninja Tokyo Otemachi, Shimizuyu and Kura Oshiage; no eligible per-file CC0/CC BY/CC BY-SA proof tied to an exact documented subject was obtained. This targeted sample does **not** prove such photographs do not exist on all repositories.
- **New original photo clearances: zero**, **new published photographs: zero**; no proof of author/permission/subject combined for a new image. Images on independent listing or owner website remain third-party copyrighted until a specific reuse grant.

## QA contract

PR Chromium checks source URLs/hosts/paths/optional locale parameter; correctly labels `listing` vs `operator`; card link, modal link, pending illustrated state and no new photo mapping. Existing 131 venue rights, 89 image loading, iPhone width, EN/JA/KO, search, filters, shortlist, CSV and JavaScript runtime smoke retained. Commit/merge only on success, then verify deployed Pages exact commit and 178 of 178 photo loads (local + public).
