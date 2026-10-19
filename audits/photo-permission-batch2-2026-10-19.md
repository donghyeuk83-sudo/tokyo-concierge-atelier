# Photo permission research — second verified-contact batch (2026-10-19)

**Scope:** Continue from commit `1b19488` and 48 unphotographed venue IDs. This batch adds **five** independently evidenced official operator inquiry channels. Total now **17 verified / 30 unverified / 1 closed historical venue**. No contact has issued photo rights, no permission request was sent, and **no image was published**. Current public photos remain **83/131**, with 48 illustration fallbacks.

## New operator inquiry channels

| ID | Exact target | Verified official inquiry channel | Source and restrictions |
|---|---|---|---|
| r48 | NINJA TOKYO, Otemachi Shin-Otemachi Building B1F | `ninja.reservation@willplanning.jp` | [Official venue site](https://ninja-tokyo.jp/) explicitly lists the email and Otemachi address. It is an inquiry address, not a photo license; site states all rights reserved. |
| r49 | BENITSUYA, 6F Grand Hammer, Shimbashi | [Grand Hammer media inquiry form](https://grandhammer.jp/contact/) | [Official contact form](https://grandhammer.jp/contact/?lang=ko) offers a `取材` (press) category; [operator floor details](https://grandhammer.jp/news/1130/) confirm 6F BENITSUYA. Request rights to exact floor/venue photo. |
| a32 | Kimono Photo Studio WA | `info@kimono-wa.com` | [Official access page](https://kimono-wa.com/en/access.html) explicitly lists this email, but identifies the studio at **2-24-13 Kamiosaki, Shinagawa (Meguro Station)**, **not Asakusa** as in the existing catalogue. **Block new photos until venue location is reconciled.** |
| a34 | Hirakuza Ginza Tokyo | `hirakuza-reserve@hcl-c.com` | [Operator statutory disclosure](https://hirakuza.net/tokyo/law/) lists email; [official terms](https://hirakuza.net/tokyo/terms/) require advance permission for non-private/commercial show photography. Do not confuse guest social-media sharing with commercial image reuse. |
| a40 | Sunrise Tours (JTB Global Marketing & Travel) | [JTB GMT corporate inquiry form](https://www.jtbgmt.com/jp/contact/) | [JTB GMT's Sunrise Tours operator page](https://www.jtbgmt.com/jp/services/leisure/sunrise/) identifies the brand; corporate form is a route to ask who owns specific photo rights, not authorization. |

## Photo candidate screening

- Previously discovered Flickr original photos showing the exact restaurants were **All rights reserved**; an image search match is not an image license. The first and second research batches in `docs/venue-photo-clearance.md` preserve original-file links and rejection reasons.
- Commons search produced many unrelated locations and media. This batch found **no newly verified original photo** meeting both exact-place and file-level commercial reuse evidence. Therefore **0** newly approved files and **0** image insertions.
- The a32 catalogue location mismatch is especially important: a photograph of the real Meguro studio must **not** be used as proof of an Asakusa facility. The publish gate now rejects a32 image changes until the catalogue location is corrected and reverified.
- This is **not** a claim that all Flickr/Commons imagery was exhaustively searched; unresolved sources remain unresolved, not automatically disqualified.

## Next research batch

30 official contact routes still need source-level verification. Prioritize operator-owned media or PR channels for r18 Four Seasons SÉZANNE, r21 Mandarin Oriental Pizza Bar, r09 Hiramatsu Ristorante ASO, r29/r37 Kura Sushi exact branches, and a29 Ninja Trick House. Confirm the precise facility and obtain explicit written commercial web-image permissions or original file-level CC licensing before any addition.

**Release requirements:** contact CSV retains all 48 IDs, the 83 published image mappings remain unchanged, `node tests/audit-photo-permission-queue.cjs` and `node tests/require-photo-clearance.cjs` pass, GitHub Pages deployment succeeds, and the deployed Chromium image loading test passes.
