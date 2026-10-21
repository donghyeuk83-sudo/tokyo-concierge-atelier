"use strict";
let selected=new Set();
const VALID_VENUE_IDS=new Set(DATA.map(r=>r.id));
function parseSavedShortlist(raw){try{const ids=JSON.parse(raw||"[]");return new Set(Array.isArray(ids)?ids.filter(id=>typeof id==="string"&&VALID_VENUE_IDS.has(id)):[])}catch(e){return new Set()}}
let storageWriteFailed=false;
try{selected=parseSavedShortlist(localStorage.getItem("atelier-shortlist-v2"))}catch(e){storageWriteFailed=true}
let csvExportUrl=null;
function invalidateCsvDownload(){
 if(csvExportUrl){URL.revokeObjectURL(csvExportUrl);csvExportUrl=null}
 const fallback=$("csvDownloadFallback"),link=$("csvDirectDownload");
 if(fallback)fallback.classList.add("hidden");
 if(link)link.removeAttribute("href");
}
function save(){
 invalidateCsvDownload();
 try{localStorage.setItem("atelier-shortlist-v2",JSON.stringify([...selected]));storageWriteFailed=false}
 catch(e){storageWriteFailed=true}
 $("share").textContent={en:"Copy guide link",ja:"ガイドリンクをコピー",ko:"가이드 링크 복사"}[lang];
}
/* Guest shortlist share 5.2 — only public venue IDs, never personal data */
function shortlistUrl(){
 const ids=DATA.filter(r=>selected.has(r.id)).map(r=>r.id);
 // A file:// or loopback-hosted draft cannot be opened from another device.
 // Share the canonical public guide instead, still containing only public venue IDs.
 const localPreview=location.protocol==="file:"||["localhost","127.0.0.1","[::1]"].includes(location.hostname);
 const u=new URL(localPreview?"https://donghyeuk83-sudo.github.io/tokyo-concierge-atelier/":location.href);
 u.hash=ids.length?"guide="+ids.join(","):"";u.search="";
 return u.toString();
}
function importShortlistHash(){let h="";try{h=decodeURIComponent(location.hash.slice(1))}catch(e){return false}if(!h.startsWith("guide="))return false;const valid=new Set(DATA.map(r=>r.id));const ids=h.slice(6).split(",").filter(id=>valid.has(id));if(!ids.length)return false;selected=new Set(ids);save();return true}
