# Tokyo Concierge Atelier · Commons priority-seven retry and exact original photo galleries
Reviewed 2026-10-20 · base main 11ef4e26233173088f0b4d6e8b49f88a3fbb9a03

## Scope and preservation
Preserve all 131 current catalog venue records, all 89 previously licensed photograph mappings, all 42 still-illustrated pending entries, the 46 outbound original-source records, original UI/design, and English/Japanese/Korean. Do not publish a Commons filename just because licensing is adequate; exact venue/branch and original author/file license must match. Do not overwrite images or remove current source records.

## Original full-run evidence
Original successful Wikimedia Commons search run 39359868634 (https://github.com/donghyeuk83-sudo/tokyo-concierge-atelier/actions/runs/39359868634), JSON and CSV artifact 12236004753, personally inspected.
Results from main before this patch: 89 REGISTERED, 34 NO_ELIGIBLE_CANDIDATE_FOUND, seven RATE_LIMITED_RETRY_LATER, one CANDIDATES_REQUIRE_REVIEW. Rate-limited does NOT mean no images exist.
Seven exact venue IDs and correct locations:
- r33: Ganso Sushi Ebisu Ekimae, Tokyo Ebisu (already linked to exact independent Tabelog store photos).
- r36: Hinatomaru Asakusa Honten, 1-20-10 Asakusa, Taito, NOT Tokyo Station Gransta / Kameido / Kaminarimon other outlets.
- r37: Kura Sushi Oshiage, 1-8-23 Oshiage, Sumida, BOTH store levels 1F+2F; exact official combined Oshiage photo page retained.
- r50: MoonFlower Sagaya Ginza, Ginza 2-5-19 6F (operator's teamLab artwork page is already source; the work's copyright is not CC evidence).
- r51: SUIGIAN, Nihonbashi Muromachi 2-5-10 B1, NOT other restaurants or historic venues.
- a34: THE SUMO LIVE RESTAURANT HIRAKUZA GINZA TOKYO, operator's photographic 2026-01-07 Ginza opening report, NOT Hirakuza Osaka. Operator report includes Osaka reference photographs so site must never copy the wrong branch image.
- a37: Wabunka Tokyo cultural experience provider, multiple Tokyo artisans and galleries; the existing official Tokyo experiences catalogue is correct, not a single physical venue to be illustrated with one unrelated workshop.

Previous a38 Deeper Japan CC0 original photographer Miroslaw Magola alias Magneticman's Kuro Games / Wuthering Waves Tokyo game celebration is unrelated to this traditional cultural experiences business; remains REJECTED (license valid but subject mismatched). This is not one of the seven rechecks.

## Gallery improvements (only original-publisher outbound links)
- r36 from Tabelog mixed user/operator uploads to https://hinatomaru.com/asakusa/ . Official exact Asakusa Honten page contains two operator-hosted original shop images and address 1-20-10 Asakusa and explicitly distinguishes other Hinatomaru branches (especially Tokyo Station). Copyright © ひなと丸, All Rights Reserved: do not download or embed.
- r51 from Tabelog visitor gallery to https://suigian.jp/heritage/ . Actual Nihonbashi SUIGIAN operator shows original location's stage, tearoom, artwork, interior/lounges and objects; official https://suigian.jp/ confirms 2-5-10 Nihonbashi Muromachi B1. Copyright © SUIGIAN, All Rights Reserved. No CC grant for copying.
Sources: https://hinatomaru.com/asakusa/ ; https://suigian.jp/heritage/ ; https://suigian.jp/ ; https://hirakuza.net/tokyo/news/202601113508/ ; https://www.kurasushi.co.jp/oshiage/ ; https://moonflower-sagaya.com/en/artwork/ ; https://wabunka-lux.jp/tokyo/.

## Commons search reliability changes
- Previously searching all unphotographed entries in original catalogue order hit 429 for all seven later IDs, meaning no file-level verdict for them.
- tests/find-commons-photos.cjs now searches those seven priority IDs first, then other genuinely pending IDs, skipping all 89 approved mapped photos. Sorting output back into original catalogue order preserves downstream reports.
- Each priority venue's search runs English/Romanized name + Tokyo, then its original Japanese name + area + Tokyo, for better branch specificity. For a 429 response, one bounded retry after 12 seconds is allowed; a continued rate limit remains explicitly marked RATE_LIMITED_RETRY_LATER (never silently treated as no candidate).
- As before, candidate metadata is limited to CC0, CC BY and CC BY-SA; all hits are venue_match=UNVERIFIED and reuse_approved=false until a human verifies the original photograph, actual address/branch, author, file license and restrictions.
- This PR does not itself claim that the scheduled post-merge Commons rerun discovered a licensable photograph. Use the new main's discovery job artifact for real subsequent results, never an estimate.

## QA / release gate
Existing smoke test expected independent gallery paths for r36 and r51; those expectations are updated because they are now original operator pages. New Chromium tests check source host, path, operator provenance, actual card/detail links, and no unapproved photographs.
Existing 131 venue, 89 image, 42 pending and three-language invariants plus CSV, mobile, filters, search, shortlist and JS console tests remain. Only merge after PR Chromium success, then verify main GitHub Pages and public site photo loading.
