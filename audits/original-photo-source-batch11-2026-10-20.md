# Tokyo Concierge Atelier · batch 11 original photo-source review
Date: 2026-10-20
Base: `b6747ef7b5737ae7ee98344854e185aecd3d66d6`

## Preservation / rights

- Keep 131 venue catalogue rows, 89 existing licensed photo mappings, 42 pending-photo illustrations, 46 photo-source records, the original styling and multilingual EN/JA/KO interactions. These are hard constraints, including previously approved photos (do not mistake a photographed venue for an unphotographed venue).
- This batch reviewed original source candidates for additional unphotographed attractions, tea experiences, shops, cultural agencies, sushi venues, and operator pages. Confirmed **zero NEW photographs** with both (a) a specific original author/file and explicit CC0 / CC BY / CC BY-SA terms permitting commercial redistribution and (b) direct evidence of the **correct** target and physical branch. Therefore do not add any new image mappings or republish the source pages' copyrighted images.
- All three improvements below are links to operator-hosted **original viewable photos**, **not** permissions to republish their image files.

| Target ID | Original official photo page | Correct venue identification / rights |
|---|---|---|
| `r44` Ebisu Sushi Shiori-an Yamashiro | https://shiorian-yamashiro.com/ebisu/space/ | The operator's dedicated **Ebisu store interior and atmosphere photo gallery**, accessible from its exact Ebisu restaurant homepage, not its Ginza, Shinjuku, Nagoya, Osaka or Kichijoji branches. Exact Ebisu site confirms 1-8-1 Ebisu-minami, STM Ebisu Building 3F-A. Source footer: All Rights Reserved. Previously generic `/ebisu/about/` page linked cuisine/restaurant story rather than its seven original ambience pictures. |
| `a26` Shizu-Kokoro, tea ceremony | https://shizukokoro.com/chado-workshop | Official operator **photo-rich workshop walkthrough**, showing actual tearoom, preparation, confection, ceremony, instructor and hands-on tea session at **2-3-12 Kotobuki, Taito-ku**, as confirmed by the same current page; formerly generic landing page `/lp/`. An older 2019 paper flyer placed the school at **1-9-8 Nishi Asakusa**, so **do not** use historic brochure site exterior as if it showed the present physical branch. No original photo's commercial Creative Commons redistribution license verified. |
| `a30` BAC Asakusa (formerly BUB Activity Center) | https://bub-activitycenter.com/ | Current original operator **BAC (Beyond Activities)** publishes current Asakusa craft/samurai/sharpening/archery/lantern activities and authentic images. Independent Tourism Expo Japan 2026 listing explicitly records "BAC (former BUB ACTIVITY CENTER)" and Tokyo Asakusa operation. Old linked PR TIMES article was press copy rather than current operator galleries. Mark provenance `operator`, not `press`. Service has multiple city locations (Osaka/Tokyo): do not claim pictures of Osaka belong to Asakusa. No commercial CC photo grant found. |

## Additional photo lead checks

- `a31` Hasegawa Eiga Roppongi: https://info.hasegawaeiga.com/storeinfo/ remains the **exact original** information and has a preview image. Japanese operator page specifically requires existing member introduction/accompaniment to book the Roppongi sake experience, even though retail sales are open without referral. English version has less explicit wording; the Japanese restriction is safer. Do not replace with generic public-booking claims. Seasonal operator-news photographs are **All Rights Reserved**.
- `a38` Deeper Japan: https://www.deeperjapan.com/tokyo/ is the operator's photo-rich **multi-venue Tokyo experiences collection**; e.g. https://www.deeperjapan.com/tokyo/p/wagashi-making-tea-ceremony documents a Kagurazaka session. A photo from one workshop cannot accurately illustrate the entire provider as a single physical location; keep the operator's Tokyo overview link.
- `r50` MoonFlower Sagaya Ginza uses https://moonflower-sagaya.com/en/artwork/ already: purpose-specific operator artwork page, not a reason to copy copyrighted teamLab photos.
- `a39` DENTÔ https://dento-japan.co.jp/ is a Kyoto-based operator with Tokyo specific date/venue unverified in the prior rights audits. Do not replace its photos with unrelated Tokyo/Kyoto workshops.
- `r31` closed Katsu Midori Seibu Shibuya and `r52` members-only Nagatacho Ouka remain unillustrated with prior venue safety warnings, not invented live venue galleries.
- `w05` Shimizuyu, `w06` SAKURA, `a28` Wanariya, `s15` Ryogoku Takahashi and dozens of branch-specific restaurant originals already have exact host/gallery links from previous batches; do not churn those sources.

## Commons attribution and subject screening

- Exact-name search on Wikimedia Commons/Google indexing for **Shizu-Kokoro, BUB Activity Center Asakusa, Wabunka Tokyo, MAIKOYA Tokyo, Ebisu Shiori-an Yamashiro, MoonFlower Sagaya Ginza, Hasegawa Eiga Roppongi, Katsu Midori Shibuya** did not yield a demonstrably usable new original file with **identified author + per-file commercial CC0/CC BY/CC BY-SA + precise target venue/branch**.
- Results frequently included unrelated similarly named sites or generic Tokyo photos; rights of the site index, Commons' CC0 structured metadata, and original page's mere public visibility are **not rights to copy an individual photograph**.
- Do not infer rights from a press release, a tourism page, a restaurant's website, an operator promotion, or a Commons search snippet.
- This is a focused batch, not proof that no suitable file exists anywhere. Continue collecting explicit rights-holder permission when appropriate.

## UI and tests

Change only three source URLs and one source-kind classification, plus add Chromium assertions. Preserve all previous imagery/layout and data. Regression verifies exact host/path, link visibility in card and modal, source-kind localized label and no new licensed mapping. Legacy r44 direct-photo path check updated to the correct exact Ebisu interior gallery; legacy a30 press-type assertion corrected to current operator site. All pre-existing rights-ledger, 131 catalogue, 89 photos, all languages, filters, mobile viewport and original image loading checks remain enabled.

Only merge on green PR Chromium; then verify current-main GitHub Pages deployment and full local/deployed image-load success.
