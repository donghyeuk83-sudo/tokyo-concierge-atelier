// Tokyo Concierge Atelier — venue image selection policy (added 2026-10-22).
"use strict";
// Classic script, loaded synchronously after atelier-media.js and before atelier-illustration.js.
// It never edits the byte-pinned registries in atelier-media.js (LICENSED_VENUE_PHOTOS,
// AI_VENUE_VISUALS); it only decides which already-registered asset a card may show.
//
// Priority for each venue ID:
//   1. official  — operator/official image WITH a documented, file-specific reuse grant
//   2. licensed  — existing approved photo registry (LICENSED_VENUE_PHOTOS, rendered by card())
//   3. stock     — free commercial stock image, shown ONLY as a labelled generic reference
//   4. ai        — pre-existing AI illustration, unless quarantined below
//   5. svg       — built-in SVG illustration (always available, never fails)
//
// A stock image is displayed only when its license, its file and its visual content were each
// checked. Nothing here may present a stock or AI image as a photograph of the actual venue.

const VENUE_IMAGE_POLICY_VERSION="20261022-manual-photos";

// Pre-existing AI tiles that must never be shown again. Files stay on disk (protected originals);
// only the card mapping is suppressed. Audited visually on 2026-10-22 — see
// audits/image-policy-audit-2026-10-22.md for the per-file evidence.
const AI_VISUAL_QUARANTINE={
a34:{issues:["watermark"],note:"pollinations.ai watermark, bottom right"},
a38:{issues:["watermark"],note:"pollinations.ai watermark, bottom right"},
r01:{issues:["watermark"],note:"pollinations.ai watermark, bottom right"},
r02:{issues:["baked-text","wrong-area","wrong-venue-name","badge"],note:"Baked 'Tsukiji Outer Market' title, 'Chuo' map pin and 'AI VISUAL · PHOTO' badge; Sushi Takeuchi is in Daikanyama (Shibuya)"},
r03:{issues:["watermark"],note:"pollinations.ai watermark, bottom right"},
r06:{issues:["fictional-signage"],note:"Invented European rotunda storefront with garbled pseudo-name sign; not Seirinkan"},
r08:{issues:["watermark","fictional-signage"],note:"pollinations.ai watermark and garbled storefront sign"},
r09:{issues:["baked-text","wrong-area","badge"],note:"Baked 'Ginza' title, 'Chuo' map pin and badge; Ristorante ASO is in Daikanyama"},
r11:{issues:["baked-text","wrong-area","badge"],note:"Baked 'Ginza' title, 'Chuo' map pin and badge; Yoroniku is in Minami-Aoyama (PR #69)"},
r18:{issues:["baked-text","wrong-area","badge"],note:"Baked 'Nihonbashi' title, 'Chuo' pin and badge; SÉZANNE is in Marunouchi"},
r21:{issues:["fictional-signage"],note:"Same invented rotunda storefront as r06; The Pizza Bar on 38th is in Nihonbashi Mitsui Tower"},
r28:{issues:["baked-text","wrong-area","badge"],note:"Baked 'Golden Gai' title, 'Shinjuku' pin and badge; YEBISU BAR STAND is in Ebisu"},
r39:{issues:["watermark"],note:"pollinations.ai watermark, bottom right"},
r40:{issues:["baked-text","wrong-area","wrong-venue-name","badge"],note:"Baked 'Tsukiji Outer Market' title, 'Chuo' pin and badge; venue is in Hiroo"},
r43:{issues:["baked-text","wrong-area","wrong-venue-name","badge"],note:"Baked 'Tsukiji Outer Market' title, 'Chuo' pin and badge; venue is in Ebisu"},
r47:{issues:["baked-text","wrong-area","badge"],note:"Baked 'Chuo' pin, 'Shopping' caption and badge; Robataya is in Roppongi"},
r50:{issues:["watermark"],note:"pollinations.ai watermark, bottom right"},
s15:{issues:["baked-text","wrong-area","wrong-venue-name","badge"],note:"Baked 'Ueno Park' title, 'Taito' pin and badge; Ryogoku Takahashi is in Ryogoku (Sumida)"},
// 2026-10-22 (owner request): every AI image reused across venues is withdrawn as well.
a26:{issues:["duplicate"],note:"Same generated image as a39; not specific to this venue"},
a27:{issues:["duplicate"],note:"Same generated image as a31, r52; not specific to this venue"},
a28:{issues:["duplicate"],note:"Same generated image as a37; not specific to this venue"},
a29:{issues:["duplicate"],note:"Same generated image as a36; not specific to this venue"},
a31:{issues:["duplicate"],note:"Same generated image as a27, r52; not specific to this venue"},
a36:{issues:["duplicate"],note:"Same generated image as a29; not specific to this venue"},
a37:{issues:["duplicate"],note:"Same generated image as a28; not specific to this venue"},
a39:{issues:["duplicate"],note:"Same generated image as a26; not specific to this venue"},
r04:{issues:["duplicate"],note:"Same generated image as r29 r31 r32 r33 r36 r37 r38 r41 r44; not specific to this venue"},
r05:{issues:["duplicate"],note:"Same generated image as r34, r42; not specific to this venue"},
r29:{issues:["duplicate"],note:"Same generated image as r04 group; not specific to this venue"},
r31:{issues:["duplicate"],note:"Same generated image as r04 group; not specific to this venue"},
r32:{issues:["duplicate"],note:"Same generated image as r04 group; not specific to this venue"},
r33:{issues:["duplicate"],note:"Same generated image as r04 group; not specific to this venue"},
r34:{issues:["duplicate"],note:"Same generated image as r05, r42; not specific to this venue"},
r36:{issues:["duplicate"],note:"Same generated image as r04 group; not specific to this venue"},
r37:{issues:["duplicate"],note:"Same generated image as r04 group; not specific to this venue"},
r38:{issues:["duplicate"],note:"Same generated image as r04 group; not specific to this venue"},
r41:{issues:["duplicate"],note:"Same generated image as r04 group; not specific to this venue"},
r42:{issues:["duplicate"],note:"Same generated image as r05, r34; not specific to this venue"},
r44:{issues:["duplicate"],note:"Same generated image as r04 group; not specific to this venue"},
r52:{issues:["duplicate"],note:"Same generated image as a27, a31; not specific to this venue"},
w05:{issues:["duplicate"],note:"Same generated image as w06; not specific to this venue"},
w06:{issues:["duplicate"],note:"Same generated image as w05; not specific to this venue"}
};

// 1. Official images: only file-specific, written reuse grants. None documented as of 2026-10-22;
// prior outreach (audits/photo-permission-*) recorded NO_EXPLICIT_LICENSE_OR_PERMISSION for every
// pending venue. Official galleries stay reachable through VENUE_PHOTO_SOURCE_LINKS instead.
const VENUE_OFFICIAL_IMAGES={};

// 3. Free stock library — one distinct photo per venue (no photo is shared by two venues).
//  approvedForReuse — the photo's own Unsplash page was read on lastVerified: "Free to use under the
//                     Unsplash License" (commercial use, no attribution required; credit shown anyway).
//                     Rejected candidates tagged to a real competing business are listed in the audit.
//  fileVerified / contentVerified — the image file was decoded / looked at by a person. Both are
//                     false: image CDNs were unreachable from the build sandbox. CI must decode each
//                     file (naturalWidth > 0) on GitHub; a load failure falls back to the SVG.
//  ownerApproved    — the site owner instructed on this date to publish these without the visual check.
// A stock image is displayed when its license is confirmed AND (file+content verified OR owner approved).
const STOCK_IMAGE_LIBRARY={
"unsplash-r01-sushi":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1772285268647-11deb0bdbe29?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/tuna-nigiri-sushi-with-lime-on-a-plate-0GLzjcRBJQ8",photographer:"MChe Lee",photographerUrl:"https://unsplash.com/@mclee",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"sushi",alt:"Tuna nigiri sushi on a plate (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-r02-sushi":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1763943431214-275e64002f90?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/tuna-sushi-with-ginger-and-wasabi-on-wooden-plate-Jm5uc0Z-5MQ",photographer:"HANVIN CHEONG",photographerUrl:"https://unsplash.com/@hktram0311",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"sushi",alt:"Tuna nigiri sushi with ginger and wasabi (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-r39-sushi":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1653122024993-31e02aedb1ac?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/a-black-plate-topped-with-sushi-covered-in-sauce-6h67YVuQggI",photographer:"kimia kazemi",photographerUrl:"https://unsplash.com/@kimick",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"sushi",alt:"Sushi on a black plate (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-r40-sushi":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1724115890005-a610449d9ab7?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/a-variety-of-sushi-on-a-black-plate-6ZLJkVvqcB4",photographer:"Tadahiro Higuchi",photographerUrl:"https://unsplash.com/@tad_higuchi",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"sushi",alt:"A variety of sushi on a black plate (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-r43-sushi":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/sushi-on-black-ceramic-plate-FBgCgJhPO2I",photographer:"Marina Grynykha",photographerUrl:"https://unsplash.com/@grynykha",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"sushi",alt:"Sushi on a black ceramic plate (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-r38-sushi":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1667343352641-044b9d729737?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/a-plate-of-sushi-cDKRNUG4uec",photographer:"Kristina Truniak",photographerUrl:"https://unsplash.com/@kristinatruniak",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"sushi",alt:"A plate of sushi (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-r41-sushi":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/sushi-on-white-ceramic-plate-Jz4QMhLvGgw",photographer:"Derek Duran",photographerUrl:"https://unsplash.com/@derekduran",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"sushi",alt:"Sushi on a white ceramic plate (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-r42-sushi":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1648141294171-de1980517238?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/a-plate-of-sushi-with-chopsticks-and-a-bowl-of-sauce-I_sG8AZFpNs",photographer:"Andrea Riezzo",photographerUrl:"https://unsplash.com/@andriezzo",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"sushi",alt:"A plate of sushi with chopsticks (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-r44-sushi":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1636425730695-febe95eda12e?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/a-platter-of-sushi-with-various-toppings-kNH31Q7MDUY",photographer:"Israel Albornoz",photographerUrl:"https://unsplash.com/@israelalbornoz",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"sushi",alt:"A platter of sushi (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-r29-sushi":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1710963436908-bd64ba48fa63?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/a-plate-of-sushi-and-chopsticks-on-a-table-CTKZoGi-hwU",photographer:"Andrey Câmara",photographerUrl:"https://unsplash.com/@andreycamara",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"sushi",alt:"A plate of sushi and chopsticks (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-r31-sushi":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1563612116625-3012372fccce?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/sushi-on-wooden-platter-5KS7T3Gs3CA",photographer:"Fadya Azhary",photographerUrl:"https://unsplash.com/@fadsphoto23_",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"sushi",alt:"Sushi on a wooden platter (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-r33-sushi":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1553621042-f6e147245754?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/food-photography-of-varieties-of-sushies-O2yNzXdqOu0",photographer:"Riccardo Bergamini",photographerUrl:"https://unsplash.com/@deram31",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"sushi",alt:"Varieties of sushi (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-r36-sushi":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1635526910429-051cf1ed127e?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/sushi-on-a-wooden-cutting-board-8nFtscE1D_w",photographer:"David Foodphototasty",photographerUrl:"https://unsplash.com/@phototastyfood",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"sushi",alt:"Sushi on a wooden board (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-r37-sushi":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1737501844370-e59fb449880d?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/a-table-topped-with-plates-of-sushi-and-chopsticks-_0tRthXYh1U",photographer:"Szegedi Attila",photographerUrl:"https://unsplash.com/@attila_szegedi",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"sushi",alt:"Plates of sushi and chopsticks (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-r03-tempura":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1535924571710-4c6e27716b6d?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/tempura-set-paMbZ0iNka8",photographer:"Markus Winkler",photographerUrl:"https://unsplash.com/@markuswinkler",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"tempura",alt:"Tempura set (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-r04-tempura":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1570078362689-c57c33cca104?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/tempura--wC0yYRdGIY",photographer:"Lee Soo hyun",photographerUrl:"https://unsplash.com/@arisu_view",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"tempura",alt:"Tempura (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-r05-tempura":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1650143987591-8e2d4231a8d6?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/a-white-bowl-filled-with-food-on-top-of-a-table-LiD0OJ3KJ7c",photographer:"Fernando Andrade",photographerUrl:"https://unsplash.com/@thisisnando",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"tempura",alt:"Shrimp tempura (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-r06-pizza":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1754799565084-b381bd0b4db7?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/pizza-being-removed-from-a-wood-fired-oven-zyvkmq1yJBs",photographer:"Ari Kurniawan",photographerUrl:"https://unsplash.com/@arikurniawan",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"pizza",alt:"Pizza taken from a wood-fired oven (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-r08-pizza":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1622880833523-7cf1c0bd4296?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/pizza-baking-in-wood-fired-oven-vHRFraV4U00",photographer:"Fabrizio Pullara",photographerUrl:"https://unsplash.com/@fabrizio_photopf",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"pizza",alt:"Pizza baking in a wood-fired oven (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-r09-italian":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1583331030528-5ae1c7fb81ee?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/yfs1UJziyoM",photographer:"engin akyurt",photographerUrl:"https://unsplash.com/@enginakyurt",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"italian",alt:"Pasta dish on a white plate (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-r11-yakiniku":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1759150595639-d128196ab6b3?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/meat-sizzling-on-a-hot-grill-with-steam-rising-oiS-Tjtemvs",photographer:"Stanley Kustamin",photographerUrl:"https://unsplash.com/@kyelnats",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"yakiniku",alt:"Meat on a hot grill (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-r52-kaiseki":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1766582931800-fd79665257fa?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/a-japanese-multi-course-meal-with-various-small-dishes-xSHQF1rKaVE",photographer:"Yosuke Ota",photographerUrl:"https://unsplash.com/@yosuke_ota",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"kaiseki",alt:"A Japanese multi-course meal (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-a26-tea":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1765035058192-edd7ee3e0df0?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/woman-in-kimono-performs-traditional-tea-ceremony-TmgR2If58HM",photographer:"Tiago Ebisui",photographerUrl:"https://unsplash.com/@tiagoebisui",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"tea",alt:"Tea ceremony in kimono (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-a27-tea":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1743515483156-6bf698521774?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/woman-prepares-traditional-tea-in-a-serene-setting--Sc01q9zBbw",photographer:"Rod Long",photographerUrl:"https://unsplash.com/@rodlong",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"tea",alt:"Preparing traditional tea (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-a39-matcha":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1757582893381-6d1b8674c1f7?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/matcha-powder-in-a-wooden-spoon-with-whisk-and-bowl-FqzpQmrHrik",photographer:"Emma THERON",photographerUrl:"https://unsplash.com/@amethron27",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"matcha",alt:"Matcha powder, whisk and bowl (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-a37-matcha":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1746932451426-209444cd613a?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/someone-is-whisking-matcha-tea-in-a-bowl-GThopTGQEGc",photographer:"Qdal Studio",photographerUrl:"https://unsplash.com/@qdalstudio",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"matcha",alt:"Whisking matcha in a bowl (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-a31-sake":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1664477407933-dd42ed0c6c62?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/a-group-of-people-pouring-liquid-into-small-cups-kmvUaRxhjb4",photographer:"Frederick Shaw",photographerUrl:"https://unsplash.com/@dropfastcollective",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"sake",alt:"Sake poured into small cups (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-a28-indigo":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1778084356053-40103587d24f?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/wall-display-of-indigo-dyed-fabric-squares-nQX99aOzyXE",photographer:"Jimmy Liu",photographerUrl:"https://unsplash.com/@jimmy__liu",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"indigo",alt:"Indigo-dyed fabric squares (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-a29-ninja":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1567299720257-2619000f105e?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/xm49F658RyM",photographer:"Daniel Lincoln",photographerUrl:"https://unsplash.com/@danny_lincoln",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"ninja",alt:"Shuriken throwing star (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
// 2026-10-22 venue additions. a48/a49 are photos OF that place (location-tagged), not generic.
"unsplash-r53-yakitori":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1767974968707-db3d448d4ef3?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/grilled-meat-skewers-on-a-serving-platter-z4MYbjYb5p0",photographer:"tommao wang",photographerUrl:"https://unsplash.com/@tommaomaoer",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"yakitori",alt:"Grilled meat skewers on a platter (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-r54-tonkatsu":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1770966666361-b448e634e163?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/three-breaded-cutlets-with-shredded-cabbage-and-lemon-fvGOeiYaza4",photographer:"Zhang Ziyu",photographerUrl:"https://unsplash.com/@rs1497",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"tonkatsu",alt:"Breaded pork cutlets with shredded cabbage (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-r55-ramen":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1509680859026-7d8cfc6894f4?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/focus-photography-of-ramen-in-bowl-with-condiment-shakers-lbxLlgi_8_w",photographer:"j",photographerUrl:"https://unsplash.com/@janicetea",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"ramen",alt:"Bowl of ramen (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-a48-garden":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1532188978303-4bfaccc429d2?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/A57akxc-4BQ",photographer:"Thor Alvis",photographerUrl:"https://unsplash.com/@terminath0r",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"garden",alt:"Pond and pavilion in Shinjuku Gyoen",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:true,locationEvidence:"Unsplash location tag: Shinjuku Gyoen National Garden, Shinjuku-ku",lastVerified:"2026-10-22"},
"unsplash-a49-market":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1705056132737-6d2df2218726?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/a-bunch-of-fish-that-are-in-some-boxes-C9j8IFVV2uQ",photographer:"Deepavali Gaind",photographerUrl:"https://unsplash.com/@deepavalig",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"market",alt:"Fish in boxes at Tsukiji",approvedForReuse:true,fileVerified:false,contentVerified:false,ownerApproved:"2026-10-22",isActualVenue:true,locationEvidence:"Unsplash location tag: Tsukiji 4-13-13, Chuo City (outer market area)",lastVerified:"2026-10-22"}
};

// Venue → its own stock photo. Never used for a venue with an approved registry photo.
const VENUE_STOCK_IMAGES={
r01:"unsplash-r01-sushi",r02:"unsplash-r02-sushi",r39:"unsplash-r39-sushi",r40:"unsplash-r40-sushi",r43:"unsplash-r43-sushi",r38:"unsplash-r38-sushi",r41:"unsplash-r41-sushi",r42:"unsplash-r42-sushi",r44:"unsplash-r44-sushi",r29:"unsplash-r29-sushi",r31:"unsplash-r31-sushi",r33:"unsplash-r33-sushi",r36:"unsplash-r36-sushi",r37:"unsplash-r37-sushi",r03:"unsplash-r03-tempura",r04:"unsplash-r04-tempura",r05:"unsplash-r05-tempura",r06:"unsplash-r06-pizza",r08:"unsplash-r08-pizza",r09:"unsplash-r09-italian",r11:"unsplash-r11-yakiniku",r52:"unsplash-r52-kaiseki",a26:"unsplash-a26-tea",a27:"unsplash-a27-tea",a39:"unsplash-a39-matcha",a37:"unsplash-a37-matcha",a31:"unsplash-a31-sake",a28:"unsplash-a28-indigo",a29:"unsplash-a29-ninja",
r53:"unsplash-r53-yakitori",r54:"unsplash-r54-tonkatsu",r55:"unsplash-r55-ramen",a48:"unsplash-a48-garden",a49:"unsplash-a49-market"
};

const STOCK_IMAGE_HOSTS=["images.unsplash.com","images.pexels.com","cdn.pixabay.com","upload.wikimedia.org"];
// Search/listing pages are never images. Reject them as <img src>.
// (Only CDN file hosts are allowed at all; this additionally rejects search/listing paths.)
const NON_IMAGE_URL=/\/s\/photos\/|\/search[\/?]|\/wiki\/(Category|Special:Search)|\/images\/search\//i;

function isSafeStockUrl(url){
 if(typeof url!=="string"||NON_IMAGE_URL.test(url))return false;
 try{const u=new URL(url);return u.protocol==="https:"&&STOCK_IMAGE_HOSTS.includes(u.hostname)}catch(_){return false}
}
function isDisplayableStock(item){
 return !!item&&item.sourceType==="stock"&&(item.isActualVenue===false||(item.isActualVenue===true&&typeof item.locationEvidence==="string"&&item.locationEvidence.length>=20))&&item.approvedForReuse===true&&((item.fileVerified===true&&item.contentVerified===true)||/^\d{4}-\d{2}-\d{2}$/.test(item.ownerApproved||""))&&isSafeStockUrl(item.imageUrl)&&/^https:\/\//.test(item.sourcePageUrl||"")&&/^https:\/\//.test(item.licenseUrl||"")&&!!item.license;
}
function isAiVisualQuarantined(id){return Object.prototype.hasOwnProperty.call(AI_VISUAL_QUARANTINE,id)}
function aiVisualFor(r){
 if(isAiVisualQuarantined(r.id))return null;
 return (typeof AI_VENUE_VISUALS!=="undefined"&&AI_VENUE_VISUALS[r.id])||null;
}
function stockImageFor(r){
 if(typeof LICENSED_VENUE_PHOTOS!=="undefined"&&LICENSED_VENUE_PHOTOS[r.id])return null; // an approved photo always wins
 const item=STOCK_IMAGE_LIBRARY[VENUE_STOCK_IMAGES[r.id]];
 return isDisplayableStock(item)?item:null;
}
// Manually added photos (assets/atelier-manual-photos.js): shown after an approved registry photo
// and before stock. Each record carries who supplied it and why it may be published.
function isPublishableManualPhoto(item,id){
 return !!item&&item.venueId===id&&["official","owner"].includes(item.sourceType)&&/^assets\/manual-photos\/[a-z]\d+\.webp$/.test(item.file||"")&&typeof item.credit==="string"&&item.credit.trim().length>=2&&typeof item.rightsBasis==="string"&&item.rightsBasis.trim().length>=10&&typeof item.isActualVenue==="boolean"&&/^\d{4}-\d{2}-\d{2}$/.test(item.addedOn||"");
}
function manualPhotoFor(r){
 if(typeof LICENSED_VENUE_PHOTOS!=="undefined"&&LICENSED_VENUE_PHOTOS[r.id])return null; // approved photo wins
 const item=typeof MANUAL_VENUE_PHOTOS!=="undefined"?MANUAL_VENUE_PHOTOS[r.id]:null;
 return isPublishableManualPhoto(item,r.id)?item:null;
}
function officialImageFor(r){
 const item=VENUE_OFFICIAL_IMAGES[r.id];
 return item&&item.sourceType==="official"&&item.approvedForReuse===true&&item.isActualVenue===true&&item.venueId===r.id&&/^https:\/\//.test(item.licenseUrl||"")?item:null;
}
// Normalised record in the venueImage shape for any venue (used by tests and audits).
function venueImageRecord(r){
 const base={venueId:r.id,imageUrl:"",sourcePageUrl:"",photographer:"",license:"",licenseUrl:"",approvedForReuse:false,isActualVenue:false,alt:r.name,lastVerified:""};
 const official=officialImageFor(r);
 if(official)return Object.assign(base,official,{sourceType:"official"});
 const licensed=typeof LICENSED_VENUE_PHOTOS!=="undefined"&&LICENSED_VENUE_PHOTOS[r.id];
 if(licensed){
  const exterior=typeof isBuildingExteriorPhoto==="function"?isBuildingExteriorPhoto(r.id):false;
  return Object.assign(base,{sourceType:"licensed",imageUrl:licensed.url,sourcePageUrl:licensed.source,photographer:licensed.credit,license:licensed.license,licenseUrl:licensed.licenseUrl,approvedForReuse:true,isActualVenue:!exterior});
 }
 const manual=manualPhotoFor(r);
 if(manual)return Object.assign(base,{sourceType:"manual",manualSource:manual.sourceType,imageUrl:manual.file,photographer:manual.credit,license:manual.rightsBasis,licenseUrl:manual.permissionUrl||"",approvedForReuse:true,isActualVenue:manual.isActualVenue,alt:manual.alt||r.name,lastVerified:manual.addedOn});
 const stock=stockImageFor(r);
 if(stock)return Object.assign(base,stock,{venueId:r.id,sourceType:"stock",isActualVenue:stock.isActualVenue===true});
 const ai=aiVisualFor(r);
 if(ai)return Object.assign(base,{sourceType:"ai",imageUrl:ai.url});
 return Object.assign(base,{sourceType:"svg"});
}
// Registration guard for tooling: returns a new store, never mutates or overwrites a working image.
function registerVenueImage(store,entry,venueIds){
 const errors=[];
 if(!entry||typeof entry.venueId!=="string")errors.push("venueId required");
 else if(venueIds&&!venueIds.includes(entry.venueId))errors.push("unknown venue "+entry.venueId);
 if(!["official","stock"].includes(entry?.sourceType))errors.push("sourceType must be official or stock");
 if(entry?.approvedForReuse!==true)errors.push("rights not confirmed (approvedForReuse)");
 if(entry?.sourceType==="stock"&&entry.isActualVenue!==false&&!(entry.isActualVenue===true&&(entry.locationEvidence||"").length>=20))errors.push("stock images are generic unless location evidence shows they depict this place");
 if(entry?.sourceType==="stock"&&!isSafeStockUrl(entry.imageUrl))errors.push("stock imageUrl must be a direct file on an allowed host, not a search page");
 if(entry?.sourceType==="official"&&entry.isActualVenue!==true)errors.push("official image must depict the actual venue");
 if(!/^https:\/\//.test(entry?.licenseUrl||""))errors.push("licenseUrl required");
 if(store&&entry&&store[entry.venueId])errors.push("venue already has an image; explicit review required to replace it");
 if(typeof LICENSED_VENUE_PHOTOS!=="undefined"&&entry&&LICENSED_VENUE_PHOTOS[entry.venueId])errors.push("venue has an approved registry photo; do not overwrite");
 if(errors.length)return {ok:false,errors,store};
 return {ok:true,errors,store:Object.assign({},store,{[entry.venueId]:Object.freeze(Object.assign({},entry))})};
}
const IMAGE_SOURCE_LABELS={
 stock:{en:"REFERENCE PHOTO · NOT THIS VENUE",ja:"参考写真 · 当店の写真ではありません",ko:"참고 사진 · 이 장소 사진 아님"},
 stockCredit:{en:"Generic reference photo",ja:"一般的な参考写真",ko:"일반 참고 사진"},
 stockActual:{en:"STOCK PHOTO OF THIS PLACE",ja:"この場所のストック写真",ko:"이 장소의 스톡 사진"},
 stockActualCredit:{en:"Stock photo of this place",ja:"この場所のストック写真",ko:"이 장소의 스톡 사진"},
 manualActual:{en:"VENUE PHOTO · ADDED BY STAFF",ja:"施設写真 · スタッフ追加",ko:"장소 사진 · 직접 추가"},
 manualOfficial:{en:"OFFICIAL VENUE PHOTO",ja:"施設提供の公式写真",ko:"공식 제공 사진"},
 manualReference:{en:"REFERENCE PHOTO · ADDED BY STAFF",ja:"参考写真 · スタッフ追加",ko:"참고 사진 · 직접 추가"},
 manualCredit:{en:"Photo",ja:"写真",ko:"사진"}
};
function imageSourceLabel(kind,item){
 if(kind==="manual")return item.isActualVenue?(item.sourceType==="official"?IMAGE_SOURCE_LABELS.manualOfficial:IMAGE_SOURCE_LABELS.manualActual):IMAGE_SOURCE_LABELS.manualReference;
 return item.isActualVenue?IMAGE_SOURCE_LABELS.stockActual:IMAGE_SOURCE_LABELS.stock;
}
