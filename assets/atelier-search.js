// Tokyo Concierge Atelier: multilingual venue-search index.
// Same original aliases and search fields; one immutable normalized string per venue.
// Classic script loads synchronously before the main catalogue script. I18N and
// CATS are resolved when searchText is called after catalogue initialization.
"use strict";
const SEARCH_ALIASES={
"Ebisu":"에비스 恵比寿","Ginza":"긴자 銀座","Asakusa":"아사쿠사 浅草","Shibuya":"시부야 渋谷","Shinjuku":"신주쿠 新宿","Nakameguro":"나카메구로 中目黒","Daikanyama":"다이칸야마 代官山","Roppongi":"롯폰기 六本木","Harajuku":"하라주쿠 原宿","Oshiage":"오시아게 押上","Ueno":"우에노 上野","Marunouchi":"마루노우치 丸の内","Shinagawa":"시나가와 品川","Narita":"나리타 成田","Ota":"오타 羽田","Azabudai":"아자부다이 麻布台","Omotesando":"오모테산도 表参道","Korakuen":"고라쿠엔 後楽園","Shiodome":"시오도메 汐留","Shiba-koen":"시바공원 芝公園","Minami-Aoyama":"미나미아오야마 南青山","Jingumae":"진구마에 神宮前","Higashi-Azabu":"히가시아자부 東麻布"};
Object.assign(SEARCH_ALIASES,{"Nihonbashi":"니혼바시 日本橋","Nishi-Azabu":"니시아자부 西麻布","Ningyocho":"닌교초 人形町","Kanda":"칸다 神田","Otemachi":"오테마치 大手町","Komagome":"코마고메 駒込","Odaiba":"오다이바 お台場","Ryogoku":"료고쿠 両国","Mitaka":"미타카 三鷹","Toyosu":"도요스 豊洲","Akihabara":"아키하바라 秋葉原","Yurakucho":"유라쿠초 有楽町","Itabashi":"이타바시 板橋","Nerima":"네리마 練馬"});
const PLACE_ALIASES={"a01":"도쿄타워 東京塔","a02":"도쿄 스카이트리 스카이트리","a03":"메이지 신궁 메이지진구","a04":"센소지 센소우지","a05":"시부야 스카이","a06":"팀랩 보더리스 팀라보","a07":"우에노 공원","a08":"하마리큐 정원","s01":"긴자식스","s02":"이세탄 신주쿠","s03":"오모테산도 힐즈","w01":"테르마유","w02":"스파 라쿠아","t01":"도쿄역","t02":"시나가와역","t03":"하네다 공항","t04":"나리타 공항"};
Object.assign(PLACE_ALIASES,{"r21":"피자바 38층 피자바온38","r22":"곤파치 니시아자부","r23":"마이센 아오야마 돈카츠","r24":"이마한 스키야키","r25":"칸다 마츠야 소바","r26":"츠루톤탄 우동","r27":"아후리 에비스 라멘","r28":"에비스 비어홀","a09":"도쿄 국립 박물관","a10":"국립 신미술관","a11":"모리 미술관","a12":"네즈 미술관","a13":"에비스 가든 플레이스","a14":"에비스 브루어리 도쿄","a15":"도쿄 도청 전망대","a16":"황거 동쪽 정원","a17":"리쿠기엔 정원","a18":"코이시카와 코라쿠엔","a19":"오다이바 해변공원","a20":"스미다 호쿠사이 미술관","a21":"지브리 미술관","a22":"팀랩 플래닛","s05":"긴자 미츠코시","s06":"마츠야 긴자","s07":"도큐 플라자 오모테산도","s08":"시부야 파르코","s09":"시부야 로프트","s10":"긴자 이토야 문구","s11":"갓파바시 주방용품","s12":"요도바시 아키바","s13":"빅카메라 유라쿠초","s14":"도쿄 소라마치","w03":"사야노유도코로 온천","w04":"니와노유 온천","t05":"에비스역","t06":"시부야역","t07":"신주쿠역","t08":"우에노역"});

const SEARCH_TEXT_CACHE=new WeakMap();
function searchText(r){
 let result=SEARCH_TEXT_CACHE.get(r);
 if(result===undefined){
  result=[r.name,r.ja,r.area,r.type,SEARCH_ALIASES[r.area]||"",PLACE_ALIASES[r.id]||"",I18N.en.cats[CATS.indexOf(r.category)],I18N.ja.cats[CATS.indexOf(r.category)],I18N.ko.cats[CATS.indexOf(r.category)]].join(" ").toLocaleLowerCase();
  SEARCH_TEXT_CACHE.set(r,result);
 }
 return result;
}
