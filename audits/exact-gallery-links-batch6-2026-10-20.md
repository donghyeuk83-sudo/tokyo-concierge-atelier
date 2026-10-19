# Tokyo Concierge Atelier · exact-branch photo reference upgrade (2026-10-20)

## Scope and outcome

Existing venue catalogue **131**, approved/displayed photographic mappings **89**, pending photo cards **42**, and existing **46** external venue/source links are preserved. Nine generic venue/operator or venue-listing links are replaced with **exact-location photo pages** (eight independent third-party listings plus one operator photographic information page). No photography is copied, hotlinked, embedded, uploaded, or represented as CC0/CC BY/CC BY-SA without file-specific proof.

These are **guest-visible source links**, not image use permissions. Tabelog galleries include a mixture of operator submissions and visitor-owned photos; the copyright terms of each individual photograph remain unverified for hotel-site commercial reproduction. Their provenance badge must read **Independent photo listing**. The Shiori-an operator page must retain its **Venue / operator website** badge.

## Exact-location source links (visually and URL-verified)

| ID | Venue | Source | URL / subject verified |
|---|---|---|---|
| r04 | Ten-Masa, Nakameguro | [Tabelog photo gallery](https://tabelog.com/tokyo/A1317/A131701/13147445/dtlphotolst/smp2/) | Exact Ten-Masa Nakameguro; operator counter/room and user photos |
| r05 | Tempura Kusunoki, Nakameguro | [Tabelog photo gallery](https://tabelog.com/tokyo/A1317/A131701/13304124/dtlphotolst/smp2/) | Exact Nakameguro branch; shop-uploaded interior photos and user photos |
| r08 | Il Lupone, Nakameguro | [Tabelog exterior photo gallery](https://tabelog.com/tokyo/A1317/A131701/13021093/dtlphotolst/4/smp2/) | Exact Nakameguro pizzeria, exterior photographs |
| r39 | Sushi Yuji, Ebisu | [Tabelog photo gallery](https://tabelog.com/tokyo/A1303/A130302/13310768/dtlphotolst/smp2/) | Exact Ebisu restaurant; restaurant and diner photos |
| r40 | Sushi Dokoro Abe Hiroo Bekkan | [Tabelog exterior photo gallery](https://tabelog.com/tokyo/A1307/A130703/13149832/dtlphotolst/4/smp2/) | Exact Hiroo **Bekkan** (annex) vs other Abe shops |
| r41 | Tsukiji Sushiko, Ebisu | [Tabelog exterior photo gallery](https://tabelog.com/tokyo/A1303/A130302/13260579/dtlphotolst/4/smp2/) | Exact Ebisu branch; not the chain's generic page |
| r43 | Sushi Ebisu KOURIN | [Tabelog food photo gallery](https://tabelog.com/tokyo/A1303/A130302/13286155/dtlphotolst/1/smp2/) | Exact Ebisu Kourin restaurant (sushi dishes) |
| r44 | Shiori-an Yamashiro, Ebisu | [Operator's Ebisu venue/about photographs](https://shiorian-yamashiro.com/ebisu/about/) | Exact Ebisu branch restaurant space and menu (not other Shiori-an branch) |
| r51 | SUIGIAN, Nihonbashi | [Tabelog venue photo gallery](https://tabelog.com/tokyo/A1302/A130202/13219884/dtlphotolst/smp2/) | Exact SUIGIAN Nihonbashi, operator-submitted stage/entrance/interior and guest photos |

## Reuse clearance & remaining blockers

- **New CC0 / CC BY / CC BY-SA licensed images cleared this batch: zero.** This is not a claim that no such images exist in the world; no original file passed both exact-branch identity and image-specific commercial license verification during the targeted investigation.
- Do **not** substitute a CC-licensed photograph of a different Tokyo branch, a similarly named facility, a merely photographed menu from another venue, or publisher-owned All Rights Reserved photos.
- r31 Katsu Midori Seibu Shibuya is closed; do not link an unrelated operating Katsu Midori branch photo as if it were the closed Seibu location.
- r52 Nagatacho Ouka appears invitation-only with no public photographs; no invented image, image link, telephone or public booking claim.
- r44's venue webpage is protected by its operator's copyright absent permission; external reference only.
- Preserve original 89 images, their attribution/license metadata and existing illustration cards. Pending 42 stay pending and source provenance labels remain accurate.

## Regression gate

The new test checks all nine exact URL paths, provenance kinds, zero substitution into `LICENSED_VENUE_PHOTOS`, and unchanged 46 source references. Existing Chromium smoke tests for EN/JA/KO, search, photo filters, iPhone horizontal overflow, gallery navigation and 89 on-site image loads should run on the PR and the final published main revision before marking this work fully deployed.
