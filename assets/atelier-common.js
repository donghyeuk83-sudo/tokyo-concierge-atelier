"use strict";
const $=id=>document.getElementById(id);let lang="en",category="restaurant",
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function tr(){return I18N[lang]}
function currentVenueLocation(r){return r.id==="a32"?"着物フォトスタジオ和 東京都品川区上大崎2-24-13 目黒西口マンション1号館804":r.ja+" "+r.area+" Tokyo"}
function hotelDirections(r,mode){return "https://www.google.com/maps/dir/?api=1&origin="+encodeURIComponent("The Westin Tokyo, 1-4-1 Mita, Meguro City, Tokyo")+"&destination="+encodeURIComponent(currentVenueLocation(r))+"&travelmode="+encodeURIComponent(mode)}
function venueMap(r){return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(currentVenueLocation(r))}
