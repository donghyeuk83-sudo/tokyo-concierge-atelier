# Tokyo Concierge Atelier — Commons original-file triage, batch 12 (2026-10-20)

Starting main: 2de009dea389f2f0e1c4634afbc4ed9c3d9ed7c9
Systematic screening: https://github.com/donghyeuk83-sudo/tokyo-concierge-atelier/actions/runs/39355695307 (successful job 118409827417; original candidate JSON/CSV in artifact 12235416902, downloaded and inspected).

## Preservation and evidence policy
Preserve all 131 original venue records, 89 licensed image mappings, 42 still-unphotographed illustrated cards, 46 existing outbound image sources, all language modes, original design and restrictions. An official webpage photo is NOT a per-file CC reuse grant. No image was downloaded/rehosted or promoted in this batch.

## Actual 131-venue Wikimedia Commons search results
Results: REGISTERED 89; NO_ELIGIBLE_CANDIDATE_FOUND 38; RATE_LIMITED_RETRY_LATER 3 (r43, a27, s15); CANDIDATES_REQUIRE_REVIEW 1 (a38). Searching Commons is not proof of global absence, and rate-limited venues are still pending.

### Original candidate 1 — Rejected wrong venue despite valid CC0
- Target: a38 Deeper Japan Tokyo cultural experiences.
- File: https://commons.wikimedia.org/wiki/File:Kuro_Games_Wuthering_Waves_-_Flickr_-_Miroslaw_Magola_alias_Magneticman.jpg
- Author: Miroslaw Magola alias Magneticman. Source: https://flickr.com/photos/62608635@N04/55461264064 ; captured 2025-05-29. Commons Flickr review 2026-08-24.
- License: CC0 1.0; commercial reuse generally permitted. HOWEVER the original photograph and description concern a Kuro Games / Wuthering Waves Tokyo gaming-anniversary promotion, not Deeper Japan's traditional cultural tours or any identified Deeper Japan venue. REJECT: exact subject/branch mismatch.

### Original candidate 2 — Rejected historical illustration
- File: https://commons.wikimedia.org/wiki/File:A_STORY-TELLER_ON_THE_PLATFORM._(1910)_-_illustration_-_page_285.png
- Credited author: Unknown author, 1910. Source image is a historic storyteller book illustration, not Deeper Japan.
- License indicated: Public domain, NOT an explicitly requested CC0, CC BY or CC BY-SA license. REJECT: wrong subject and license category.

### Rate-limited pending investigations
- r43 Sushi Ebisu KOURIN: Commons search rate-limited, original author/license/photographed Ebisu shop unverified; retry later.
- a27 Tokyo MAIKOYA: Commons search rate-limited; do not use Kyoto/Osaka operator images for Tokyo locations.
- s15 Ryogoku Takahashi: Commons search rate-limited; correct store 4-31-15 Ryogoku in Sumida, actual shop image unverified.

NEW file-specific commercially reusable exact venue approvals: 0. NEW embedded photos: 0. Maintain 89/131 displayed and 42 illustrated pending.

## Two safer original operator photo-source links
- a30 BAC (formerly BUB Activity Center) Asakusa: https://bub-activitycenter.com/samurai-experience/ . The ORIGINAL operator's exact Asakusa Tokyo samurai archery/katana workshop has an 18-photo carousel, while its old homepage represents BOTH Tokyo and Osaka. Mark operator source; images remain offsite, no permission to copy inferred.
- r37 Kura Sushi Oshiage Skytree-mae flagship: https://www.kurasushi.co.jp/oshiage/ . ORIGINAL operator page with real location 1-8-23 Oshiage, Sumida-ku, BOTH floors 1F and 2F, interior/amusement photos; clearer canonical URL than /oshiage/index.html and safer than unrelated single-floor photos. The footer states Copyright Kura Sushi, Inc. All Rights Reserved.

## Research workflow improvements
- tests/find-commons-photos.cjs continues to report ALL 131 venue statuses for backwards compatible outputs but sleeps only for 42 pending network requests, not for the 89 already licensed mapped photos.
- Candidate license filter accepts only CC0, CC BY, CC BY-SA labels (excludes CC BY-NC/ND, Public-domain-only tags, missing grants).
- Every returned candidate now has venue_match=UNVERIFIED and reuse_approved=false. Metadata/license search is never final permission; still requires precise venue match, original author and all copyright terms.
- tests/smoke.cjs checks official exact source links and corresponding detail views, iPhone-friendly behavior, pending-only no-embedding gate, and the improved Commons clearance filter, plus existing 131/89 and multilingual checks.

## Release gate
Only merge on green PR Chromium QA; then verify main Pages revision and local/public image loading 178/178. Preserve original layout and photographs.
