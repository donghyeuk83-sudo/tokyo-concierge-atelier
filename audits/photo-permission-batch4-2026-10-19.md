# Tokyo Concierge Atelier — final ten contact investigations and original-photo review

Date: **2026-10-19** · Base: `8a9046a557aa1c8bc6d9ee76caf3a36d8c6ff04c`

## Decisions

- Source catalogue and site layout **unchanged**: **131 cards, 83 existing mapped real photos, 48 unphotographed**. No new photos published because no *new* candidate met both the original-file commercial-use requirement and exact facility/branch identity test.
- Nine of the ten outstanding businesses now have a **published, traceable direct inquiry path**: 46 total routes evidenced for the 48 photos still pending. One historical branch (`r31`, Seibu Shibuya Katsu Midori) is closed, and `r52` Nagatacho Ouka has **no verified public rights-holder contact**. Neither an introduction-only dining reference nor a third-party listing is automatically authority to license photographs.
- **Actual image use permission granted this round: zero.** We did not send email, call businesses, fill inquiry forms or copy photos.

## Nine contact results — source strength matters

| ID | Venue | Evidenced contact | Provenance and caution |
| --- | --- | --- | --- |
| r04 | Ten-Masa Nakameguro | 03-6303-4005 | [Official-labelled Tabelog listing](https://selection.tabelog.com/tokyo/A1317/A131701/13147445/dtlmenu/photo/?svd=20250325&svps=2&svt=1900&vac_net=1), matches 3-16-13 Kamimeguro; platform-hosted business phone, not a photographer/license grant. |
| r06 | Seirinkan Nakameguro | 03-3714-5160 | [Exact venue Tabelog page](https://tabelog.com/tokyo/A1317/A131701/13003188/) and [official Instagram pointer](https://tabelog.com/tokyo/A1317/A131701/13003188/dtlmap); direct restaurant telephone, but its Flickr photos remain All rights reserved. |
| r11 | Yoroniku Minami-Aoyama | 03-3498-4629 | [Official-labelled restaurant Tabelog](https://selection.tabelog.com/tokyo/A1306/A130602/13042979/party/) confirms Aoyama 6-6-22. Do not confuse with Omotesando sister restaurants or infer photo copyright. |
| r38 | Sushi Somei Ebisu | 03-6455-3900 | [Retty business listing marked official](https://retty.me/area/PRE13/ARE7/SUB701/100000867814/), corroborated by [Hitosara](https://hitosara.com/0006075718/map.html); platform phone, not a confirmed media desk. |
| r39 | Sushi Yuji Ebisu | 03-6277-0276 | [Business profile on Tabelog](https://selection.tabelog.com/tokyo/A1303/A130302/13310768/) and [Ikyu](https://restaurant.ikyu.com/148547/) match 4-11-9 Ebisu; neither platform grants rights to its photographer's uploaded images. |
| r40 | Ikina Sushi Dokoro Abe Hiroo Bekkan | 03-3440-5088 | [Original operator's branch listing](https://ikinasushidokoroabe.jp/address.html) expressly lists Minamiazabu 4-2-38, not the Hiroo Honten. Restaurant can route rights inquiry but must establish photographer ownership. |
| r42 | Bikkuri Sushi Ebisu | 03-5795-2333 | [Operator's own reservation page](https://sushipro.secure.idchosting.jp/reservation/) explicitly identifies Ebisu shop. Booking contact is not a commercial reproduction license. |
| a36 | Tokyo Sumo Festival Ginza | tokyosumofesta@gmail.com | [Official operating-company information](https://japan-sumo.jp/) identifies venue at Ginza Inz 1 B1F and publishes the email. Guest photography permission does not automatically authorize publication of the operator's photographs or recognisable participants. |
| s15 | Ryogoku Takahashi | 03-3631-2420 | [Sumida City Tourism Association's official venue record](https://visit-sumida.jp/spot/6193/) confirms exact 4-31-15 Ryogoku store and direct shop number, **not** a copyright grant. |

**Unresolved `r52`:** Nagatacho Ouka is listed in the catalogue as a special invitation-style dining experience; an independent indexed description claims no public reservation channel. Neither a photograph's rights holder nor a public operator contact was established at a sufficiently authoritative primary source. Preserve blank fields and ask for a rights-holder introduction through an authorized concierge contact rather than inventing an email.

## File-by-file Flickr/Commons investigation

The independent artifact `audits/photo-original-candidate-decisions-2026-10-19.csv` covers **all 48 pending venue IDs** in original order. It documents **16 sample original image/candidate links** with explicit non-publication decisions, and flags the other 32 as **NO_APPROVED_SOURCE_NOT_EXHAUSTIVE**. These decisions are an audit of known evidence, not a claim of 48 exhaustive Flickr API searches.

Examples cross-checked against the **original** file or previously archived original-file review:

- `r06` [yusheng's Seirinkan Flickr](https://www.flickr.com/photos/yusheng/6225457113) explicitly identifies 2-6-4 Kami-Meguro and shows **All rights reserved**: exact business but **no copying**.
- `r47` [Rick Cogley's Roppongi Robataya Flickr](https://www.flickr.com/photos/rickcogley/8171494828/) confirms the exact restaurant; its Flickr **CC BY-NC-ND 2.0** is **not a commercial-use clearance**.
- `a29` [Togakushi Ninja Trick Mansion original Commons file](https://commons.wikimedia.org/wiki/File:Togakushi_Folk_Museum,_Togakushi_Ninja_Museum,_Ninja_Trick_Mansion.jpg) has valid commercially compatible CC BY-SA terms, but its description and coordinates put it in **Nagano**, not Tokyo's Shinjuku Ninja Trick House.
- `r32` [Kura Sushi/Maimon candidate photographed in AEON Mall Makuhari](https://commons.wikimedia.org/wiki/File:AEONMALL-Makuharishintoshin---2026-03_040.jpg) is a CC image of a different branch rather than Shibuya PARCO.
- `r41` [Narita Airport Sushiko Commons photograph](https://commons.wikimedia.org/wiki/File:202406011703_IMG_0191.jpg) does not depict Tsukiji Sushiko **Ebisu**.
- Other previously screened photos: `r02` exact Sushi Takeuchi but all-rights-reserved, `r09` ASO all-rights-reserved, `r11` Yoroniku all-rights-reserved, `r21` The Pizza Bar on 38th all-rights-reserved, `a34` Hirakuza Ginza all-rights-reserved, `r45` licensed photo of wrong Zauo branch. Each stays unpublished.

## What will actually authorize a photograph

File URL and file-specific CC0/CC BY/CC BY-SA commercial license **plus** exact branch evidence, or an explicit copyright-owner written commercial hotel concierge-guide web-use grant specifying target image, transformations, attribution and duration. Operator directories, restaurant press galleries, general guest photography policies, social-sharing consent, Google/Flickr searchable files or a similar-name venue do **not** meet that test.

Before inserting a new photo, add a record to `audits/photo-clearance-approvals.json`, update the venue mapping in `index.html`, regenerate missing-photo queue and audit its candidate disposition, then require passing local and deployed Chromium QA. The existing 83 mappings were not independently re-cleared by this pass. **No outbound permission outreach was carried out.**
