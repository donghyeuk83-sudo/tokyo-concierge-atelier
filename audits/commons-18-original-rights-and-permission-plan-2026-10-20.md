# Tokyo Concierge Atelier — 18 Wikimedia-rate-limited venues and commercial photo rights
Date: 2026-10-20. Base main: `24704023fc3ad90130410d887d6458fb834ee7ac`.

## Source and limitation
- The latest actual Wikimedia Commons run [#39363935959](https://github.com/donghyeuk83-sudo/tokyo-concierge-atelier/actions/runs/39363935959), artifact #12239006143, reported 89 registered photographs, 24 pending venues with no eligible *search hit*, and **18 pending venues blocked by HTTP 429**. The report contains no verified file author, file-specific commercial CC grant, original image URL plus exact subject/branch for the 18. An HTTP 429 is **NOT** evidence that there are no suitable photographs.
- Audited these precise IDs against the existing 2026-10-19 rights-holder outreach ledger: `r11 r29 r31 r38 r39 r40 r41 r42 r43 r44 a30 a31 a32 a34 a38 a39 a40 s15`. These 18 records, their source-evidenced business inquiry routes and provenance are in [commons-18-rights-and-contact-triage-2026-10-20.csv](commons-18-rights-and-contact-triage-2026-10-20.csv).
- **0 new confirmed original files, 0 new commercial CC0/CC BY/CC BY-SA author+venue clearances, 0 photographs republished, 0 permissions obtained**, and **no outbound emails/phone calls/forms sent**. The information is a rights **request route**, never proof of license.
- All 131 venues, the current 89 displayed approved photos, 42 still-illustrated missing-photo records, all 46 external image references, original cards/design, warnings and EN/JA/KO are preserved.

## Newly verified originals displayed only at their copyright holders' websites
1. `r40` **Ikina Sushi Dokoro Abe, Hiroo Bekkan**: [the exact Hiroo Bekkan operator-hosted photo gallery](https://ikinasushidokoroabe-hiroobekkan.owst.jp/gallery) displays actual ground-floor sushi-counter, 2F private/table rooms and cuisine; the address is **Minamiazabu 4-2-38**, confirmed separately by [the official parent restaurant's separate branch directory](https://ikinasushidokoroabe.jp/address.html). Distinguish from Hiroo **Honten**. The owner of each gallery image and its photo-use license are **not** established; leave all image files on the operator gallery website. Operator contact path: 03-3440-5088 (request image rights-holder).
2. `r41` **Tsukiji Sushiko Ebisu**: [restaurant-chain original exact Ebisu shop photo page](https://www.tsukiji-sushiko.com/shoplist/ebisu/) includes **three store interior photographs** and exact address **Ebisu-minami 1-4-12**, distinguishing it from the Tsukiji main branch and similarly named **Tsukiji Sushi-sen**. The operator's [press inquiries](https://www.tsukiji-sushiko.com/contactlist/contact/) route is corporate phone **03-3546-0505**. Operator gallery isn't a CC license: no copies uploaded.
3. Other 16 previously verified original operator, business listing or venue-specific gallery links remain intact; no other source changes needed without stronger evidence.

## High-risk rights routing within those 18
- `r31` former Katsu Midori Seibu Shibuya: closed **2026-09-30** per the original operator; historical archive, **no marketing-photo outreach as an active restaurant**.
- `a32` Kimono Photo Studio WA: official studio is in **Kamiosaki/Meguro**, not catalogue's Asakusa area. Do not publish an image until the venue location record is reconciled.
- `a34` Hirakuza Ginza: exact Ginza performance images only, not Osaka; written photographer/performer permission necessary where applicable.
- `a38` Deeper Japan, `a39` DENTÔ, `a40` Sunrise Tours: broad multi-site/partner experiences. A provider is not a single photographable Tokyo shop; request **which Tokyo workshop/operator, venue address, source file and copyright owner** before mapping any image.
- `a31` Hasegawa Eiga Roppongi's sake session has member-introduction restrictions according to operator. Business permission/contact is not visitor entitlement nor rights permission.
- Other hotel-use questions must go to photograph's legal rights holder, not automatically to the business or Tabelog/Flickr uploader. Written grant should identify URL/original filename, photographer/copyright owner, actual branch, commercial use by third-party guest guide, territories, duration, required credit, permitted crops/adaptations, CC BY-SA derivative-share-alike obligations if applicable, and recognizable people/underlying artwork clearances.

## Non-aggressive Commons discovery corrections
- [photo-discovery.yml](../.github/workflows/photo-discovery.yml) changed from **daily + push-trigger** to **weekly Monday 01:25 UTC and manual dispatch**. This avoids triggering a full request sequence on every source-code edit and reduces rate-limit pressure.
- [find-commons-photos.cjs](../tests/find-commons-photos.cjs) still visits the 131 report entries but **never queries the already registered 89**. The seven previously priority IDs still run first. Each query has **one attempt**; the **first HTTP 429 activates a circuit breaker** for the remainder of that job. Undone records explicitly become `DEFERRED_API_RATE_LIMIT`, never `NO_ELIGIBLE_CANDIDATE_FOUND`. Previously published photos remain untouched. No bypassing Wikimedia's 429 with alternate identities, proxies or repeated retries.
- An authorized original photographer's explicit CC0 / CC BY / CC BY-SA *per-file* grant is acceptable only with true venue matching, exact branch, correct credit/license notices and any applicable privacy/underlying work rights. CC BY-NC, CC BY-ND, press-release availability and operator site images without a license do not pass.

## Ready-to-send Japanese permissions inquiry — NOT SENT
**件名：写真使用許諾のお願い（東京ゲスト向けコンシェルジュガイド／対象施設名）**

ご担当者様

東京のゲスト向けウェブガイド「Tokyo Concierge Atelier」で、貴施設の実際の店舗・体験を正確にご紹介するため、写真の利用可否を確認しております。下記についてご教示いただけますでしょうか。

- 対象店舗・体験名と、実際に撮影された住所・支店
- 使用を許諾いただける写真の原本URL・ファイル名・撮影者・著作権者
- 第三者のゲスト向けウェブガイドでの**商用公開・表示**の許可範囲（期間・地域・クレジット・トリミング等の加工条件）
- 人物・作品が写り込む場合の肖像権・作品権利等の確認状況
- 必要なクレジット表記と書面による利用許諾の可否

ご許諾が確認できるまでは写真を複製・掲載いたしません。ご案内可能な広報／写真権利担当者様がいらっしゃればお知らせください。

よろしくお願いいたします。

## English note — NOT SENT
Subject: Request for specific image-use rights for Tokyo Concierge Atelier guest guide

We are checking whether photographs depicting **[the precise venue and branch]** can be displayed on a third-party guest-facing commercial web guide. Could you identify each original image/file URL, the photographer and copyright owner, the actual photographed address, and whether **written commercial reproduction rights** can be granted (credit, term, territory and cropping)? Please also confirm rights for recognizable people or installed artworks if applicable. We will not reproduce any image until the specific rights have been verified.

## Release conditions
Review the [18-place CSV](commons-18-rights-and-contact-triage-2026-10-20.csv), keep prior image approval ledger unchanged, run Chromium PR tests on both new exact operator gallery sources, run main Pages deploy and verify 89 image loads locally and on the published site. Actual iPhone Safari hardware testing is not part of Chromium mobile emulation.
