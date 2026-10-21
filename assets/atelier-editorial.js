"use strict";
/* Localize the main editorial copy as well as catalogue controls. */
const LANDING_COPY={
 en:{language:"Language",kicker:"TOKYO CITY GUIDE · CONCIERGE DESK",cta:"FIND PLACES ↓",leadEyebrow:"DISCOVER TOKYO",leadTitle:"Tokyo, at your fingertips.",leadNote:"Choose a category or search 131 places to build a guest guide.",tiles:[["Dining","Restaurants & more"],["Sights","Culture & views"],["Shopping","Style & gifts"]],sourceTitle:"Research guide · Check before recommending",sourceFlag:"NEEDS CONFIRMATION",sourceBody:"Hours, availability and prices must be verified with official sources.",fallbackText:"If the file does not download automatically:",fallbackAction:"Open CSV file ↓",footer:"Tokyo Concierge Atelier · The Westin Tokyo concierge research · Site updated 2026-10-20"},
 ja:{language:"言語",kicker:"東京シティガイド · コンシェルジュ",cta:"施設を探す ↓",leadEyebrow:"東京を探す",leadTitle:"東京を、もっと身近に。",leadNote:"カテゴリーまたは131件の施設検索から、お客様向けのガイドを作成できます。",tiles:[["グルメ","レストラン・美食"],["観光","文化・眺望"],["買い物","ファッション・お土産"]],sourceTitle:"調査用ガイド · ご案内前に要確認",sourceFlag:"公式確認が必要",sourceBody:"営業時間・空席・料金は必ず公式情報でご確認ください。",fallbackText:"自動で保存されない場合：",fallbackAction:"CSVファイルを開く ↓",footer:"Tokyo Concierge Atelier · ウェスティンホテル東京 コンシェルジュ調査 · 更新 2026-10-20"},
 ko:{language:"언어",kicker:"도쿄 시티 가이드 · 컨시어지",cta:"장소 검색 ↓",leadEyebrow:"도쿄 둘러보기",leadTitle:"도쿄를 더 가깝게.",leadNote:"카테고리나 131개 장소 검색으로 고객 추천 안내를 만들어 보세요.",tiles:[["미식","레스토랑·맛집"],["명소","문화·전망"],["쇼핑","패션·기념품"]],sourceTitle:"조사용 가이드 · 추천 전 확인",sourceFlag:"공식 확인 필요",sourceBody:"영업시간·예약 가능 여부·요금은 공식 출처에서 확인하세요.",fallbackText:"자동 다운로드가 시작되지 않으면:",fallbackAction:"CSV 파일 열기 ↓",footer:"Tokyo Concierge Atelier · 웨스틴 도쿄 컨시어지 조사 · 사이트 갱신 2026-10-20"}
};
function translateLanding(){
 const x=LANDING_COPY[lang]||LANDING_COPY.en;
 const put=(selector,value)=>{const el=document.querySelector(selector);if(el)el.textContent=value;};
 put('header .toolbar label[for="language"]',x.language);
 put('header .hero-kicker',x.kicker);
 put('header .hero-cta',x.cta);
 put('.magazine-lead .section-eyebrow',x.leadEyebrow);
 put('.magazine-lead strong',x.leadTitle);
 put('.magazine-lead p',x.leadNote);
 document.querySelectorAll('.magazine-tile').forEach((el,i)=>{const tile=x.tiles[i];if(!tile)return;const heading=el.querySelector('b'),note=el.querySelector('small');if(heading)heading.textContent=tile[0];if(note)note.textContent=tile[1];el.setAttribute('aria-label',tile.join(' · '));});
 put('.source-explainer>strong',x.sourceTitle);
 put('.source-explainer .status-key .pill',x.sourceFlag);
 put('.source-explainer .status-key span:last-child',x.sourceBody);
 put('#csvFallbackText',x.fallbackText);
 put('#csvDirectDownload',x.fallbackAction);
 const footer=document.querySelector('.footer');if(footer&&footer.firstChild&&footer.firstChild.nodeType===Node.TEXT_NODE)footer.firstChild.textContent=x.footer;
}
// Put the working catalogue ahead of inspirational stories on narrow screens;
// preserve desktop editorial order and accessible DOM/keyboard reading order.
const mobileConciergeMedia=window.matchMedia('(max-width:720px)');
function prioritizeConciergeOnMobile(){
 const main=document.querySelector('main'),intro=document.querySelector('.magazine-intro'),end=document.querySelector('.atelier-note');
 if(!main||!intro||!end)return;
 if(mobileConciergeMedia.matches&&main.previousElementSibling!==intro)intro.insertAdjacentElement('afterend',main);
 else if(!mobileConciergeMedia.matches&&main.previousElementSibling!==end)end.insertAdjacentElement('afterend',main);
}
const VISUAL_COPY={
 en:{gallery:"Tokyo, vividly.",galleryNote:"From glowing skylines to quiet shrines — discover a city of contrasts.",areas:"Tokyo, one district at a time.",story:"Curated inspiration for exploring Tokyo — from intimate dining to memorable city views.",storyLink:"DISCOVER PLACES"},
 ja:{gallery:"色彩豊かな東京へ。",galleryNote:"きらめく街並みから静かな神社まで。東京の多彩な魅力を見つけましょう。",areas:"街ごとに出会う、東京。",story:"心に残るお食事から東京の眺望まで、旅のヒントを厳選してご紹介します。",storyLink:"スポットを探す"},
 ko:{gallery:"다채로운 도쿄를 만나다.",galleryNote:"화려한 야경부터 고요한 신사까지, 도쿄의 다양한 매력을 발견해 보세요.",areas:"지역마다 새로운 도쿄.",story:"특별한 미식부터 기억에 남을 도심 전망까지, 도쿄 여행의 영감을 모았습니다.",storyLink:"장소 둘러보기"}
};
/* The editorial photographs contain no generated captions; all overlaid text is DOM and can be localized. */
const IMAGE_LABELS={
en:{gallery:[["01 / CITY LIGHTS","The Tokyo skyline","ICONIC VIEWS ↗"],["02 / HERITAGE","Timeless Japan","EXPLORE CULTURE ↗"],["03 / TASTE","Tokyo dining","EXPLORE RESTAURANTS ↗"],["04 / STYLE","Tokyo shopping","EXPLORE SHOPPING ↗"],["05 / RESET","Slow moments","EXPLORE WELLNESS ↗"]],district:[["01 · LOCAL","Ebisu","Westin neighborhood ↗"],["02 · STYLE","Ginza","Dining & luxury ↗"],["03 · HERITAGE","Asakusa","Old Tokyo ↗"],["04 · CULTURE","Shibuya","Views & culture ↗"]],story:["THE ART OF DINING","THE CITY AFTER DARK"],storyTitle:["Beyond the","ordinary."],note:["Every corner has a story.","CONCIERGE RESEARCH · DETAILS REQUIRE OFFICIAL CONFIRMATION"]},
ja:{gallery:[["01 / 夜景","東京のスカイライン","絶景を探す ↗"],["02 / 伝統","受け継がれる日本","文化を楽しむ ↗"],["03 / 美食","東京のグルメ","レストランを探す ↗"],["04 / 装い","東京でショッピング","ショップを探す ↗"],["05 / 癒やし","くつろぎのひととき","ウェルネスを探す ↗"]],district:[["01 · 地元","恵比寿","ホテル周辺を歩く ↗"],["02 · 洗練","銀座","美食とラグジュアリー ↗"],["03 · 歴史","浅草","江戸の面影 ↗"],["04 · 文化","渋谷","眺望とカルチャー ↗"]],story:["美食の楽しみ","夜の街並み"],storyTitle:["いつもと違う","東京へ。"],note:["街角ごとに、物語がある。","コンシェルジュ調査 · 詳細は公式情報で要確認"]},
ko:{gallery:[["01 / 야경","도쿄의 스카이라인","전망 명소 둘러보기 ↗"],["02 / 전통","시간을 간직한 일본","문화 명소 둘러보기 ↗"],["03 / 미식","도쿄 미식 여행","레스토랑 둘러보기 ↗"],["04 / 스타일","도쿄 쇼핑","쇼핑 명소 둘러보기 ↗"],["05 / 휴식","여유로운 순간","웰니스 둘러보기 ↗"]],district:[["01 · 로컬","에비스","웨스틴 주변 산책 ↗"],["02 · 스타일","긴자","미식과 럭셔리 ↗"],["03 · 전통","아사쿠사","옛 도쿄의 정취 ↗"],["04 · 문화","시부야","전망과 문화 ↗"]],story:["미식의 예술","밤의 도쿄"],storyTitle:["일상을 넘어","새로운 도쿄."],note:["도쿄의 모든 골목에는 이야기가 있습니다.","컨시어지 조사 · 상세 정보는 공식 확인 필요"]}
};
function translateImageLabels(){
const c=IMAGE_LABELS[lang]||IMAGE_LABELS.en;
const imageNotices={en:["Editorial photography is illustrative and may not depict the exact venue. Venue information requires official confirmation.","Editorial images illustrate the atmosphere of Tokyo; they are not verified photos of each district."],ja:["掲載写真はイメージです。実際の施設と異なる場合があります。施設情報は公式情報でご確認ください。","写真は東京の雰囲気を紹介するイメージです。各エリアの実際の写真とは限りません。"],ko:["사진은 분위기 전달을 위한 참고 이미지로 실제 장소와 다를 수 있습니다. 장소 정보는 공식 채널에서 확인하세요.","사진은 도쿄의 분위기를 보여주는 참고 이미지이며 각 지역의 실제 사진으로 검증된 것은 아닙니다."]}[lang];
const notices=document.querySelectorAll(".photo-disclaimer,.area-photo-note");notices.forEach((node,i)=>{if(imageNotices[i])node.textContent=imageNotices[i]});
document.querySelectorAll(".cinematic-photo").forEach((el,i)=>{const v=c.gallery[i];if(!v)return;[".photo-number","strong","small"].forEach((sel,j)=>{const node=el.querySelector(sel);if(node)node.textContent=v[j]})});
document.querySelectorAll(".district").forEach((el,i)=>{const v=c.district[i];if(!v)return;[".district-index","strong","small"].forEach((sel,j)=>{const node=el.querySelector(sel);if(node)node.textContent=v[j]})});
document.querySelectorAll(".story-image").forEach((el,i)=>{const label=el.querySelector("span");if(label)label.textContent=c.story[i]||""});
const h=document.querySelector(".story-copy h2");if(h)h.innerHTML=esc(c.storyTitle[0])+'<br><em>'+esc(c.storyTitle[1])+'</em>';
const note=document.querySelector(".atelier-note-inner");if(note){const title=note.querySelector("strong"),desc=note.querySelector("span");if(title)title.textContent=c.note[0];if(desc)desc.textContent=c.note[1]}
}
const CHROME_COPY={"en":["Share a selection of public places by link. No guest name, reservation details or payment information is included.","Research catalogue, not a booking system. Hours, availability, pricing, age policies, cancellations, accessibility and seasonal dates must be checked with official sources. Map links are searches, not verified directions. Do not enter guest personal or payment data.","Guest shortlist","Explore","Print guide","Export CSV","Clear"],"ja":["公開施設の候補をリンクで共有できます。お客様のお名前、予約情報、決済情報は含まれません。","本サイトは調査用カタログであり、予約システムではありません。営業時間、空席、料金、年齢制限、キャンセル規定、バリアフリー情報、季節イベントの日程は公式情報をご確認ください。地図リンクは検索結果であり、経路を保証するものではありません。個人情報や決済情報は入力しないでください。","候補リスト","スポットを探す","ガイドを印刷","CSV出力","クリア"],"ko":["공개된 장소 목록을 링크로 공유합니다. 고객 성함, 예약 내역 또는 결제 정보는 포함되지 않습니다.","본 사이트는 예약 시스템이 아닌 조사용 목록입니다. 영업시간, 예약 가능 여부, 요금, 연령 제한, 취소 규정, 접근성 및 계절 행사 일정은 공식 출처로 확인해야 합니다. 지도 링크는 검색 결과이며 검증된 경로가 아닙니다. 고객 개인정보나 결제 정보를 입력하지 마세요.","추천 목록","장소 둘러보기","가이드 인쇄","CSV 내보내기","비우기"]};
function translateChrome(){const c=CHROME_COPY[lang]||CHROME_COPY.en;const set=(selector,v)=>{const el=document.querySelector(selector);if(el)el.textContent=v};set(".shortlist-help",c[0]);set("#disclaimer",c[1]);set(".site-footer-links a:first-child",c[3]);set(".site-footer-links a:nth-child(2)",c[2]);set("#print",c[4]);set("#download",c[5]);set("#clear",c[6]);const jump=document.getElementById("shortlistJump"),badge=document.getElementById("shortlistBadge");if(jump&&badge){jump.textContent="✦ "+c[2]+" ";jump.appendChild(badge)}}
function translateEditorial(){
 translateLanding();
 translateImageLabels();
 translateChrome();
 const c=VISUAL_COPY[lang]||VISUAL_COPY.en;
 const set=(selector,value)=>{const el=document.querySelector(selector);if(el)el.textContent=value};
 set(".cinematic-heading h2",c.gallery);
 set(".cinematic-heading p",c.galleryNote);
 set(".area-explore h2",c.areas);
 set(".story-copy p",c.story);
 const link=document.querySelector(".story-link");
 if(link)link.innerHTML=c.storyLink+' <span aria-hidden="true">↗</span>';
}

/* Validate editorial image loads and fall back gracefully when remote images fail. */
const photoFailures=new Set();
function verifyEditorialPhotos(){
 const targets=[...document.querySelectorAll(".cinematic-photo,.district,.story-image,.card-photo"),document.querySelector("header")].filter(Boolean);
 targets.forEach(el=>{
  if(el.dataset.photoChecked==="1")return;
  const css=getComputedStyle(el).backgroundImage;
  const match=css.match(/https:\/\/images\.unsplash\.com\/[^"')\s]+/);
  if(!match)return;
  el.dataset.photoChecked="1";
  const img=new Image();
  img.onload=()=>{el.classList.remove("photo-failed")};
  img.onerror=()=>{el.classList.add("photo-failed");photoFailures.add(match[0].split("?")[0]);};
  img.src=match[0];
 });
}
