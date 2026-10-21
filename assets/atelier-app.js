"use strict";
function translate(preserveFilters=false){translateEditorial();const t=tr();$("language").value=lang;$("sort").options[0].textContent={en:"Curated order",ja:"おすすめ順",ko:"추천 순서"}[lang];$("sort").options[1].textContent={en:"Name A–Z",ja:"名前順",ko:"이름순"}[lang];$("sort").options[2].textContent={en:"Area A–Z",ja:"エリア順",ko:"지역순"}[lang];$("resetFilters").textContent={en:"Reset filters",ja:"条件をリセット",ko:"필터 초기화"}[lang];const buildingPhotoCount=Object.keys(LICENSED_VENUE_PHOTOS).filter(isBuildingExteriorPhoto).length;const venuePhotoCount=Object.keys(LICENSED_VENUE_PHOTOS).length-buildingPhotoCount;const photoSelectCopy={en:{labels:["All photo types","Photo cards ("+Object.keys(LICENSED_VENUE_PHOTOS).length+")","Other photo cards ("+venuePhotoCount+")","Host building exteriors ("+buildingPhotoCount+")","Source pages ("+Object.keys(VENUE_PHOTO_SOURCE_LINKS).length+")"],aria:"Filter places by available photo type"},ja:{labels:["写真の指定なし","写真あり ("+Object.keys(LICENSED_VENUE_PHOTOS).length+")","入居ビル外観以外の写真 ("+venuePhotoCount+")","入居ビルの外観 ("+buildingPhotoCount+")","写真・施設リンク ("+Object.keys(VENUE_PHOTO_SOURCE_LINKS).length+")"],aria:"施設の写真と入居ビル外観を分けて絞り込み"},ko:{labels:["사진 유형 전체","사진 있는 카드 ("+Object.keys(LICENSED_VENUE_PHOTOS).length+")","건물 외관 제외 사진 ("+venuePhotoCount+")","입점 건물 외관 ("+buildingPhotoCount+")","사진·시설 자료 링크 ("+Object.keys(VENUE_PHOTO_SOURCE_LINKS).length+")"],aria:"장소 자체 사진과 입점 건물 외관을 구분해 필터링"}}[lang];[...$("photoFilter").options].forEach((opt,i)=>{opt.textContent=photoSelectCopy.labels[i]});$("photoFilter").setAttribute("aria-label",photoSelectCopy.aria);$("share").textContent={en:"Copy guide link",ja:"ガイドリンクをコピー",ko:"가이드 링크 복사"}[lang];document.documentElement.lang=lang;$("subtitle").textContent=t.subtitle;$("query").placeholder=t.search;$("shortlistNote").textContent=t.note;$("hotelTitle").textContent=t.hotel;$("tabs").innerHTML=CATS.map((c,i)=>'<button type="button" class="tab '+(c===category?"active":"")+'" aria-pressed="'+(c===category?"true":"false")+'" data-cat="'+c+'">'+t.cats[i]+'</button>').join("");$("sectionTitle").textContent=t.cats[CATS.indexOf(category)];options(preserveFilters);render()}
let statusTimer;
function feedback(key){
 if(storageWriteFailed&&["added","removed","cleared"].includes(key))key="storageUnavailable";
 const msg={
 added:{en:"Added to guest shortlist",ja:"候補リストに追加しました",ko:"고객 추천 목록에 추가했습니다"},
 removed:{en:"Removed from guest shortlist",ja:"候補リストから削除しました",ko:"고객 추천 목록에서 제거했습니다"},
 cleared:{en:"Guest shortlist cleared",ja:"候補リストを消去しました",ko:"추천 목록을 초기화했습니다"},
 reset:{en:"Filters reset",ja:"検索条件をリセットしました",ko:"필터를 초기화했습니다"},
 empty:{en:"Add places before exporting a guide",ja:"書き出す前に施設を追加してください",ko:"내보내기 전에 장소를 추가하세요"},
 exported:{en:"Guest shortlist CSV prepared",ja:"CSVファイルを作成しました",ko:"추천 목록 CSV를 준비했습니다"},
  storageUnavailable:{en:"Private browser storage is blocked. Shortlist changes may disappear after closing this page; copy the guide link to keep them.",ja:"ブラウザーの保存機能が利用できません。閉じると候補が消える可能性があります。ガイドリンクをコピーしてください。",ko:"브라우저 저장소가 차단되어 있습니다. 페이지를 닫으면 추천 목록이 사라질 수 있으니 공유 링크를 복사해 보관하세요."}
 }[key];
 if(!msg)return;
 const el=$("interactionStatus");el.textContent=msg[lang]||msg.en;el.classList.add("visible");
 clearTimeout(statusTimer);statusTimer=setTimeout(()=>el.classList.remove("visible"),2800);
}

document.addEventListener("click",e=>{const photoButton=e.target.closest("[data-view-photo]");if(photoButton){openVenuePhoto(photoButton.dataset.viewPhoto);return}const feature=e.target.closest("[data-feature]");if(feature){e.preventDefault();category=feature.dataset.feature;$("query").value="";translate();$("catalogPanel").scrollIntoView({behavior:"smooth",block:"start"});return}const detail=e.target.closest("[data-detail]");if(detail){openDetail(detail.dataset.detail);return}const b=e.target.closest("[data-id]");if(b){const id=b.dataset.id;const removing=selected.has(id);removing?selected.delete(id):selected.add(id);save();render();feedback(removing?"removed":"added");if($("detailDialog").open){const d=$("detailDialog");const item=DATA.find(r=>r.id===id);if(item){const a=d.querySelector("[data-id]");if(a)a.textContent=selected.has(id)?tr().remove:tr().add}}}const district=e.target.closest("[data-area]");if(district){const target=district.dataset.area;const match=DATA.find(r=>r.area===target);if(match){category=match.category;$("query").value="";translate();$("area").value=target;render()}else{category="attraction";$("query").value=target;translate()}$("catalogPanel").scrollIntoView({behavior:"smooth",block:"start"});return}const tab=e.target.closest("[data-cat]");if(tab){category=tab.dataset.cat;$("query").value="";translate();$("catalogPanel").scrollIntoView({behavior:"smooth",block:"start"});return}});
$("photoClose").onclick=()=>$("photoDialog").close();
window.addEventListener("storage",event=>{
 // A real localStorage.clear() broadcasts key=null, unlike removeItem(key).
 // Ignore clear notifications from other storage areas (e.g. sessionStorage).
 let localClear=false;
 try{localClear=event.key===null&&event.storageArea===localStorage}catch(e){}
 if(event.key==="atelier-shortlist-v2"||localClear){
  const incoming=localClear?new Set():parseSavedShortlist(event.newValue);
  // Repeated cross-tab writes of the same venue IDs are not selection changes.
  // Preserve a still-valid Safari manual CSV link in this no-op case.
  if(incoming.size===selected.size&&[...incoming].every(id=>selected.has(id)))return;
  invalidateCsvDownload();
  selected=incoming;
  render();
  const dialog=$("detailDialog");
  if(dialog.open){const button=dialog.querySelector("[data-id]");if(button)button.textContent=selected.has(button.dataset.id)?tr().remove:tr().add}
  $("share").textContent={en:"Copy guide link",ja:"ガイドリンクをコピー",ko:"가이드 링크 복사"}[lang];
 }
});
window.addEventListener("hashchange",()=>{if(importShortlistHash())render()});
$("share").onclick=async()=>{const url=shortlistUrl();try{await navigator.clipboard.writeText(url);$("share").textContent={en:"Link copied",ja:"コピーしました",ko:"링크 복사 완료"}[lang]}catch(e){window.prompt("Copy guest guide URL",url)}};$("shortlistJump").onclick=()=>document.getElementById("guide").scrollIntoView({behavior:"smooth",block:"start"});$("detailClose").onclick=()=>{const d=$("detailDialog");if(typeof d.close==="function")d.close();else d.removeAttribute("open")};$("language").addEventListener("change",e=>{const nextLang=e.target.value;if(!["en","ja","ko"].includes(nextLang)||nextLang===lang)return;invalidateCsvDownload();lang=nextLang;try{localStorage.setItem("tokyo_atelier_lang",lang)}catch(err){}translate(true);if($("detailDialog").open){const current=$("detailActions").querySelector("[data-id]");if(current)openDetail(current.dataset.id)}});let searchRenderTimer; $("query").addEventListener("input",()=>{clearTimeout(searchRenderTimer);searchRenderTimer=setTimeout(render,120)});["area","type","sort","photoFilter"].forEach(id=>$(id).addEventListener("input",render));$("photoQuickbar").addEventListener("click",e=>{const button=e.target.closest("button[data-photo-quick]");if(!button)return;$("photoFilter").value=button.dataset.photoQuick;render()});$("resetFilters").onclick=()=>{$("query").value="";$("area").value="";$("type").value="";$("sort").value="default";$("photoFilter").value="all";render();feedback("reset")};$("print").onclick=()=>window.print();$("clear").onclick=()=>{selected.clear();save();render();feedback("cleared")};// The document owns generated object URLs until export replacement or unload.
try{const preferred=localStorage.getItem("tokyo_atelier_lang");if(["en","ja","ko"].includes(preferred))lang=preferred}catch(err){}importShortlistHash();


if(mobileConciergeMedia.addEventListener)mobileConciergeMedia.addEventListener('change',prioritizeConciergeOnMobile);
else if(mobileConciergeMedia.addListener)mobileConciergeMedia.addListener(prioritizeConciergeOnMobile);
window.addEventListener('resize',prioritizeConciergeOnMobile,{passive:true});
prioritizeConciergeOnMobile();
const imageObserver=new MutationObserver(()=>verifyEditorialPhotos());
imageObserver.observe(document.getElementById("cards"),{childList:true});
verifyEditorialPhotos();
translate();

if("serviceWorker" in navigator){navigator.serviceWorker.getRegistrations().then(regs=>regs.forEach(r=>r.unregister())).catch(()=>{})}