# Venue-photo clearance queue — 2026-10-19

Only place-specific photography with a **confirmed file-level license** may enter `LICENSED_VENUE_PHOTOS` in `index.html`. An accessible image or official venue URL is not permission to embed it. Record the author, file-specific source link, CC/Public Domain license and target venue ID before publishing. A building in the same neighborhood, another branch of a chain, or a food illustration is **not** a verified image of that venue.

Current source registry: 131 cards, 82 uniquely mapped photographic entries, 49 without photos. The registry checks do **not** prove all 82 source pages are alive, correctly licensed or visually matched to the venue. GitHub Actions reports IDs of cards still needing photos.

| Venue ID | Target | Candidate evidence | Reuse clearance | Next action |
| --- | --- | --- | --- | --- |
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

## Release requirements

1. Check image content and branch/location match using the file description and operator address as needed. Keep venue identity, *not just the photo's general subject*, as the criterion.
2. Open the **file-specific** license declaration (Commons/Flickr). Record creator and original URL. Exclude 'All rights reserved', unknown terms and unsupported use permissions.
3. Use a direct HTTPS image URL and preserve its original file page, author, license label and license URL in the registry. Avoid reusing a single photo across unrelated venues.
4. Run `python scripts/validate-venue-photos.py`, then verify the GitHub Actions audit and published site; distinguish successful source commit from verified deployment.

## Latest review (2026-10-19)

- Public Pages URL could not be retrieved from the external verification environment. This is **not proof** that Pages is disabled; inspect the Actions **GitHub Pages diagnostics** step and repository Settings → Pages.
- The Actions diagnostics now compare the checked-out `index.html` SHA256 with the public page body, when HTTP 200. An unequal hash can indicate a stale deploy, incorrect source, or HTML transformation; investigate before concluding deployment is broken.
- CC BY-NC images are not accepted for the concierge site's general use. A photo of Daikanyama generally cannot be substituted for a photograph of Ristorante ASO specifically.

## GitHub Pages verification

The repository README specifies **Settings → Pages → Deploy from branch → main / root**. This setting cannot be inferred from a commit or a missing PR workflow run. The `Verify published venue photos` workflow now checks its configuration via GitHub's Pages API and probes the expected public URL. Review its **GitHub Pages diagnostics** job step and step summary after a `main` push. HTTP 200 with the expected page title is evidence of availability, not confirmation that every image loaded successfully.
