# Venue-photo clearance queue — 2026-10-19

Only place-specific photography with a **confirmed file-level license** may enter `LICENSED_VENUE_PHOTOS` in `index.html`. An accessible image or official venue URL is not permission to embed it. Record the author, file-specific source link, CC/Public Domain license and target venue ID before publishing. A building in the same neighborhood, another branch of a chain, or a food illustration is **not** a verified image of that venue.

Current source registry (2026-10-21): **131 venue cards, 89 registered photographic entries, and 42 without verified reusable photographs**. The older 83/48 figures below are historical, not current. See [photo research batch 14](../audits/photo-research-batch14-2026-10-21.md) for current rights-pending exact-site gallery leads. The registry checks do **not** prove all 83 source pages are alive, correctly licensed or visually matched to the venue. GitHub Actions reports IDs of cards still needing photos.

| Venue ID | Target | Candidate evidence | Reuse clearance | Next action |
| --- | --- | --- | --- | --- |
| a33 | JIDAIYA Rickshaw Asakusa | [Wikimedia Commons original photo](https://commons.wikimedia.org/wiki/File:Rickshawers_by_malias_in_Asakusa,_Tokyo.jpg) explicitly identifies the subjects as rickshaw drivers at Asakusa Jidaiya in Kaminarimon, taken 2007-01-28; [Asakusa Merchants Association](https://asakusa-shoren.jp/en/stores/1629/) confirms Jidaiya at Kaminarimon 2-3-5. | **CLEARED AND PUBLISHED**: Flickr-sourced Commons file independently reviewed by FlickreviewR (2007-05-28) as CC BY 2.0. Credited photographer malias (Gideon). Photo depicts historic drivers, **not** a present-day storefront. | Confirmed source + attribution; verify a33 naturalWidth in deployed Chromium smoke test for commit c0076a496. |
| r28 | YEBISU BAR STAND Garden Place | [Wikimedia Commons original photo by RuinDig/Yuki Uchida](https://commons.wikimedia.org/wiki/File:Ebisu-Tokyo---2024-08-28_106.jpg), taken 2024-08-28: caption explicitly identifies YEBISU BAR STAND in Ebisu 4-chome at Yebisu Garden Place. [Garden Place operator listing](https://gardenplace.jp/shop/detail/39) independently confirms exact venue. | **CLEARED AND PUBLISHED**: original uploader's CC BY 4.0 permits commercial reuse with attribution; card r28 credits author and links license. | **Verified:** [Chromium browser smoke run 39222156960](https://github.com/donghyeuk83-sudo/tokyo-concierge-atelier/actions/runs/39222156960) succeeded for deployed Pages, including r28 at 960px natural image width. |
| r06 | Seirinkan, Nakameguro | [Japan Travel venue photograph by Dennis Amith](https://en.japantravel.com/guide/tokyo-s-top-rated-pizza-restaurants/68889) and [Flickr photograph by yusheng](https://www.flickr.com/photos/yusheng/6225457113) | **REJECTED**: the former is CC BY-NC 2.0 (noncommercial only); the latter is All rights reserved | Obtain photographer permission or find a commercially reusable, venue-matched CC file |
| r09 | Ristorante ASO, Daikanyama | [Exact venue Flickr photograph by Iyhon Chiu](https://www.flickr.com/photos/iyhon/18181444855), dated 2014 | **REJECTED**: the original Flickr file states *All rights reserved* | Obtain explicit photographer permission or find a CC-licensed image of the same restaurant |
| r37 | Kura Sushi Oshiage | [Commons CC BY-SA 4.0 photo](https://commons.wikimedia.org/wiki/File:Kura_sushi_s20250820_201056.jpg) explicitly captions the location as **Nagoya Moriyama-ku**; [another Commons CC BY 2.0 photo](https://commons.wikimedia.org/wiki/File:Sushi_(Kura_Sushi._Costa_Mesa,_CA.).jpg) is from **Costa Mesa, California** | **REJECTED FOR THIS VENUE**: commercial-use licenses are acceptable, but neither image depicts Oshiage | Require Oshiage branch-specific evidence and a file-level reuse license |
| r48 | NINJA TOKYO, Otemachi | [Official venue site](https://ninja-tokyo.jp/) identifies restaurant | **NOT CLEARED**: photos from the restaurant site have no confirmed reuse grant | Seek a suitably licensed Otemachi venue photograph |
| w05 | Musashi-Koyama Onsen Shimizuyu | [Tokyo Sento Association venue page](https://www.1010.or.jp/map-en/item/item-cnt-417) identifies 3-9-1 Koyama | **NOT CLEARED**: venue-page photography has no confirmed CC license | Seek photographer-granted reuse or CC image of the exact bathhouse |
| r45 | Zauo Shibuya | [Operator's branch-specific information](https://www.zauo.com/) | **NOT CLEARED**: official photos are not automatically available for reuse | Verify license for the exact Shibuya branch |


### Candidate screening update (2026-10-19)

- `r37`: Wikimedia Commons' **Kura sushi s20250820 201056.jpg** is CC BY-SA 4.0 but its file caption, camera coordinates and categories identify **Moriyama-ku, Nagoya**, not the Oshiage flagship. The **Sushi (Kura Sushi. Costa Mesa, CA.).jpg** file is CC BY 2.0 but likewise not the Oshiage branch. Neither should be installed in `r37`.
- `r48`: A [Commons photo labeled Otemachi](https://commons.wikimedia.org/wiki/File:Otemachi_@_Tokyo_(9479869370).jpg) is CC BY 2.0, but the description does not establish that it depicts **NINJA TOKYO**. Rejected for this venue.
- `w05`: [Minami-Aoyama Shimizuyu gallery](https://shimizuyu.jp/gallery) is **a different bathhouse** from Musashi-Koyama Shimizuyu. Do not reuse its imagery even if separately permitted.
- Current review produced **no photo cleared on both exact-venue identity and commercial-use licensing**. Keep existing illustration fallback until both conditions are established.

## GitHub Actions / Pages verified baseline (2026-10-19)

- Main commit `9907a8f22`: [Pages build/deploy](https://github.com/donghyeuk83-sudo/tokyo-concierge-atelier/actions/runs/39220619904) **success**, [Browser smoke QA](https://github.com/donghyeuk83-sudo/tokyo-concierge-atelier/actions/runs/39220621052) **success**, including Chromium test of deployed Pages at `https://donghyeuk83-sudo.github.io/tokyo-concierge-atelier/`.
- Commit `92bf8fb3b`: [photo verification](https://github.com/donghyeuk83-sudo/tokyo-concierge-atelier/actions/runs/39220272306) **success**, including `Diagnose GitHub Pages deployment` step. This proves the step completed, but does not independently expose its step-summary values.
- The current photo addition is commit `7587fa3c8`; validate its own Pages, browser QA, and photo verification jobs before reporting that specific build is live.

## New exact-venue license screening — 2026-10-19

The following original-file or explicitly location-named sources were inspected in the latest research round. **Do not use any of them as a photo for the listed venue.** The license on a photograph of a different branch does not prove the venue photographed.

| Target card | Candidate file or official source | Result |
| --- | --- | --- |
| `r41` Tsukiji Sushiko Ebisu | [Commons: 202406011703 IMG 0191.jpg](https://commons.wikimedia.org/wiki/File:202406011703_IMG_0191.jpg), by ウィ貴公子, CC BY-SA 4.0 | **Excluded**: the file states Tsukiji Sushiko at Narita Airport Terminal 2, *not Ebisu*. |
| `r32` Kanazawa Maimon Sushi Shibuya | [Commons: AEONMALL-Makuharishintoshin---2026-03 040.jpg](https://commons.wikimedia.org/wiki/File:AEONMALL-Makuharishintoshin---2026-03_040.jpg), RuinDig/Yuki Uchida, CC BY 4.0 | **Excluded**: taken at the Makuhari-Shintoshin shopping-center branch in Chiba, *not Shibuya PARCO*. [Shibuya PARCO official store page](https://shibuya.parco.jp/shop/detail/?cd=025691) confirms the intended 7F location. |
| `r47` Robataya Roppongi | [Flickr: Robataya 201211](https://www.flickr.com/photos/rickcogley/8171494828/) by Rick Cogley | **Excluded**: original file explicitly names Roppongi Robataya, but its linked license is [CC BY-NC-ND 2.0](https://creativecommons.org/licenses/by-nc-nd/2.0/), prohibiting commercial reuse. |
| `r31` Katsu Midori Seibu Shibuya | [Commons: Nigiri Sushi (26478725732).jpg](https://commons.wikimedia.org/wiki/File:Nigiri_Sushi_(26478725732).jpg), Tim Reckmann, CC BY 2.0; used to illustrate a third-party page about Katsu Midori | **Excluded**: generic sushi photography, with no source statement linking it to the Seibu Shibuya restaurant. The restaurant [closed on September 30, 2026](https://katumidori.co.jp/announce/sibuyaclose/), so current venue claims must not imply it is open. |
| `a27` Tokyo Maikoya Tea Ceremony | [Flickr Maikoya Kyoto tea-ceremony photo collection](https://www.flickr.com/photos/tags/japaneserituals/) | **Excluded**: Kyoto Maikoya operator photographs do not establish that the **Asakusa, Tokyo** tea house is portrayed; informal attribution guidance is not a substitute for a file-level commercial reuse license. |

There were **no additions to the photo registry** in this research round because none of these candidates passed both the exact-place and commercial-use checks. The [prior licensed r28 YEBISU BAR STAND photo](https://commons.wikimedia.org/wiki/File:Ebisu-Tokyo---2024-08-28_106.jpg) remains in place.


## Photo clearance update (2026-10-19, JIDAIYA)

- **Approved**: JIDAIYA rickshaw drivers, Asakusa Kaminarimon, original 2007-01-28 [Commons file](https://commons.wikimedia.org/wiki/File:Rickshawers_by_malias_in_Asakusa,_Tokyo.jpg), CC BY 2.0, photographer malias (Gideon). This is a period-specific photo, so the card explicitly says it is not a current exterior.
- **Rejected r32**: [Flickr photo of Kanazawa Maimon Sushi Shibuya PARCO](https://www.flickr.com/photos/195604149@N07/54358476840/) confirms the exact branch but its owner marked it **All rights reserved**. No copying.
- **Rejected r02**: [Flickr Sushi Takeuchi Daikanyama photo](https://www.flickr.com/photos/aktkbk/54190513826/) identifies the restaurant but is **All rights reserved**.
- **Rejected r11**: [Flickr Yoroniku Aoyama photo](https://www.flickr.com/photos/78797573@N00/6008737778/) explicitly depicts the matching restaurant but is **All rights reserved**.
- **Rejected r21**: [Flickr The Pizza Bar on 38th photo](https://www.flickr.com/photos/official_fuyuhiko/54665909627/) identifies the exact Mandarin Oriental Tokyo restaurant but is **All rights reserved**.
- **Rejected a29**: [Commons Ninja Trick Mansion photo](https://commons.wikimedia.org/wiki/File:Togakushi_Folk_Museum,_Togakushi_Ninja_Museum,_Ninja_Trick_Mansion.jpg) is CC BY-SA 4.0 but depicts Togakushi, **Nagano**, not the listed Shinjuku Kabukicho Ninja Trick House.

## License decision for guest guides

Tokyo Concierge Atelier is a **guest information and concierge guide**, **not a photo or goods-selling service**. Photograph licensing must be assessed based on this actual use rather than assuming that all publication is paid commercial use. However, use by a hotel or hospitality business may still be interpreted as primarily directed toward commercial advantage under the CC NonCommercial definition; the absence of a purchase button or direct photo sale alone does not establish CC BY-NC eligibility. Prefer CC0, Public Domain Mark for qualifying works, CC BY, and CC BY-SA; record separate photographer permissions for ambiguous CC BY-NC content before public publication. An image must still depict the correct venue or branch, and keep attribution and license notices.

## 2026-10-19 follow-up: venue-matched but commercially restricted photos

The strict publication requirement remains **commercially reusable CC BY / CC BY-SA / CC0 / public-domain, plus verified exact venue and file-level source**. A photo usable for editorial or non-commercial contexts is **not** automatically usable for this catalogue.

| Card | Source examined | Place identity | File-level reuse result | Decision |
| --- | --- | --- | --- | --- |
| `r06` Seirinkan | [CharleyMarley Flickr photo](https://www.flickr.com/photos/marley1/2399486554/) (2008-04-03), explicitly says Seirinkan at 2-6-4 Kamimeguro | Exact venue | Flickr original states **All rights reserved** | Exclude; photograph is correctly located but not reuse-cleared |
| `r08` Il Lupone | [Laurent Flickr staff mosaic](https://www.flickr.com/photos/32936167@N02/5309379254/), explicitly describes Il Lupone employees at Nakameguro | The mosaic contains multiple unrelated businesses; not a standalone venue photograph | Flickr original states **All rights reserved** | Exclude; no rights grant and mixed venue content |
| `r47` Robataya Roppongi | [Rick Cogley Flickr photograph](https://www.flickr.com/photos/rickcogley/8171494828/) (2012-11-09), caption says Roppongi Robataya | Exact historic restaurant visit | Flickr's license link resolves to [**CC BY-NC-ND 2.0**](https://creativecommons.org/licenses/by-nc-nd/2.0/), **NonCommercial** | Exclude; not cleared for commercial reuse |
| `w05` Musashi-Koyama Shimizuyu | [Visitor's article](https://note.com/shalachandra/n/nc032e5927a89), explicitly visits Musashi-Koyama Shimizuyu | Exact bathhouse visit | No file-specific commercially reusable CC license was established | Do not extract or hotlink the visitor's photos |
| `s15` Ryogoku Takahashi | [Tokyo tourism brochure](https://www.gotokyo.org/book/wp-content/uploads/2019/12/1912_tcvbnewsletter71_low_EN.pdf) includes a store photo and name | Exact store (historical guide) | Brochure availability is not photo redistribution permission; no photo-specific CC license demonstrated | Do not extract the photo from the brochure |

**Result:** Five targeted records reviewed; **zero** candidate files passed *both* the exact-venue and commercially reusable-license requirements. Keep the licensed-photo count at **83/131**, with **48** missing. This does not claim all 48 were exhaustively screened in this iteration.

### Actual production verification (before this screening)

- Current `main` commit before review: `233cd95507bb38f5eaf9b38fb46170e7584755ac`.
- [GitHub Pages deployment 39224917492](https://github.com/donghyeuk83-sudo/tokyo-concierge-atelier/actions/runs/39224917492): **success**.
- [Browser smoke test 39224918145](https://github.com/donghyeuk83-sudo/tokyo-concierge-atelier/actions/runs/39224918145): **success**, including deployed Pages in Chromium.
- Browser logs include **166 `VENUE_PHOTO_STATUS` events** (83 distinct card IDs × local/deployed) with image natural widths greater than 0, and no image-width-zero failures.
- [Venue photo validator 39224491958](https://github.com/donghyeuk83-sudo/tokyo-concierge-atelier/actions/runs/39224491958): **success**, counting 83 displayed photos (5 local, 78 external).

## 2026-10-19 additional screening — strict exact-branch and commercial-CC requirement

A verified *restaurant chain*, *general neighborhood*, *activity type*, or *operator website photograph* is insufficient. **No new photos were published in this screening batch** because the following files/pages do not establish both exact identity and a commercially reusable file-level license.

| Card | Candidate and evidence | Identity check | Reuse rights | Decision |
| --- | --- | --- | --- | --- |
| `r45` Zauo Shibuya | [Japan Wonder Travel's Zauo Shinjuku article](https://blog.japanwondertravel.com/best-izakaya-in-shinjuku-49869) credits a photograph to **Thierry Draus / CC BY 2.0** | Photo specifically illustrates the **Shinjuku** branch (not Shibuya's Jinnan branch). [Additional Shinjuku location evidence](https://www.insightguides.com/inspire-me/blog/10-experiences-youll-only-find-in-tokyo) | CC BY 2.0 is a commercial-use-compatible CC family, but place identity fails | **REJECT for r45**; never use photos from another Zauo branch |
| `a29` Ninja Trick House, Shinjuku | [Go Guides travel article](https://jp.hotels.com/go/japan/jp-best-tokyo-family-things-to-do) links the actual [go.biwako Flickr photo 6310850675](https://www.flickr.com/photos/gobiwako/6310850675/) | **REJECTED WRONG LOCATION:** file caption identifies **Koka Ninja Village, Shiga Prefecture**, photographed 2010-11-28—not the Shinjuku Kabukicho Ninja Trick House. [Venue official address](https://ninja-trick-house.com/access/) is Kabukicho 2-28-13, 4F. | Flickr original explicitly links [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/) (commercially reusable with conditions), but that cannot cure a **wrong-site** photograph. | Keep illustration; require a distinct commercially reusable photo taken at the Shinjuku venue |
| `a30` BUB Activity Center Asakusa | [Operator's opening press release](https://prtimes.jp/main/html/rd/p/000000161.000043533.html) identifies Asakusa 2-6-11, Heiwa Store 5F, with actual interior/activity photos; [Taito ward establishment license data](https://www.city.taito.lg.jp/kenkohukusi/kenkokikikanrieisei/food/syokuhin-sisetu/index.files/2025-03-PER-PDF.pdf) corroborates the venue | **EXACT LOCATION CONFIRMED** | Operator's release photos are **not** individually confirmed under a commercial-use Creative Commons license. A press release is not a blanket reuse grant. | **DO NOT PUBLISH**; request explicit license or find a photographer-granted CC file |
| `r08` Il Lupone | [Nakameguro venue listing](https://tabelog.com/en/tokyo/A1317/A131701/13021093/) has shop/food photos, and [restaurant facade photo](https://bimi.jorudan.co.jp/shop/30260/) identifies the actual venue | Exact Nakameguro branch identifiable | No photographer-granted CC release established on either site | **DO NOT PUBLISH**; ordinary site photos are not freely reusable |
| `w05` Musashi-Koyama Onsen Shimizuyu | [Tokyo Onsen photograph](https://tokyoonsen.com/area03/shimizuyu.php) shows the correct bathhouse and exterior | Matches Shimizuyu in Musashi-Koyama, **not** the similarly named Minami-Aoyama sento | Page does not establish a file-specific commercial-CC release | **DO NOT PUBLISH** |
| `w06` Tokyo Somei Onsen SAKURA | [Onsen's official English page](https://tokyosomeionsensakura.com/en/) verifies 5-4-24 Komagome, Toshima | Exact branch/operator | Site gallery has no file-specific commercially reusable CC license demonstrated | **DO NOT PUBLISH** |
| `r02` Sushi Takeuchi, Daikanyama | [Daikanyama restaurant description](https://boutiquejapan.com/tokyo-sushi-restaurants/) vs [Osaka Namba Sushi Takeuchi article](https://points852.com/latest/country/japan/61307/) | **Different restaurant with the same English name**; Osaka photo must never stand in for Daikanyama | No qualifying exact-Daikanyama CC original found | **DO NOT PUBLISH** |
| `r06` Seirinkan | [Japan Travel Seirinkan photograph](https://en.japantravel.com/guide/tokyo-s-top-rated-pizza-restaurants/68889) | Correct Nakameguro pizzeria at 2-6-4 Kamimeguro | **CC BY-NC 2.0** explicitly forbids commercial reuse without additional consent | **REJECT** |

### Verification baseline for this screening batch

- Before this research-only edit, commit `e5e31598142bb42fe9ca84d6a6ff5e570447ce6b` had [Pages deployment **success**](https://github.com/donghyeuk83-sudo/tokyo-concierge-atelier/actions/runs/39225803247) and [browser QA **success**](https://github.com/donghyeuk83-sudo/tokyo-concierge-atelier/actions/runs/39225803583). Browser job steps included a passing `Wait for current revision on GitHub Pages` and `Test deployed GitHub Pages in Chromium`.
- Existing photos: **83/131**, missing **48**. No new `LICENSED_VENUE_PHOTOS` mapping was made in this screening batch. The site and previous compliant photo registry are unchanged.
- Source and license claims are not blanket guarantees for all 83 pictures. Each new candidate must pass original-file and exact-venue review before publishing.

## Release requirements

1. Check image content and branch/location match using the file description and operator address as needed. Keep venue identity, *not just the photo's general subject*, as the criterion.
2. Open the **file-specific** license declaration (Commons/Flickr). Record creator and original URL. Exclude 'All rights reserved', unknown terms and unsupported use permissions.
3. Use a direct HTTPS image URL and preserve its original file page, author, license label and license URL in the registry. Avoid reusing a single photo across unrelated venues.
4. Run `python scripts/validate-venue-photos.py`, then verify the GitHub Actions audit and published site; distinguish successful source commit from verified deployment.

## Latest review (2026-10-19)

- Historical note: public Pages had previously been inaccessible to the external inspection tool, but **actual GitHub Actions deployed Chromium tests subsequently succeeded**. For each new photo, inspect latest Pages and Browser smoke QA run outcomes instead of treating that older limitation as a live deployment failure.
- The Actions diagnostics now compare the checked-out `index.html` SHA256 with the public page body, when HTTP 200. An unequal hash can indicate a stale deploy, incorrect source, or HTML transformation; investigate before concluding deployment is broken.
- CC BY-NC images are not accepted for the concierge site's general use. A photo of Daikanyama generally cannot be substituted for a photograph of Ristorante ASO specifically.

## GitHub Pages verification

The repository README specifies **Settings → Pages → Deploy from branch → main / root**. This setting cannot be inferred from a commit or a missing PR workflow run. The `Verify published venue photos` workflow now checks its configuration via GitHub's Pages API and probes the expected public URL. Review its **GitHub Pages diagnostics** job step and step summary after a `main` push. HTTP 200 with the expected page title is evidence of availability, not confirmation that every image loaded successfully.


## October 19 Commons automation incident and candidate triage

- The [photo candidate collection run 39249220194](https://github.com/donghyeuk83-sudo/tokyo-concierge-atelier/actions/runs/39249220194) produced a downloadable research artifact but **failed** after **104 HTTP 429 rate-limit responses** from the Commons API. These failed searches are *unknown*, not proofs of missing photos. The browser QA and Pages deploy at the same commit passed separately.
- Reviewing that artifact revealed false candidate matches: r02 result is a USACE bamboo-bridge PDF (not Sushi Takeuchi); r04 results include Taiwanese temples and unrelated books (not Ten-Masa); r18 results include Mount Hangetsu and judo images (not SÉZANNE); r21 results include Manhattan streets and magazines (not The Pizza Bar on 38th); a29 results were unrelated PDFs (not Shinjuku Ninja Trick House). Their Commons licenses **do not make them photos of the listed venues**. None may be added.
- **Publication decision:** zero additional photos passed *both* branch/location identification and file-level commercial reuse clearance in this triage. Leave the published photo registry unchanged at **83/131** and the missing-photo queue at **48/131**; continue to show existing illustrations on those cards.
- Candidate search now uses a single precise quoted-name query per venue, image-file filtering, a minimum interval between requests and server-aware HTTP 429 retries. Its report distinguishes API failures from legitimate zero-result searches. The search is deliberately non-exhaustive and **never authorizes automated image publication**; all possible candidates still need human scrutiny of original-file attribution, licensing and exact venue identity.


## 2026-10-19 additional Flickr/Commons photograph and permission screening

Photos must show the **listed exact venue/branch**, and the original file must grant commercial reuse through CC0, compatible Creative Commons license, public-domain evidence or the copyright holder's **explicit written permission** for the hotel's guest guide. The owner keeping a photo publicly viewable or reposting it to a directory does not grant copying permission. No permission request was sent on anyone's behalf in this pass.

The updated Wikimedia Commons [48-venue research job](https://github.com/donghyeuk83-sudo/tokyo-concierge-atelier/actions/runs/39251197345) returned 18 non-verified filename matches, no API lookup failures. Direct examination of the candidates rejected false venue matches including: Ten-Masa versus the Crab Nebula and unrelated textbook imagery; Seirinkan versus Seirinkan High School in Toyohashi; SÉZANNE versus the town of Sézanne, France; Ninja Trick House in Shinjuku versus the Togakushi Ninja Museum, Nagano; Sunrise Tours Japan versus a Keihan bus, not demonstrated as a Tokyo Sunrise Tours tour. None is an appropriate actual-venue photo even where a file-level CC license is present.

| ID | Exact-place/photo candidate (original file) | Original-file rights finding | Decision |
| --- | --- | --- | --- |
| r06 | [Seirinkan margherita pizza by 雨笙/yusheng](https://www.flickr.com/photos/yusheng/6225457113), dated September 16, 2011; caption gives Kami-Meguro 2-6-4 | **All rights reserved** on original Flickr photo | Correct restaurant; seek explicit photographer permission; do not publish |
| r06 | [Seirinkan photograph by CharleyMarley](https://www.flickr.com/photos/marley1/2399486554), dated April 3, 2008; exact street address is in file text | **All rights reserved** on original Flickr photo | Correct restaurant; do not publish |
| r09 | [Ristorante ASO by Iyhon Chiu, Flickr 18010332130](https://www.flickr.com/photos/iyhon/18010332130), taken December 8, 2014; expressly identifies Daikanyama | **All rights reserved** on original Flickr photo | Correct restaurant; seek permission; do not publish |
| r09 | [Ristorante ASO by Iyhon Chiu, Flickr 18181444855](https://www.flickr.com/photos/iyhon/18181444855), same restaurant/date | **All rights reserved** on original Flickr photo | Do not publish |
| a34 | [Hirakuza Ginza Sumo Live Restaurant by Sook Hian Lee](https://www.flickr.com/photos/139088118@N05/55366420486), taken June 11, 2026; original labels the Ginza venue | **All rights reserved** on original Flickr photo | Correct venue; seek photographer permission; do not publish |
| r02 | [Daikanyama Sushi Takeuchi by anilegna](https://www.flickr.com/photos/aktkbk/54190513826), taken December 8, 2024 | **All rights reserved** on original Flickr photo | Correct venue; do not publish |

**Result for this pass:** no new file passed both exact-place and commercial-use rights clearance. Keep the current public photo registry at **83/131**, with **48** fallbacks. This does not mean every location has been exhaustively screened: the Commons query was a single-phrase screening; Flickr searches were targeted spot checks rather than a complete API license-filtered inventory.

### Permanent publish gate

- `audits/photo-registry-baseline.json` records the 83 photo mappings that existed before this batch, **not an assertion that each original image is independently re-cleared**.
- `audits/photo-clearance-approvals.json` holds file-level approval evidence for **new/replaced** photo mappings. A new or changed real photo must include the original source, credit, license, evidence of commercially usable rights, source page identifying the exact facility/branch, dates and an explanatory review.
- The browser QA workflow runs `node tests/require-photo-clearance.cjs`. It rejects new or replaced images with no explicit review record. This guards against accidental publication but **does not substitute for manually inspecting the actual source/license**.
- In the absence of written permission or commercially reusable CC terms, request permission from the photographer or business via a channel confirmed on its original page; do not scrape, hotlink or copy the image while waiting.

### Suggested photo-use permission wording

**Japanese**: ホテルのコンシェルジュがお客様にご案内する東京の観光・飲食ガイドで、貴殿の写真（撮影場所・元画像URLを記載）を掲載できるか、ご許可をお願いしたくご連絡しました。ホテル業務内での商用利用、Web掲載、画像の縮小表示について、許諾範囲・必要なクレジット表記・有効期間をご教示ください。

**English**: We are requesting written permission to display your identified photograph (original image URL) in a Tokyo hotel concierge guest guide, including commercial hospitality use and web publication. Please confirm permitted use, whether resizing is allowed, required attribution and any time limits. We will not reproduce the image without your approval.
