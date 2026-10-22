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

const VENUE_IMAGE_POLICY_VERSION="20261022-image-policy";

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
s15:{issues:["baked-text","wrong-area","wrong-venue-name","badge"],note:"Baked 'Ueno Park' title, 'Taito' pin and badge; Ryogoku Takahashi is in Ryogoku (Sumida)"}
};

// 1. Official images: only file-specific, written reuse grants. None documented as of 2026-10-22;
// prior outreach (audits/photo-permission-*) recorded NO_EXPLICIT_LICENSE_OR_PERMISSION for every
// pending venue. Official galleries stay reachable through VENUE_PHOTO_SOURCE_LINKS instead.
const VENUE_OFFICIAL_IMAGES={};

// 3. Free stock library. One record per individual image, in the venueImage shape.
//  approvedForReuse — the image's own license page was read and allows free commercial use.
//  fileVerified     — the exact imageUrl was fetched and decoded as an image (naturalWidth > 0).
//  contentVerified  — a person looked at the image: no watermark, logo, signage, map pin,
//                     venue/area name or identifiable third-party business.
// All three must be true before the image can appear on any card.
const STOCK_IMAGE_LIBRARY={
"unsplash-sushi-Jm5uc0Z-5MQ":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1763943431214-275e64002f90?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/tuna-sushi-with-ginger-and-wasabi-on-wooden-plate-Jm5uc0Z-5MQ",photographer:"HANVIN CHEONG",photographerUrl:"https://unsplash.com/@hktram0311",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"sushi",alt:"Tuna nigiri sushi with ginger and wasabi (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-tempura-paMbZ0iNka8":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1535924571710-4c6e27716b6d?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/tempura-set-paMbZ0iNka8",photographer:"Markus Winkler",photographerUrl:"https://unsplash.com/@markuswinkler",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"tempura",alt:"Tempura set (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-pizza-zyvkmq1yJBs":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1754799565084-b381bd0b4db7?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/pizza-being-removed-from-a-wood-fired-oven-zyvkmq1yJBs",photographer:"Ari Kurniawan",photographerUrl:"https://unsplash.com/@arikurniawan",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"pizza",alt:"Pizza taken from a wood-fired oven (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-yakiniku-oiS-Tjtemvs":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1759150595639-d128196ab6b3?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/meat-sizzling-on-a-hot-grill-with-steam-rising-oiS-Tjtemvs",photographer:"Stanley Kustamin",photographerUrl:"https://unsplash.com/@kyelnats",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"yakiniku",alt:"Meat on a hot grill (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,isActualVenue:false,lastVerified:"2026-10-22"},
"unsplash-pasta-yfs1UJziyoM":{sourceType:"stock",provider:"Unsplash",imageUrl:"https://images.unsplash.com/photo-1583331030528-5ae1c7fb81ee?w=640&q=70&fm=jpg&fit=crop",sourcePageUrl:"https://unsplash.com/photos/yfs1UJziyoM",photographer:"engin akyurt",photographerUrl:"https://unsplash.com/@enginakyurt",license:"Unsplash License",licenseUrl:"https://unsplash.com/license",subject:"italian",alt:"Pasta dish on a white plate (generic reference photo)",approvedForReuse:true,fileVerified:false,contentVerified:false,isActualVenue:false,lastVerified:"2026-10-22"}
};

// Venue → generic stock subject. Only venues whose AI tile is quarantined and that have no
// approved photo. Genre-level references only; never a photo of another named restaurant.
const VENUE_STOCK_IMAGES={
r01:"unsplash-sushi-Jm5uc0Z-5MQ",r02:"unsplash-sushi-Jm5uc0Z-5MQ",r39:"unsplash-sushi-Jm5uc0Z-5MQ",
r40:"unsplash-sushi-Jm5uc0Z-5MQ",r43:"unsplash-sushi-Jm5uc0Z-5MQ",
r03:"unsplash-tempura-paMbZ0iNka8",
r06:"unsplash-pizza-zyvkmq1yJBs",r08:"unsplash-pizza-zyvkmq1yJBs",
r09:"unsplash-pasta-yfs1UJziyoM",
r11:"unsplash-yakiniku-oiS-Tjtemvs"
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
 return !!item&&item.sourceType==="stock"&&item.isActualVenue===false&&item.approvedForReuse===true&&item.fileVerified===true&&item.contentVerified===true&&isSafeStockUrl(item.imageUrl)&&/^https:\/\//.test(item.sourcePageUrl||"")&&/^https:\/\//.test(item.licenseUrl||"")&&!!item.license;
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
 const stock=stockImageFor(r);
 if(stock)return Object.assign(base,stock,{venueId:r.id,sourceType:"stock",isActualVenue:false});
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
 if(entry?.sourceType==="stock"&&entry.isActualVenue!==false)errors.push("stock images can never be labelled as the actual venue");
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
 stockCredit:{en:"Generic reference photo",ja:"一般的な参考写真",ko:"일반 참고 사진"}
};
