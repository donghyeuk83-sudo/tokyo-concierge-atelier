# Tokyo Concierge Atelier — structure and safe change rules

Updated 2026-10-21. Site: `https://donghyeuk83-sudo.github.io/tokyo-concierge-atelier/`.

## Architecture

- `index.html`: the original static HTML layout and remaining inline **state, UI rendering, CSV and event** script. Stage 0–1 extracted canonical data without changing its values; stages 2–4 are NOT performed yet.
- `assets/atelier-catalog.js`: byte-preserved 131-record `DATA` registry and the original five-category order/cache.
- `assets/atelier-sources.js`: byte-preserved `VERIFIED_SOURCES`, pending source reviews and exact official-vs-reference provenance.
- `assets/atelier-media.js`: byte-preserved 89 CC photo mappings, 50 AI concept mappings, host-building photo disclosures and external photo-source metadata.
- `audits/stage01-original-data-snapshot.json`: pinned original main commit / source blob SHA-1s, so a one-byte change to extracted data fails the QA gate until explicitly reviewed.
- `tests/atelier-source-registry.cjs`: strict shared parser for the three deployed JS assets, including all venue/photo counts, exact Git blob hashes and loader ordering. Audit tools no longer scrape data from inline HTML. Canonical extraction intentionally uses classic synchronous <script src> tags to preserve file:// behavior.
- `assets/atelier.css`: the original complete CSS moved without a visual redesign. HTML uses a same-origin **versioned link** (`?v=20261020-a`). When updating styles, bump the version string in `index.html` so repeat visitors receive current CSS. Do not silently change the layout during refactors.
- `assets/atelier-illustration.js`: the **unchanged** ~9.7kB pure venue illustration renderer, loaded as a synchronous classic script immediately before the existing catalogue inline script. It resolves `esc()` and `lang` when called, preserving the original fallback images, labels, and localized names. The versioned link is `?v=20261021-a` and must be bumped if the asset changes. The syntax gate checks both scripts.
- `assets/atelier-search.js`: original district and venue multilingual aliases plus the original EN/JA/KO indexing formula, now memoized in a `WeakMap` by the immutable venue object. The versioned synchronous classic script loads between illustration renderer and catalogue script. The index must match the previous uncached formula for all **131** venues; the browser test checks exact text equivalence. No catalogue source of truth is duplicated.
- `assets/atelier-i18n.js`: original **unaltered** EN/JA/KO UI dictionary extracted from HTML into a versioned synchronous classic script loaded before the inline application. The syntax gate pins a UTF-16 fingerprint of the original text; any future translation edit must be explicit and re-reviewed.
- `ROWS_BY_CATEGORY`: in-memory, catalogue-order-preserving category arrays built once from the 131 venue objects, used by filter options, photo quickbar counts and card results. Tests assert the same five categories and same venue object sequence as original `DATA.filter`. Do not mutate the cached arrays.
- `assets/photos/`: existing approved venue-image assets and explanatory/AI illustrations. Editorial reference photos and third-party operator galleries **must not** be relabeled as original venue photos.
- `tests/`: state, privacy, search, design, Chromium/WebKit iPhone, photo provenance and external link audits.
- `.github/workflows/browser-smoke.yml`: on PR, main, or the daily scheduled run, audits data, checks links, runs local browser regressions and validates the deployed revision on main.
- `audits/`: rights/provenance metadata, pending photo queue and local/CI-generated links requiring review.

## Current invariants

- Preserve all **131 venue records**, **89 registered approved-image mappings**, **50 pre-existing AI illustrations**, the **42 unresolved photo-rights slots**, all three languages, filter semantics, mobile layout, and existing photography/source attribution. Never imply that a photograph is from a particular interior when it depicts a host building or illustration.
- Keep the external-link audit focused on the **actual guest-facing URL**, selected from `VERIFIED_SOURCES[id]?.url || DATA[id].url`, and retain `reference_url` in the report. HTTP 403/429 and transient 5xx must not be treated as venue closure. HTTP 200 is not evidence that details, price, reservations or business status are current.
- The photo approval ledger must document per-file identity, exact venue and rights for commercial display **before** any new or replaced venue photo is published. Do not automatically scrape or rehost operator, Tabelog or Commons images without qualifying rights. The pending 42 have not been cleared merely by listing source URLs.
- Invalid `#guide=` links and unknown IDs without any valid venue matches must **not** erase existing local recommendations; valid links still import as before.
- Share links contain only public shortlist venue IDs. Never leak arbitrary URL query parameters or persist guest PII. When shortlist selection **or locale** changes, invalidate previously prepared CSV export blobs.
- Protect production with branch/PR checks before merging. Review test results for real Chromium and iPhone WebKit, not only syntax checks. Distinguish emulator/Playwright behavior from a physical iPhone Safari hardware test.

## Next modularization step — Stage 2–4 (not performed in this PR)

The 131-place catalogue, source notes and 89-photo licensed registry are now canonical external JS. Next isolate guest-facing guidance/common helpers/state, then editorial/rendering and CSV/boot code in separate reviewed PRs. Retain file:// functionality, exact legacy translation copy and all existing safety and photo-approval gates. Do not mutate the stage 0–1 snapshot to conceal unreviewed data changes.
