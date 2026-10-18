# Tokyo Concierge Atelier — Source Coverage Audit

Audit date: 2026-10-18. Static source-code audit only; venue operating status not live-verified.

- Parsed catalogue rows: 126
- Rows with matching source record: 109
- Rows without matching source record: 17

**Caution:** A stored source URL does not prove current hours, prices, reservation availability, or official venue status. The application flags r52 (Nagatacho Ohka) for identity review.

## Missing source records

| ID | Venue | Existing catalogue URL |
|---|---|---|
| r01 | Udatsu Sushi | https://udatsu-sushi.jp/ |
| r10 | Joël Robuchon | https://www.robuchon.jp/ |
| r12 | Ginza Kyubey | https://www.kyubey.jp/ |
| r13 | Narisawa | https://www.narisawa-yoshihiro.com/ |
| r20 | Sushi no Midori | https://www.sushinomidori.co.jp/ |
| a04 | Senso-ji | https://www.senso-ji.jp/ |
| a07 | Ueno Park | https://www.kensetsu.metro.tokyo.lg.jp/ |
| a08 | Hamarikyu Gardens | https://www.tokyo-park.or.jp/ |
| s01 | Ginza Six | https://ginza6.tokyo/ |
| s02 | Isetan Shinjuku | https://www.mistore.jp/ |
| s03 | Omotesando Hills | https://www.omotesandohills.com/ |
| w01 | Thermae-Yu | https://thermae-yu.jp/ |
| t01 | Tokyo Station | https://www.jreast.co.jp/ |
| t02 | Shinagawa Station | https://www.jreast.co.jp/ |
| t03 | Haneda Airport | https://tokyo-haneda.com/ |
| t04 | Narita International Airport | https://www.narita-airport.jp/ |
| a23 | Ryogoku Kokugikan | https://www.sumo.or.jp/ |

## Verification requirements

1. Confirm exact venue/branch and operating status from its official website.
2. Confirm booking conditions, hours, price and restrictions only where official evidence supports them.
3. Preserve existing catalogue IDs and explicitly distinguish confirmed facts from pending verification.
4. Review other source records for stale dates and mismatched branches.
