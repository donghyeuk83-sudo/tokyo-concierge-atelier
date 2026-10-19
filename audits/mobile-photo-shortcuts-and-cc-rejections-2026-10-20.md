# Tokyo Concierge Atelier · Mobile photo navigation, source provenance & Commons review
Date: 2026-10-20

## User-facing change in existing site

Preserved the same **131 venue records, 89 registered image mappings, 42 photo-pending cards, and 45 existing photo/venue reference links**. This release does **not** add a new site or alter licensed photographs, card ordering or venue data.

On narrow screens (at or below 720px), a compact horizontal, scrollable **four-button shortcut strip** now sits directly below the full filters. EN / JA / KO labels and active accessible `aria-pressed` follow the selected language. The shortcuts are:
- All places — no photo preference.
- Venue photos — photo cards **excluding host-building exterior-only photos**.
- Building exteriors — distinguish a building in which the restaurant/attraction is housed from a genuine view of the tenant's interior.
- Photo source pages — original operator/third-party pages that guests can open without copying licensed images.

Buttons and the existing full dropdown remain in sync, including reset and category/language changes. Chips have ≥44px touch targets and use contained horizontal scrolling so they cannot expand the iPhone document width. Desktop design remains otherwise untouched.

Photo-reference cards now explicitly describe their external provenance beside the link: **venue/operator website**, **independent photo listing**, **press/media**, or **editorial/visitor report**. English, Japanese and Korean explain that the photos remain on the publisher's site. A press photograph or restaurant's public image is not represented as free to republish.

## Latest authoritative runtime status before this release

Main `5cf66188f80f4d3b049793d001bea5ebfd3472a4`: GitHub Pages run 39288341358 and Browser QA run 39288340685 **success**. Chromium log recorded **178 photo-load checks, zero broken image natural widths** (89 local + 89 deployed), and EN/JA/KO, mobile, search, gallery filter, shortlist, CSV and photo approval tests passed.

## Targeted exact-branch commercial-license review (no newly publishable file)

- [Commons file Bikkuri-sushi_20190705-01.jpg](https://commons.wikimedia.org/wiki/File:Bikkuri-sushi_20190705-01.jpg) is genuinely CC BY-SA 4.0, but the original file description clearly identifies **Nagoya-shi Kita-ku Kusunokiajima**, not the **Ebisu Bikkuri Sushi**. **Reject for venue `r42`** despite the valid license; the site's direct Ebisu Tabelog gallery link remains.
- [Seirinkan pizza by yusheng](https://www.flickr.com/photos/yusheng/6225457113) is the real Kami-Meguro 2-6-4 restaurant but has previously been marked **All rights reserved**. Exact venue match alone is not commercial reuse approval.
- [Independent Nakameguro Seirinkan gallery](https://tabelog.com/tokyo/A1317/A131701/13003188/dtlphotolst/4/smp2/) documents exterior photos of the named location. The site already links that original gallery; images remain on the source site and are not embedded without specific copying permission.
- Other Commons exact-name queries for listed private eateries returned unrelated bibliographic items or the wrong subject; **no verified new file** cleared both the precise branch and commercial CC license this batch. This is a targeted search, not an exhaustive screen of all 42 venues.

## Regression validation

`tests/smoke.cjs` now tests iPhone visibility, all four chips, source/venue/building filter outcomes, dropdown synchronization, switch to Korean, mobile no-overflow, and source type labels for operator, independent listing and press examples. Existing 89×2 image checks remain.

**No additional photos were approved or copied in this release.** The 42 missing-photo cases remain illustrations or original source links pending license-verified exact venue photos.
