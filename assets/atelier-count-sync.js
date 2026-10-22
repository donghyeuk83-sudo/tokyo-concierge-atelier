// Tokyo Concierge Atelier — keeps count-dependent landing copy in step with the real catalogue size.
"use strict";
// Classic script loaded right after atelier-editorial.js and before the renderer/app, so the very first
// translate() already shows the live total (original 131 + atelier-catalog-additions.js rows).
// atelier-editorial.js stays byte-identical and hash-pinned (stage 3); only the venue-count number in the
// introduction sentence (leadNote, EN/JA/KO) is replaced with DATA.length. Each pattern matches the number
// only when it is followed by the venue noun, so no other digit in the sentence can be touched.
// Language switching re-reads LANDING_COPY, so every language stays correct.
(function syncVenueCountCopy(){
 if(typeof LANDING_COPY==="undefined"||typeof DATA==="undefined")return;
 const total=String(DATA.length);
 const venueCount={en:/\d+(?= places\b)/,ja:/\d+(?=件)/,ko:/\d+(?=개 장소)/};
 for(const code of Object.keys(venueCount)){
  const copy=LANDING_COPY[code];
  if(copy&&typeof copy.leadNote==="string")copy.leadNote=copy.leadNote.replace(venueCount[code],total);
 }
})();
