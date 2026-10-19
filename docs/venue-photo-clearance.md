# Venue-photo clearance queue — 2026-10-19

Only place-specific photography with a **confirmed file-level license** may enter `LICENSED_VENUE_PHOTOS` in `index.html`. An accessible image or official venue URL is not permission to embed it. Record the author, file-specific source link, CC/Public Domain license and target venue ID before publishing. A building in the same neighborhood, another branch of a chain, or a food illustration is **not** a verified image of that venue.

Current source registry: 131 cards, 81 uniquely mapped photographic entries, 50 without photos. The registry checks do **not** prove all 81 source pages are alive, correctly licensed or visually matched to the venue. GitHub Actions reports IDs of cards still needing photos.

| Venue ID | Target | Candidate evidence | Reuse clearance | Next action |
| --- | --- | --- | --- | --- |
| r06 | Seirinkan, Nakameguro | [Japan Travel venue photograph by Dennis Amith](https://en.japantravel.com/guide/tokyo-s-top-rated-pizza-restaurants/68889) and [Flickr photograph by yusheng](https://www.flickr.com/photos/yusheng/6225457113) | **REJECTED**: the former is CC BY-NC 2.0 (noncommercial only); the latter is All rights reserved | Obtain photographer permission or find a commercially reusable, venue-matched CC file |
| r09 | Ristorante ASO, Daikanyama | [Exact venue Flickr photograph by Iyhon Chiu](https://www.flickr.com/photos/iyhon/18181444855), dated 2014 | **REJECTED**: the original Flickr file states *All rights reserved* | Obtain explicit photographer permission or find a CC-licensed image of the same restaurant |
| r37 | Kura Sushi Oshiage | [Kura Sushi chain information](https://www.kurasushi.co.jp/) | **NOT CLEARED**: images of other branches cannot represent Oshiage | Require Oshiage branch-specific evidence and file license |
| r48 | NINJA TOKYO, Otemachi | [Official venue site](https://ninja-tokyo.jp/) identifies restaurant | **NOT CLEARED**: photos from the restaurant site have no confirmed reuse grant | Seek a suitably licensed Otemachi venue photograph |
| w05 | Musashi-Koyama Onsen Shimizuyu | [Tokyo Sento Association venue page](https://www.1010.or.jp/map-en/item/item-cnt-417) identifies 3-9-1 Koyama | **NOT CLEARED**: venue-page photography has no confirmed CC license | Seek photographer-granted reuse or CC image of the exact bathhouse |
| r45 | Zauo Shibuya | [Operator's branch-specific information](https://www.zauo.com/) | **NOT CLEARED**: official photos are not automatically available for reuse | Verify license for the exact Shibuya branch |

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
