# Tokyo Concierge Atelier · exact-source gallery batch 8
Date: 2026-10-20

## Scope and provenance

This batch starts from deployed main `35881779da7600b2e07a868cbefd095836b18a91`. Preserve all 131 existing venues, all 89 currently published photo mappings, 42 pending-photo/illustrated venue cards, existing appearance, EN/JA/KO and 46 separate venue photo/source links. No original source file was downloaded or rehosted.

Three existing sources now point to **more directly useful photographs for the exact venue**. An operator website may allow viewing yet still withhold all redistribution rights; photos on third-party listings are not automatically licensed for hotel website reuse.

| Venue ID | Exact verified source page | Source classification | Why this page |
|---|---|---|---|
| r33 | https://tabelog.com/tokyo/A1303/A130302/13079402/dtlphotolst/smp2/ | Independent photo listing | Exact Ganso Sushi Ebisu Ekimae, Ebisu Minami 1-1-11; listing shows both two shop-posted and hundreds of visitor images |
| w06 | https://tokyosomeionsensakura.com/facility/ | Venue/operator website | Tokyo Somei Onsen SAKURA's own facility gallery, showing the named property's garden, lobby and powder rooms instead of generic homepage |
| a32 | https://www.kimono-wa.com/en/plan.html | Venue/operator website | Exact Kimono Photo Studio WA example portrait/kimonos on its studio-plan page; facility's official access page confirms the actual address at 2-24-13 Kamiosaki near Meguro, **not** Asakusa |

Source references: https://tabelog.com/tokyo/A1303/A130302/13079402/dtlphotolst/smp2/ ; https://tokyosomeionsensakura.com/facility/ ; https://kimono-wa.com/en/access.html ; https://www.kimono-wa.com/en/plan.html

## CC image candidates searched and rejected

- https://commons.wikimedia.org/wiki/File:Edomaezushi-Hinatomaru---2025-08-28_010.jpg: an original photographer's **CC BY 4.0** photo, but the description identifies **Gransta Yaekita Shokudo inside Tokyo Station**, not `r36` Hinatomaru **Asakusa Honten**. Exclude despite usable copyright license.
- https://commons.wikimedia.org/wiki/File:Bikkuri-sushi_20190705-01.jpg: **CC BY-SA 4.0** but its description identifies **Kita-ku, Nagoya**, not `r42` Bikkuri Sushi Ebisu. Exclude.
- For `r37` Kura Sushi Oshiage, two different exact-floor listings exist: https://tabelog.com/tokyo/A1312/A131203/13269960/ (1F) and https://tabelog.com/tokyo/A1312/A131203/13270091/ (2F). Do not arbitrarily represent one as both; current operator Oshiage branch site is retained.
- Targeted Commons searches for exact names across the remaining sushi, experience, and bath venues did not establish both a precise existing location and a file-specific CC0/CC BY/CC BY-SA commercial license. This is **not** an exhaustive proof of absence.
- No new file meets the combined image licensing plus exact location requirement in this batch. **Newly approved/published photos: zero**. Keep pending 42 rather than falsely decrease the count.

## Test/rollout

The site no longer sends r33 guests only to a general chain page; w06 opens facility photos; a32 opens the studio's real sample-photo page while its existing Meguro-not-Asakusa advisory is retained. Existing actual image files and credits unchanged. Browser smoke verifies all three source entries, exact venue-specific URL paths, source provenance, public card + detail behavior and no unlicensed image mapping, in addition to the pre-existing 131-venue, 89-photo and mobile search/language/photo-filter tests. Merge only after PR Chromium succeeds; then verify Pages deploy and the published revision in Chromium.
