# Tokyo Concierge Atelier — photo-permission route audit (2026-10-19)

## Scope, decision and limitations

- The published catalogue is **131 locations / 83 mapped photos / 48 photo-pending cards**. No new photo has been approved or inserted in this research pass.
- The `audits/photo-permission-outreach-2026-10-19.csv` contains **one row for each of the 48 pending IDs**, in the same order as `audits/missing-photo-queue.csv`.
- **12 operator inquiry routes** have been confirmed on the operator's own website or the named branch's official shopping-center listing. Contact details do **not** grant the right to republish any picture. 35 further routes are unverified and one old Shibuya branch has a confirmed closure.
- No emails, forms or messages were sent, no image licenses were purchased, and no original photography was copied. Obtain **written clearance for specific photographs, commercial hotel guest-guide web publication, resizing/cropping rules, credits, duration and revocation terms** before publication.
- Flickr/Commons searches returned photos of different branches or unknown licensing, notably for Seirinkan, NINJA TOKYO, Ristorante ASO, Sushi Takeuchi, Ninja Trick House and Kura Sushi. The previous detailed rejection evidence remains in `docs/venue-photo-clearance.md`. Searching a file and identifying the restaurant are not the same as permission to reuse it.

## Confirmed contact routes (not publication clearance)

| Venue ID | Place | Route and original source | Limitations |
| --- | --- | --- | --- |
| r01 | Udatsu Sushi (Nakameguro) | `reservations@udatsu-sushi.com` — [operator site](https://udatsu-sushi.jp/) | Contact is publicly listed; verify it accepts rights requests rather than reservations. |
| r02 | Sushi Takeuchi (Daikanyama) | `03-6455-0080` — [operator site](https://daikanyamasushitakeuchi.com/) | Ask for the owner or publicity contact; phone is not authorization. |
| r03 | Tempura Miyashiro (Nakameguro) | `03-6452-2808` — [operator site](https://miyashiro.mom/) | Photograph-specific license needed. |
| r05 | Tempura Kusunoki Nakameguro | [official contact form](https://kusunoki-official.co.jp/contact/) | The form has a **取材依頼 (media inquiry)** category. Explicitly identify the Nakameguro location, not the Yotsuya flagship. |
| r32 | Kanazawa Maimon Sushi Shibuya PARCO | `03-5784-1144` — [Shibuya PARCO venue listing](https://shibuya.parco.jp/shop/detail/?cd=025691) | 7th-floor location confirmed; different branch photography is not interchangeable. |
| w05 | Musashi-Koyama Onsen Shimizuyu | [official contact form](https://www.shimizuyu.com/contact.html) | Must distinguish Musashi-Koyama from Minami-Aoyama Shimizuyu. |
| w06 | Tokyo Somei Onsen SAKURA | `03-5907-5566` — [official operator page](https://tokyosomeionsensakura.com/en/) | An inquiry route, not permission to copy official bathhouse images. |
| a26 | Shizu-Kokoro Tea Ceremony | [official contact form](https://shizukokoro.com/contact/) | Require exact Asakusa studio photo and terms. |
| a27 | Tokyo Maikoya Tea Ceremony Asakusa | `pr@maikoya.com` — [official travel-trade portal](https://mai-ko.com/groups.html) | Dedicated PR/media desk. The [GLOBA media library](https://mai-ko.com/media-library/) is **password-protected**; no implied public reuse rights. Specify Asakusa, not Kyoto/Shinjuku. |
| a28 | Wanariya Indigo Dyeing | `03-5603-9169` — [operator's Asakusa workshop listing](https://wanariya.co.jp/english/2024/05/17/reiwa-6-2024-year-of-the-dragon-sanja-festival/) | Ask about reproducing images of the Senzoku/Asakusa workshop, not simply a generic aizome process. |
| a30 | BUB Activity Center Asakusa | `bac_support@bub-inc.com` — [official site](https://bub-activitycenter.com/) | Guest permission to photograph an activity is **not** reuse permission for the operator's promotional images. |
| a38 | Deeper Japan Experiences | `info@deeperjapan.com` — [official contact page](https://www.deeperjapan.com/contact) | Provider covers multiple places; approve a photo only after identifying a specific Tokyo venue. |

**Special case:** r31 Mawashi Sushi Katsu Midori Seibu Shibuya is [permanently closed since September 30, 2026](https://katumidori.co.jp/announce/sibuyaclose/). Do not prioritize a photo of it for a currently operating guest recommendation. Existing closed notice is preserved.

## Research routing for all 48 cards

The CSV preserves every card's ID, Japanese and English place name, area, current listed venue URL, verified contact status, contact route where evidenced, provenance link and unresolved photo permission status. Unverified fields are **blank intentionally**; do not fabricate an address or guess that a booking form can license images. The official URL column is for *identity investigation*, not a claim that it handles press permissions.

## Suggested Japanese inquiry text for a rights-holder (NOT SENT)

件名：施設写真の掲載許可について（ホテル・コンシェルジュ案内）

貴社の［施設名・所在地］をホテル宿泊者向けの東京ガイドにご紹介するため、［元画像URL・画像名］の掲載可否を確認させてください。商用のホテル業務に伴うWeb公開、縮小表示・必要なトリミングの可否、必要な著作権表記、許諾の有効期間、掲載可能な素材URLを文書でご回答いただけますと幸いです。許諾をいただくまでは画像を公開いたしません。

## Recommended work order

1. Request venue-owned press kits from the 12 confirmed operator channels, starting with r05 (media form), a27 (PR email), a30 (support and partnership contact) and a38 (operator contact). User or authorized hotel representative must approve/supply the identity for any actual outreach.
2. Obtain explicit file-level rights and exact-branch identity for submitted photos; preserve the original request and approval evidence. If a photographer rather than an operator owns the image, obtain **photographer** permission separately.
3. Enter approved source, photographer, license URL and external location evidence into `audits/photo-clearance-approvals.json`, update `LICENSED_VENUE_PHOTOS`, rerun photo-queue generation and browser tests. Do not count an external site's image as cleared just because it loads.
4. Keep `83/131` as the production baseline unless the repo was actually updated and a deployed browser test proves the new image loads.
