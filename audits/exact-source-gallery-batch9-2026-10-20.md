# Tokyo Concierge Atelier · exact-original photo & gallery audit · batch 9 (2026-10-20)

## Starting point and preservation contract

Base: `e79156dedf8daa9276dad3c3e4dc098d61dfe79e`. Maintain all **131 existing venue records**, **89 currently registered photo images**, **42 pending illustration cards**, **46 separate external photo/venue links**, and all original styling and EN/JA/KO functionality. Do not replace photos, import external originals, or imply reuse permission from a publisher's web gallery.

This targeted research prioritized **previously less-investigated** experience/tour, traditional workshop, and sumo souvenir records (rather than repeating several rounds of restaurant gallery checks). It checked exact identities and existing original-photo pages. Four replacements improve guest access to original publisher photographs.

| Venue | Previously linked | New original image/page | Provenance and branch |
|---|---|---|---|
| `a28` Wanariya indigo dyeing | Third-party visitor report | https://wanariya.co.jp/gallery/ | **Exact workshop's original operator-hosted gallery**. Official site https://wanariya.co.jp/ links the gallery and provides exact venue address 1-8-10 Senzoku, Taito-ku. Operators retain copyright; commercial file reuse not stated |
| `s15` Ryogoku Takahashi | Jalan visitor-upload photo list | https://www.gotokyo.org/en/new-and-now/new-and-trending/260113/topics.html | **Official Tokyo metropolitan tourism guide** (January 13, 2026) identifies the actual sumo-souvenir store at 4-31-15 Ryogoku and displays its interior, exterior and product pictures. New provenance kind `tourism` labels government tourism editorial distinctly in EN/JA/KO; no reuse license inferred |
| `a29` Ninja Trick House, Shinjuku | Operator access/address only | https://ninja-trick-house.com/ | **Exact operator home presentation** has real in-venue shuriken and sword experience photos, and confirms Kabukicho 2-28-13 4F, Shinjuku (not Asakusa). Keep separate location/no-elevator corrections |
| `a40` Sunrise Tours JTB (operator/service rather than one physical site) | JTB corporate profile about product | https://www.sunrise-tours.jp/en/ | **Operator's official guest-facing product photo catalogue**, with current Tokyo tours and explicit third-party/illustrative credits. Does NOT represent photographs of a single physical venue and remains a source link, not a mapped photo |

## Creative Commons exact-location candidate review: not cleared

1. `a29` Ninja Trick House: https://commons.wikimedia.org/wiki/File:Togakushi_Folk_Museum,_Togakushi_Ninja_Museum,_Ninja_Trick_Mansion.jpg is available under **CC BY-SA 4.0**, credited to **Qurren**, 2019. The photo is explicitly of **Togakushi, Nagano**, and **not** the Shinjuku Kabukicho Ninja Trick House. Reject wrong facility.
2. `r37` Kura Sushi Oshiage: the official https://www.kurasushi.co.jp/oshiage/ shows the exact two-story venue (1-8-23 Oshiage). Official location pages https://shop.kurasushi.co.jp/detail/594 (1F) and https://shop.kurasushi.co.jp/detail/595 (2F) and distinct Tabelog photo pages https://tabelog.com/tokyo/A1312/A131203/13269960/dtlphotolst/smp2/ vs https://tabelog.com/tokyo/A1312/A131203/13270091/dtlphotolst/3/smp2/ clarify different floors. **No file-specific CC license**, and an isolated floor photo should not represent both. Existing correct combined official site kept; it already provides photos and directions.
3. `r49` Grand Hammer BENITSUYA: https://grandhammer.jp/floor-guide/1616/?lang=ko has exact operator photos of 6F BENITSUYA, but is All Rights Reserved. Existing exact link already optimal; do not reproduce.
4. `s15` Tokyo tourism-board editorial includes real store photographs but **not** an open Creative Commons grant for every component or portrait. Keep it off-site.
5. `a28` Wanariya official photo gallery contains customer faces; operator display is not proof of rights held in every picture, or guest consent to redistribution. Keep off-site.
6. `a39` DENTO is Kyoto-based by its operator's own https://dento-japan.co.jp/ contact details. No Tokyo-specific dated product and no single Tokyo venue is confirmed, so do not substitute photos of unrelated craftspeople or Kyoto facilities.
7. Other targeted Commons exact-name searches for `r42`, `r45`, `w05`, `w06`, `a29`, `a34`, `a28`, `s15` found no original matching both named target and an acceptable explicit **CC0/CC BY/CC BY-SA** license. Broad visual similarity, geographic proximity, press image release, CC BY-NC, All Rights Reserved or alternative-brand/branch names are not sufficient.

**New eligible CC-licensed exact-venue photos in this batch: 0.** A targeted search is not a proof that none exists elsewhere. Do not invent a licensed original file. Maintain current 89/131 and 42 unphotographed.

## UI / QA

Added `tourism` provenance source kind, clearly translated as official Tokyo tourism guide for EN/JA/KO. Four external card and detail references open the publisher's page with existing blank-target + opener protections. Tests verify URL+source types, locale labels, no unlicensed new image, and retain existing 131 venue, 89×2 image-loading, iPhone viewport, search and photo filter checks. Existing safety advisories for closed `r31`, private `r52`, and corrected `a29`/`a32` stay unchanged.

Only merge following a green PR Chromium run, then verify actual new main Pages and local/public photo loads.
