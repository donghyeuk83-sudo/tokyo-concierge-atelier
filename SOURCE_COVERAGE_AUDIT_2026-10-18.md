# Tokyo Concierge Atelier — operational QA audit (2026-10-18)

## Static catalogue checks

- Entries: 131
- Unique venue IDs: 131
- Effective source records: 130/131
- No active source record: r42

## Quality corrections

- Nagatacho Ouka (r52): secondary directory and reported member-invitation access; no official public booking channel or concierge acceptance verified. Marked as reference-only.
- Bikkuri Sushi Ebisu (r42): source was explicitly removed in site code due to an unverified listing; marked reference-only, not official-source reviewed.
- New museum records a45-a47: official-source notes and Japanese/Korean search aliases added; ID collision corrected.
- s16 Hands Shibuya: official closure warning for 2026-11-15 is already in the catalogue. Recheck before any guest recommendation.

## Incomplete release checks

- Public GitHub Pages URL could not be reached by the available web reader; live deployment status unconfirmed.
- Real browser search, language toggle, shortlist, links, print, download and mobile layout not yet executed.
- Static code inspection is not a substitute for end-to-end browser QA.
- Official source records are not guarantees of live hours, prices, booking access or availability.
