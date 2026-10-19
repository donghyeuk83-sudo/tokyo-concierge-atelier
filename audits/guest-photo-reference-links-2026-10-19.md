# Customer-facing exact-venue photo reference links — 2026-10-19

**Applied to existing Tokyo Concierge Atelier**. This is a practical customer-guide improvement: the unphotographed venue cards retain their existing custom illustration and show a styled **View venue photos ↗ / 施設写真を見る ↗ / 현장 사진 보기 ↗** external link. The same original-source link is present in the detail modal. These links open the publisher's original venue/photo page with `target=_blank` and `rel=noopener noreferrer`. **No publisher photograph has been copied, proxied, embedded, or re-hosted.**

**Guest-facing external photo/location source links:**

| Venue ID | Original page | Source character |
| --- | --- | --- |
| r01 | [External photo / venue page](https://tabelog.com/tokyo/A1317/A131701/13232637/dtlphotolst/smp2/) | listing |
| r03 | [External photo / venue page](https://miyashiro.mom/) | operator |
| r18 | [External photo / venue page](https://www.fourseasons.com/tokyo/dining/restaurants/sezanne/) | operator |
| r21 | [External photo / venue page](https://press.mandarinoriental.com/tokyo-pizza-bar/?lang=eng) | press |
| r34 | [External photo / venue page](https://neo-emotion.jp/brands/harajuku-harakado/) | operator |
| r50 | [External photo / venue page](https://moonflower-sagaya.com/en/artwork/) | operator |
| r51 | [External photo / venue page](https://suigian.jp/) | operator |
| w05 | [External photo / venue page](https://www.shimizuyu.com/gallery.html) | operator |
| w06 | [External photo / venue page](https://tokyosomeionsensakura.com/en/) | operator |
| a26 | [External photo / venue page](https://shizukokoro.com/lp/) | operator |
| a28 | [External photo / venue page](https://ichiru.net/blog/%E8%97%8D%E6%9F%93%E3%82%81%E4%BD%93%E9%A8%93%EF%BD%9E%E4%B8%96%E7%95%8C%E3%82%92%E9%AD%85%E4%BA%86%E3%81%99%E3%82%8B-japan-blue%EF%BD%9E/?tid=24) | editorial |
| a30 | [External photo / venue page](https://prtimes.jp/main/html/rd/p/000000161.000043533.html) | press |
| a34 | [External photo / venue page](https://hirakuza.net/tokyo/) | operator |
| a36 | [External photo / venue page](https://japan-sumo.jp/) | operator |
| s15 | [External photo / venue page](https://www.jalan.net/kankou/spt_guide000000151652/photo/) | listing |

The source page may be an operator website, press release, restaurant listing with shop/user photos, or editorial/gallery site. A link **does not mean the whole page is officially authorized for reuse**; the images remain on the source websites and may change. Some pages illustrate the venue's menu/artworks rather than the whole building. For example, MoonFlower Sagaya Ginza's artwork page includes teamLab rights; Shimizuyu's [own bathhouse gallery](https://www.shimizuyu.com/gallery.html) is externally viewable but all-rights-reserved. Links are for guest reference only and retain source credit via their host websites.

**Excluded from this feature:** Kimono Photo Studio WA (`a32`), because its official address is near Meguro rather than the Asakusa location recorded in the catalogue; `r31` closed Katsu Midori Seibu Shibuya; any candidate without a reasonably identifiable exact-venue source page. The cards do not label the linked photos as newly licensed or served by this site.

### Verification scope

- Existing 131 catalog records, 83 registered photo mappings, 48 pending illustrations are unchanged.
- `tests/smoke.cjs` checks all 15 source records are defined, tests example venue cards across restaurant, wellness, attraction and shopping categories, external link host/target/rel, matching detail link, no third-party image embedded, Korean translation and a 390px iPhone viewport.
- Existing photo attribution checks, photo license approval gate, 131 link audits, and deployed Chromium image loading continue. Only **properly file-licensed** original photos should ever be added to `LICENSED_VENUE_PHOTOS`.
