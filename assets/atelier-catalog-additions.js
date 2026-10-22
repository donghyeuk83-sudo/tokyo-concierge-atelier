// Tokyo Concierge Atelier — venue additions (2026-10-22, owner request).
"use strict";
// Classic script loaded after atelier-guidance.js and before atelier-state.js, so shortlist
// hydration, search, filters, CSV and share links all see the added venues. The original
// 131-record catalogue (atelier-catalog.js) stays byte-identical and hash-pinned; additions
// live only here and are validated by tests/venue-additions.cjs.
// Row format is identical to atelier-catalog.js: [id, category, name, ja, area, type, url].
const VENUE_ADDITIONS=[
["r53","restaurant","Ebisu Yokocho","恵比寿横丁","Ebisu","Izakaya alley","https://www.gotokyo.org/en/spot/451/index.html"],
["r54","restaurant","Nishiazabu Butagumi","西麻布 豚組","Nishi-Azabu","Tonkatsu","https://tabelog.com/en/tokyo/A1307/A130701/13004791/"],
["r55","restaurant","ICHIRAN Shibuya","一蘭 渋谷店","Shibuya","Ramen","https://en.ichiran.com/shop/tokyo/shibuya/"],
["a48","attraction","Shinjuku Gyoen National Garden","新宿御苑","Shinjuku","Garden","https://policies.env.go.jp/national-garden/shinjukugyoen/english/"],
["a49","attraction","Tsukiji Outer Market","築地場外市場","Tsukiji","Food market","https://www.tsukiji.or.jp/english/"],
["a50","attraction","Toyosu Market","豊洲市場","Toyosu","Wholesale market","https://www.gotokyo.org/en/spot/1743/index.html"],
["s19","shopping","MEGA Don Quijote Shibuya Honten","MEGAドン・キホーテ渋谷本店","Shibuya","Discount store","https://www.donki.com/en/store/shop_detail.php?shop_id=442"],
["s20","shopping","LOG ROAD DAIKANYAMA","ログロード代官山","Daikanyama","Shopping street","https://www.gotokyo.org/jp/spot/289/index.html"],
["w08","wellness","Tokyo Toyosu Manyo Club","東京豊洲 万葉倶楽部","Toyosu","Hot spring","https://www.toyosu-senkyakubanrai.jp/languages/en/"],
["t09","transport","Airport Limousine Bus · The Westin Tokyo stop","リムジンバス ウェスティンホテル東京","Ebisu","Airport bus (Narita)","https://www.limousinebus.co.jp/ja/busstop/detail/TheWestinTokyo/"]
].map(([id,category,name,ja,area,type,url])=>({id,category,name,ja,area,type,url,status:"NEEDS_CONFIRMATION"}));

// Sources checked 2026-10-22. Same shape as VERIFIED_SOURCES in atelier-sources.js.
const VENUE_ADDITION_SOURCES={
r53:{url:"https://www.gotokyo.org/en/spot/451/index.html",checked:"2026-10-22",en:"GO TOKYO (official Tokyo tourism site, updated 2025-10-31): Ebisu Yokocho, Ebisu 1-7-4, about 2 min from JR Ebisu East Exit. Hours are set by each stall and are not listed; seating is shared and busy in the evening.",ja:"GO TOKYO（東京の観光公式サイト、2025-10-31更新）：恵比寿横丁、恵比寿1-7-4、JR恵比寿駅東口徒歩2分。営業時間は各店舗ごとで未掲載。夜は混雑し相席が一般的。",ko:"GO TOKYO(도쿄도 공식 관광 사이트, 2025-10-31 갱신): 에비스 요코초, 에비스 1-7-4, JR 에비스역 동쪽 출구 도보 2분. 영업시간은 가게마다 달라 미게재. 저녁에는 붐비고 합석이 일반적."},
r54:{url:"https://tabelog.com/en/tokyo/A1307/A130701/13004791/",checked:"2026-10-22",en:"Tabelog listing (not the official site): Nishiazabu Butagumi, Nishi-Azabu 2-24-9, about 8 min from Nogizaka Exit 5. Listed Tue–Sun 11:30–14:00 and 18:00–20:30, closed Monday; phone line listed as closed, online reservation. Reconfirm on the restaurant's own site.",ja:"食べログ掲載（公式サイトではありません）：西麻布 豚組、西麻布2-24-9、乃木坂駅5番出口徒歩約8分。掲載上は火〜日11:30〜14:00・18:00〜20:30、月曜定休。電話受付停止中でネット予約。店舗公式で要再確認。",ko:"타베로그 등록 정보(공식 사이트 아님): 니시아자부 부타구미, 니시아자부 2-24-9, 노기자카역 5번 출구 도보 약 8분. 등록상 화~일 11:30~14:00·18:00~20:30, 월요일 휴무. 전화 접수 중단, 온라인 예약. 가게 공식 채널에서 재확인 필요."},
r55:{url:"https://en.ichiran.com/shop/tokyo/shibuya/",checked:"2026-10-22",en:"Official ICHIRAN store page: Jinnan 1-22-7 B1F, about 3 min from JR Shibuya Hachiko Exit; 21 counter seats; listed as open 24 hours but the store warns hours, capacity or opening can change suddenly with staffing. Ticket machine takes cards, IC cards and QR pay.",ja:"一蘭公式店舗ページ：神南1-22-7 B1F、JR渋谷駅ハチ公口徒歩約3分。カウンター21席。24時間営業と掲載されているが、人員状況により営業時間・席数・営業自体が急に変わる場合があると明記。券売機はカード・交通系IC・QR決済対応。",ko:"이치란 공식 매장 페이지: 진난 1-22-7 B1F, JR 시부야역 하치코 출구 도보 약 3분. 카운터 21석. 24시간 영업으로 게재되어 있으나 인력 상황에 따라 영업시간·좌석·영업 여부가 갑자기 바뀔 수 있다고 명시. 식권 발매기는 카드·교통 IC·QR 결제 가능."},
a48:{url:"https://policies.env.go.jp/national-garden/shinjukugyoen/english/",checked:"2026-10-22",en:"Official Ministry of the Environment site: Shinjuku Gyoen National Garden, Naito-machi 11. Closed Mondays (next weekday if Monday is a holiday) and over New Year. Hours, fees, gates and alcohol rules are on the official Admission and Garden Rules pages; check before sending guests.",ja:"環境省公式：新宿御苑、新宿区内藤町11。月曜休園（祝日の場合は翌平日）、年末年始休園。開園時間・入園料・門・酒類持込の規則は公式の入園案内と利用ガイドで要確認。",ko:"환경성 공식: 신주쿠교엔, 신주쿠구 나이토마치 11. 월요일 휴원(공휴일이면 다음 평일), 연말연시 휴원. 개원 시간·입장료·출입문·주류 반입 규칙은 공식 입장 안내와 이용 가이드에서 확인 필요."},
a49:{url:"https://www.tsukiji.or.jp/english/",checked:"2026-10-22",en:"GO TOKYO (updated 2026-08-20) links the official Tsukiji Outer Market site: Tsukiji 4-16-2, 1 min from Tsukijishijo (Oedo A1) or Tsukiji (Hibiya). Liveliest 9:00–13:00; most shops close before evening. Many shops close Wednesdays, Sundays and holidays.",ja:"GO TOKYO（2026-08-20更新）掲載の築地場外市場公式サイト：築地4-16-2、築地市場駅A1・築地駅から徒歩1分。賑わうのは9時〜13時、多くの店は夕方前に閉店。水・日・祝休みの店が多い。",ko:"GO TOKYO(2026-08-20 갱신)에 연결된 쓰키지 장외시장 공식 사이트: 쓰키지 4-16-2, 쓰키지시조역 A1·쓰키지역 도보 1분. 9~13시가 가장 활기차고 대부분 저녁 전 폐점. 수·일·공휴일 휴무 가게가 많음."},
a50:{url:"https://www.gotokyo.org/en/spot/1743/index.html",checked:"2026-10-22",en:"GO TOKYO (updated 2025-12-25): Toyosu Market, Toyosu 6-6-1, 3 min from Shijo-mae (Yurikamome). Free; about 5:00–17:00, varies by building. Closed Wednesdays, Sundays, holidays and irregular days. Tuna-auction corridor is open; the closer observation deck needs an advance reservation.",ja:"GO TOKYO（2025-12-25更新）：豊洲市場、豊洲6-6-1、ゆりかもめ市場前駅徒歩3分。入場無料、概ね5:00〜17:00（施設により異なる）。水・日・祝・不定休。マグロせりの見学通路は公開、間近で見る見学デッキは事前予約制。",ko:"GO TOKYO(2025-12-25 갱신): 도요스 시장, 도요스 6-6-1, 유리카모메 시조마에역 도보 3분. 무료, 대략 5:00~17:00(건물마다 다름). 수·일·공휴일·부정기 휴무. 참치 경매 견학 통로는 공개, 가까이서 보는 견학 데크는 사전 예약제."},
s19:{url:"https://www.donki.com/en/store/shop_detail.php?shop_id=442",checked:"2026-10-22",en:"GO TOKYO (updated 2026-03-31) links the official Don Quijote store page: Udagawacho 28-6, about 5 min from Shibuya Station. Open 24 hours daily (hours may change); tax-free shopping available.",ja:"GO TOKYO（2026-03-31更新）掲載のドン・キホーテ公式店舗ページ：宇田川町28-6、渋谷駅徒歩約5分。24時間・年中無休（変更の場合あり）。免税対応。",ko:"GO TOKYO(2026-03-31 갱신)에 연결된 돈키호테 공식 매장 페이지: 우다가와초 28-6, 시부야역 도보 약 5분. 24시간·연중무휴(변경 가능). 면세 가능."},
s20:{url:"https://www.gotokyo.org/jp/spot/289/index.html",checked:"2026-10-22",en:"GO TOKYO (updated 2025-12-25): LOG ROAD DAIKANYAMA, Daikanyama-cho 13-1, about 4 min from Daikanyama Station (Tokyu Toyoko Line). Shop hours are not listed; check each shop.",ja:"GO TOKYO（2025-12-25更新）：ログロード代官山、代官山町13-1、東急東横線代官山駅徒歩約4分。営業時間は未掲載のため各店舗で要確認。",ko:"GO TOKYO(2025-12-25 갱신): 로그로드 다이칸야마, 다이칸야마초 13-1, 도큐 도요코선 다이칸야마역 도보 약 4분. 영업시간 미게재, 각 매장 확인 필요."},
w08:{url:"https://www.toyosu-senkyakubanrai.jp/languages/en/",checked:"2026-10-22",en:"GO TOKYO (updated 2026-04-08) links the official Toyosu Senkyaku Banrai site: Toyosu 6-5-1, 4 min from Shijo-mae (Yurikamome). Tokyo Toyosu Manyo Club is its paid hot-spring facility using water brought from Hakone and Yugawara, listed as open 24 hours. Check prices and tattoo policy.",ja:"GO TOKYO（2026-04-08更新）掲載の豊洲 千客万来公式サイト：豊洲6-5-1、ゆりかもめ市場前駅徒歩4分。館内の東京豊洲 万葉倶楽部は箱根・湯河原の湯を運ぶ有料温泉施設で24時間営業と掲載。料金とタトゥー規則は要確認。",ko:"GO TOKYO(2026-04-08 갱신)에 연결된 도요스 센캬쿠반라이 공식 사이트: 도요스 6-5-1, 유리카모메 시조마에역 도보 4분. 내부의 도쿄 도요스 만요클럽은 하코네·유가와라 온천수를 운반해 쓰는 유료 온천 시설로 24시간 영업으로 게재. 요금·문신 규정 확인 필요."},
t09:{url:"https://www.limousinebus.co.jp/ja/busstop/detail/TheWestinTokyo/",checked:"2026-10-22",en:"Official Airport Transport Service (Limousine Bus) stop page for The Westin Tokyo: this stop is served only by the Ebisu/Shinagawa ⇔ Narita Airport route; no Haneda route is listed. Book and check times on the official timetable.",ja:"東京空港交通（リムジンバス）公式のウェスティンホテル東京停留所ページ：恵比寿・品川エリア⇔成田空港路線のみ発着、羽田空港路線の掲載なし。時刻と予約は公式時刻表で確認。",ko:"도쿄공항교통(리무진 버스) 공식 웨스틴 호텔 도쿄 정류장 페이지: 에비스·시나가와 지역⇔나리타 공항 노선만 정차, 하네다 노선은 게재되지 않음. 시간과 예약은 공식 시간표에서 확인."}
};
// Third-party listing, not the venue's own site: shown as "reference only".
const VENUE_ADDITION_SOURCE_SCOPE={r54:"THIRD_PARTY_VENUE_LISTING_NOT_OFFICIAL_SITE"};

const VENUE_ADDITION_ALIASES={
r53:"에비스 요코초 이자카야 골목",r54:"부타구미 돈카츠 니시아자부",r55:"이치란 라멘 시부야",
a48:"신주쿠교엔 신주쿠 정원",a49:"쓰키지 장외시장 츠키지 시장",a50:"도요스 시장 참치 경매",
s19:"돈키호테 메가돈키 시부야 免税",s20:"로그로드 다이칸야마",
w08:"만요클럽 도요스 온천 센캬쿠반라이 千客万来",t09:"리무진 버스 공항버스 나리타 웨스틴 정류장"
};
const VENUE_ADDITION_AREA_ALIASES={"Tsukiji":"쓰키지 츠키지 築地"};

const VENUE_ADDITION_GUIDANCE={
r53:{en:"Lively alley of small eateries 2 min from Ebisu Station; good for a casual evening. Hours and booking rules differ by stall; evenings are crowded.",ja:"恵比寿駅から徒歩2分のにぎやかな横丁。気軽な夜向け。営業時間や予約の可否は店舗ごとに異なり、夜は混雑します。",ko:"에비스역 도보 2분의 활기찬 골목 식당가. 가벼운 저녁에 적합. 영업시간·예약 가능 여부는 가게마다 다르고 저녁에 붐빔."},
r54:{en:"Tonkatsu restaurant; the listing notes the pork brand can change by day. Book online in advance; source is a directory listing, so reconfirm hours.",ja:"とんかつ店。掲載上、豚の銘柄は日により変わる場合あり。事前にネット予約を。情報源は掲載サイトのため営業時間は要再確認。",ko:"돈카츠 전문점. 등록 정보상 돼지 브랜드는 날마다 바뀔 수 있음. 미리 온라인 예약. 출처가 등록 사이트이므로 영업시간 재확인."},
r55:{en:"Tonkotsu ramen at a 21-seat counter; listed as open 24 hours. Queues are common and the store may limit entry when busy.",ja:"カウンター21席の豚骨ラーメン。24時間営業と掲載。行列が多く、混雑時は入店制限あり。",ko:"카운터 21석의 돈코츠 라멘. 24시간 영업으로 게재. 줄이 잦고 붐비면 입장 제한."},
a48:{en:"National garden in Shinjuku; closed Mondays. Confirm hours, fee and gate before sending guests.",ja:"新宿の国民公園。月曜休園。案内前に開園時間・料金・門を確認。",ko:"신주쿠의 국립 정원. 월요일 휴원. 안내 전 개원 시간·요금·출입문 확인."},
a49:{en:"Morning street-food market; go 9:00–13:00. Many shops close Wednesdays, Sundays and holidays.",ja:"朝の食べ歩き市場。9時〜13時がおすすめ。水・日・祝休みの店が多い。",ko:"아침 길거리 음식 시장. 9~13시 추천. 수·일·공휴일 휴무 가게가 많음."},
a50:{en:"Early-morning tuna auction viewing from public corridors; the close-up deck needs advance booking. Closed Wednesdays, Sundays and holidays.",ja:"早朝のマグロせりを見学通路から見学可。間近のデッキは事前予約制。水・日・祝休み。",ko:"이른 아침 참치 경매를 견학 통로에서 볼 수 있음. 가까운 데크는 사전 예약제. 수·일·공휴일 휴무."},
s19:{en:"24-hour discount megastore for snacks, cosmetics and souvenirs; tax-free shopping available.",ja:"お菓子・化粧品・お土産がそろう24時間の大型店。免税対応。",ko:"과자·화장품·기념품을 파는 24시간 대형 할인점. 면세 가능."},
s20:{en:"Small shopping complex 4 min from Daikanyama Station; a good add-on to a Daikanyama walk. Check each shop's hours.",ja:"代官山駅から徒歩約4分の小さな商業施設。代官山散策と組み合わせて。営業時間は各店舗で確認。",ko:"다이칸야마역 도보 약 4분의 작은 쇼핑 시설. 다이칸야마 산책과 함께 추천. 영업시간은 각 매장 확인."},
w08:{en:"24-hour hot-spring facility inside Toyosu Senkyaku Banrai, next to Toyosu Market. Paid entry; check tattoo policy and prices.",ja:"豊洲市場に隣接する豊洲 千客万来内の24時間温泉施設。有料、タトゥー規則と料金を要確認。",ko:"도요스 시장 옆 도요스 센캬쿠반라이 안의 24시간 온천 시설. 유료, 문신 규정과 요금 확인 필요."},
t09:{en:"Direct airport bus from the hotel to Narita only. For Haneda, use another stop or a taxi; book seats on the official site.",ja:"ホテルから成田空港への直行バス（成田路線のみ）。羽田へは別の停留所かタクシーを。座席は公式サイトで予約。",ko:"호텔에서 나리타 공항으로 가는 직행 버스(나리타 노선만). 하네다는 다른 정류장이나 택시 이용. 좌석은 공식 사이트에서 예약."}
};

// Merge into the shared runtime registries (all declared by earlier classic scripts).
// Original venues are never touched. For an added ID, any pre-existing entry is an orphan
// (it belonged to no venue — e.g. a stale "Spa Izumi" alias under w08) and is replaced.
(function mergeVenueAdditions(){
 const original=new Set(DATA.map(r=>r.id)),added=new Set();
 for(const r of VENUE_ADDITIONS){
  if(original.has(r.id)||added.has(r.id)||!CATS.includes(r.category))continue;
  DATA.push(r);added.add(r.id);
  ROWS_BY_CATEGORY.get(r.category).push(r);
 }
 const put=(target,entries)=>{for(const [id,v] of Object.entries(entries))if(added.has(id))target[id]=v};
 put(VERIFIED_SOURCES,VENUE_ADDITION_SOURCES);
 put(SOURCE_SCOPE,VENUE_ADDITION_SOURCE_SCOPE);
 put(PLACE_ALIASES,VENUE_ADDITION_ALIASES);
 put(CONCIERGE_GUIDANCE,VENUE_ADDITION_GUIDANCE);
 for(const [area,v] of Object.entries(VENUE_ADDITION_AREA_ALIASES))if(!SEARCH_ALIASES[area])SEARCH_ALIASES[area]=v;
})();
