// Tokyo Concierge Atelier artwork renderer, extracted unchanged from the original inline script.
"use strict";
// Classic script loaded synchronously before the catalogue script; resolves esc() and lang at call time.
// Illustrations are NOT approved photographs of their venues.
function illustration(r){
const c=r.category,t=r.type.toLowerCase(),n=r.name.toLowerCase();
// Show pre-existing venue-specific AI artwork, preserving SVG as the loading/error fallback.
const aiVisual=r.id==="r11"?null:(typeof AI_VENUE_VISUALS!=="undefined"&&AI_VENUE_VISUALS[r.id]); // r11 artwork depicts Chuo, not Yoroniku
const art={
sushi:'<ellipse cx="100" cy="102" rx="78" ry="13" fill="#785c6670"/><ellipse cx="100" cy="84" rx="77" ry="24" fill="#fffaf2"/><path d="M46 79q15-21 31 0t31 0t31 0t31 0" fill="none" stroke="#fff0d3" stroke-width="17"/><path d="M45 70q16-17 31 0t31 0t31 0t31 0" fill="none" stroke="#ed806d" stroke-width="13"/><path d="M148 16l30 59M161 13l30 59" stroke="#624c46" stroke-width="5"/>',
tempura:'<ellipse cx="100" cy="99" rx="78" ry="16" fill="#fff8e7"/><path d="M43 81q8-49 26-17t28 0t29 0t29 17" fill="none" stroke="#f3ae53" stroke-width="17" stroke-linecap="round"/><path d="M55 65l-13-22M92 63l-4-30M128 65l17-30" stroke="#d87b52" stroke-width="9" stroke-linecap="round"/><path d="M25 96q75 35 150 0" fill="none" stroke="#fbdfac" stroke-width="6"/>',
pizza:'<circle cx="100" cy="69" r="53" fill="#b96b49"/><circle cx="100" cy="69" r="47" fill="#ffe3a0"/><path d="M100 21v96M55 45l90 48M55 93l90-48" stroke="#c77a4d" stroke-width="3"/><g fill="#d85d4d"><circle cx="76" cy="52" r="9"/><circle cx="121" cy="48" r="8"/><circle cx="112" cy="91" r="10"/><circle cx="70" cy="90" r="8"/></g><g fill="#428a65"><ellipse cx="103" cy="48" rx="7" ry="12"/><ellipse cx="86" cy="86" rx="7" ry="12"/></g>',
fine:'<path d="M40 108h120" stroke="#fff8e9" stroke-width="7"/><path d="M70 105l-10-52h80l-10 52Z" fill="#fff2e3"/><path d="M60 53q40-44 80 0" fill="#ffe3a2"/><path d="M92 50q-16-26 8-39q23 12 8 39" fill="#f4a77e"/><path d="M40 40v45M32 40v25M48 40v25M160 40v45" stroke="#fff5e5" stroke-width="5"/>',
tower:'<path d="M30 114h140" stroke="#e9f6f0" stroke-width="5"/><path d="M100 9l-35 105h70Z" fill="#e87462"/><path d="M100 9l15 105H85Z" fill="#fff6df"/><path d="M75 76h50M69 96h62M85 45h30" stroke="#df6c5a" stroke-width="8"/><path d="M100 9V0" stroke="#fff7e2" stroke-width="5"/>',
temple:'<path d="M25 55l75-43 75 43-10 10H35Z" fill="#a94f4d"/><path d="M38 67h124v45H38Z" fill="#f3d4b0"/><path d="M30 80h140" stroke="#a94f4d" stroke-width="9"/><path d="M55 68v45M145 68v45" stroke="#8b4c46" stroke-width="9"/><path d="M82 112V84h36v28" fill="#8b4c46"/><path d="M100 0v18" stroke="#e8b96e" stroke-width="6"/>',
nature:'<path d="M0 111q48-32 100 0t100 0v14H0Z" fill="#6ca891"/><path d="M46 111V56M144 111V51" stroke="#735c4e" stroke-width="9"/><circle cx="46" cy="47" r="32" fill="#f7c1c5"/><circle cx="144" cy="42" r="37" fill="#f6b4c2"/><circle cx="21" cy="43" r="14" fill="#fce0dc"/><circle cx="166" cy="37" r="18" fill="#fce0dc"/>',
city:'<path d="M20 112V60h32v52M59 112V35h37v77M103 112V17h31v95M142 112V49h38v63" fill="#f4e9d9"/><path d="M110 27h16M110 43h16M110 59h16M67 49h20M67 67h20M149 61h22" stroke="#85b7b7" stroke-width="6"/><circle cx="161" cy="19" r="14" fill="#f9d78a"/>',
skytree:'<path d="M100 5L70 113h60Z" fill="#e9f5f2"/><path d="M100 5L86 113h28Z" fill="#70a9b6"/><path d="M80 78h40M74 96h52M91 46h18" stroke="#f5d49c" stroke-width="7"/><path d="M100 5V0" stroke="#f8f0d7" stroke-width="5"/><ellipse cx="100" cy="45" rx="28" ry="7" fill="#f7f3e4"/><ellipse cx="100" cy="69" rx="35" ry="8" fill="#f7f3e4"/>',
shibuya:'<path d="M20 113V38h43v75M69 113V15h48v98M123 113V50h57v63" fill="#f7ebdf"/><path d="M78 25h30v47H78Z" fill="#76b6c0"/><path d="M30 49h22M30 64h22M30 79h22M133 65h37M133 80h37" stroke="#9ebdc0" stroke-width="6"/><path d="M7 118l186-30M7 90l186 28" stroke="#fef8e8" stroke-width="10"/><path d="M7 118l186-30M7 90l186 28" stroke="#e4c898" stroke-width="2"/>',
teamlab:'<circle cx="100" cy="61" r="49" fill="#403d81"/><circle cx="78" cy="43" r="18" fill="#f6b6c5"/><circle cx="121" cy="42" r="20" fill="#9cd8c7"/><circle cx="82" cy="81" r="23" fill="#f3d48c"/><circle cx="123" cy="83" r="20" fill="#c2afe5"/><path d="M100 15v96M52 61h96" stroke="#fff6e7" stroke-width="3" opacity=".8"/><g fill="#fff9e6"><circle cx="65" cy="26" r="4"/><circle cx="140" cy="64" r="4"/><circle cx="100" cy="94" r="4"/></g>',
shrine:'<path d="M35 114V36M165 114V36M22 35h156M34 49h132" stroke="#9e554a" stroke-width="11"/><path d="M35 35l-14-12M165 35l14-12" stroke="#9e554a" stroke-width="7"/><path d="M77 115V77h46v38" fill="#f5e8ce"/><path d="M69 79l31-24 31 24" fill="#6e8b71"/><circle cx="100" cy="19" r="9" fill="#f6d98e"/>',
shopping:'<path d="M48 47h104l-12 65H60Z" fill="#fff4e7"/><path d="M72 54V35a28 28 0 0 1 56 0v19" stroke="#ac637d" stroke-width="8" fill="none"/><path d="M60 79h80" stroke="#d9a1a4" stroke-width="6"/><path d="M35 25l8 10-8 10-8-10ZM164 14l6 8-6 8-6-8Z" fill="#fff7d7"/>',
wellness:'<path d="M33 70h134v30q0 18-18 18H51q-18 0-18-18Z" fill="#f9f2df"/><path d="M33 70h134" stroke="#7ab9aa" stroke-width="9"/><path d="M63 57q-17-15 0-33M100 57q-17-15 0-33M137 57q-17-15 0-33" fill="none" stroke="#fff5dc" stroke-width="7" stroke-linecap="round"/>',
transport:'<rect x="37" y="22" width="126" height="91" rx="20" fill="#fef7e8"/><rect x="49" y="37" width="102" height="45" rx="8" fill="#5a9fb0"/><path d="M100 37v45" stroke="#fff8e8" stroke-width="5"/><circle cx="65" cy="99" r="8" fill="#456d7b"/><circle cx="135" cy="99" r="8" fill="#456d7b"/><path d="M68 115l-14 10M132 115l14 10" stroke="#fdf3e3" stroke-width="6"/>'
};
let key=c;
if(c==="restaurant")key=t.includes("sushi")?"sushi":t.includes("tempura")?"tempura":t.includes("pizza")||t.includes("italian")?"pizza":"fine";
if(c==="attraction")key=n.includes("skytree")?"skytree":n.includes("tokyo tower")?"tower":n.includes("shibuya sky")?"shibuya":n.includes("teamlab")?"teamlab":t.includes("shrine")?"shrine":t.includes("temple")?"temple":t.includes("park")||t.includes("garden")?"nature":"city";
const variants={sushi:["#e9a6a0","#f8d2ac"],tempura:["#efc083","#f9e2b0"],pizza:["#e9ad8f","#f8d9b0"],fine:["#b7b6d8","#ead2d0"],tower:["#82c5c6","#d7e4c5"],skytree:["#a7d7df","#d8d5e9"],shibuya:["#f0c5a5","#b9d7d2"],teamlab:["#b4a4d9","#f2b9cc"],shrine:["#a8d2b7","#e9ddae"],temple:["#e8baaa","#f6dcb7"],nature:["#a8d8bf","#e6e7b7"],city:["#9dc4dd","#d2cbe8"],shopping:["#d9b6d8","#f4d9c2"],wellness:["#9bcdbb","#e5e6c4"],transport:["#9fc8e1","#d6d3e7"]};
const p=variants[key]||variants.city;
const serial=Number(String(r.id).replace(/\D/g,''))||0;const identity=[...String(r.id+'|'+r.name+'|'+r.area)].reduce((h,ch)=>((h*33)^ch.charCodeAt(0))>>>0,5381);const n1=identity%157,n2=(identity>>>8)%153,n3=(identity>>>16)%91;const accents=['#fff8dc','#fbe4e6','#e2f6f2','#e8e5fb'];const motifIndex=(identity>>>4)%5;
const motifSet={
restaurant:[
'<path d="M10 118q40-20 80 0t100 0" stroke="#fff6e4" stroke-width="3" fill="none" opacity=".7"/>',
'<g fill="#fff5dd" opacity=".7"><circle cx="26" cy="28" r="5"/><circle cx="174" cy="31" r="5"/><circle cx="163" cy="96" r="3"/></g>',
'<path d="M17 16l15 13m0-13L17 29M169 97l15 13m0-13l-15 13" stroke="#fff8ec" stroke-width="3" opacity=".7"/>',
'<ellipse cx="100" cy="118" rx="91" ry="8" fill="#fff8eb" opacity=".23"/>',
'<path d="M12 105q24-15 48 0m80 0q24-15 48 0" stroke="#fff8e5" stroke-width="5" fill="none" opacity=".6"/>'
],
attraction:[
'<path d="M0 116h200" stroke="#fff7e8" stroke-width="4" opacity=".7"/>',
'<g fill="#fff8ea" opacity=".75"><circle cx="29" cy="25" r="5"/><circle cx="173" cy="21" r="7"/></g>',
'<path d="M12 16h32M28 1v30M160 16h28M174 2v28" stroke="#fff8ea" stroke-width="3" opacity=".6"/>',
'<path d="M0 115q35-21 70 0t70 0t60 0" stroke="#fdf5e3" stroke-width="4" fill="none" opacity=".55"/>',
'<circle cx="161" cy="24" r="17" stroke="#fff7e8" stroke-width="3" fill="none" opacity=".65"/>'
],
shopping:[
'<path d="M16 22l8 12 8-12-8-12Zm154 66 7 10 7-10-7-10Z" fill="#fff6e8" opacity=".8"/>',
'<circle cx="34" cy="36" r="18" stroke="#fff9e9" stroke-width="3" fill="none" opacity=".6"/>',
'<path d="M20 105h160" stroke="#fff6e8" stroke-width="5" opacity=".6"/>',
'<path d="M27 20h25m-13-12v25M157 24h23m-12-12v24" stroke="#fff6e8" stroke-width="3" opacity=".7"/>',
'<g fill="#fff9eb"><circle cx="22" cy="91" r="4"/><circle cx="175" cy="30" r="5"/></g>'
],
wellness:[
'<path d="M15 111q28-20 56 0t56 0t58 0" stroke="#fff9e9" stroke-width="4" fill="none" opacity=".65"/>',
'<g fill="#fff9e9" opacity=".7"><circle cx="24" cy="20" r="6"/><circle cx="171" cy="35" r="9"/></g>',
'<path d="M20 60q14-20 28 0m105 0q14-20 28 0" stroke="#fff9e9" stroke-width="4" fill="none" opacity=".7"/>',
'<ellipse cx="100" cy="114" rx="88" ry="8" fill="#fff8e8" opacity=".22"/>',
'<path d="M19 20h28M33 6v28M161 19h22M172 8v22" stroke="#fff9e9" stroke-width="3" opacity=".65"/>'
],
transport:[
'<path d="M0 117h200" stroke="#fff9e9" stroke-width="5" opacity=".7"/>',
'<path d="M18 25h36M146 25h36" stroke="#fff9e9" stroke-width="5" opacity=".6"/>',
'<g fill="#fff8ea"><circle cx="25" cy="96" r="5"/><circle cx="174" cy="96" r="5"/></g>',
'<path d="M20 15l18 15-18 15m160-30-18 15 18 15" stroke="#fff8ea" stroke-width="4" fill="none" opacity=".6"/>',
'<path d="M12 114l24-15m152 15-24-15" stroke="#fff8ea" stroke-width="4" opacity=".7"/>'
]};
const motif=(motifSet[c]||motifSet.attraction)[motifIndex];
const sparkle='<circle cx="'+(18+n1)+'" cy="'+(15+n3)+'" r="'+(4+identity%7)+'" fill="'+accents[identity%4]+'" opacity=".7"/><path d="M'+(18+n2)+' 15v18m-9-9h18" stroke="'+accents[(identity+1)%4]+'" stroke-width="3" opacity=".65"/>';return '<div class="card-art art-'+key+'" style="background:linear-gradient('+(110+identity%100)+'deg,'+p[identity%2]+','+p[(identity+1)%2]+')" role="img" aria-label="'+esc(r.name)+' — illustrative artwork, not a photograph">'+(aiVisual?'<img loading="lazy" decoding="async" src="'+esc(aiVisual.url)+'" alt="'+esc(r.name)+' — AI-generated venue illustration" onerror="this.hidden=true;this.nextElementSibling.removeAttribute(&quot;hidden&quot;)" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" /><svg hidden viewBox="0 0 200 125" xmlns="http://www.w3.org/2000/svg">'+motif+sparkle+art[key]+'</svg>':'<svg viewBox="0 0 200 125" xmlns="http://www.w3.org/2000/svg">'+motif+sparkle+art[key]+'</svg>')+(aiVisual||r.id==="r11"?'':'<span class="art-caption">'+esc(r.name)+' · '+esc(r.area)+'</span>')+'<span class="card-photo-label">'+({en:'VENUE ILLUSTRATION',ja:'施設イメージイラスト',ko:'장소별 제작 일러스트'}[lang])+'</span></div>'
}
