// Venue image policy gate (2026-10-22): official > licensed > stock > AI > SVG.
// Guards: quarantined AI tiles stay hidden, every mapped file exists, every AI file has a
// hash-pinned visual review, stock images can never pose as the venue, and registration
// cannot overwrite an approved photo. Usage: node tests/image-policy.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {verifyExtractedSnapshot}=require('./atelier-source-registry.cjs');

// Protected baseline must be intact before anything else.
assert.deepEqual(verifyExtractedSnapshot(),{places:131,licensed:89,ai:50,pending:42},'Protected data baseline');

const ctx={lang:'en',esc:s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),URL};
vm.createContext(ctx);
for(const f of ['catalog','sources','media','image-policy','manual-photos','illustration']){
 vm.runInContext(fs.readFileSync('assets/atelier-'+f+'.js','utf8').replace(/^(const|let) /gm,'var '),ctx,{filename:f});
}
const {DATA,LICENSED_VENUE_PHOTOS:L,AI_VENUE_VISUALS:A,AI_VISUAL_QUARANTINE:Q,STOCK_IMAGE_LIBRARY:S,VENUE_STOCK_IMAGES:VS,VENUE_OFFICIAL_IMAGES:VO}=ctx;
const ids=DATA.map(r=>r.id);
const allIds=require('./atelier-source-registry.cjs').allVenueRows.map(r=>r[0]); // original + 2026-10-22 additions

// 1. Every mapped local file exists and is non-empty (AI + local licensed photos).
for(const [id,v] of Object.entries(A)){
 assert(fs.existsSync(v.url)&&fs.statSync(v.url).size>1000,'AI file missing or empty: '+id+' '+v.url);
}
for(const [id,p] of Object.entries(L)){
 if(!/^https?:/.test(p.url))assert(fs.existsSync(p.url)&&fs.statSync(p.url).size>1000,'Local approved photo missing: '+id+' '+p.url);
}

// 2. Quarantine refers to real mapped AI tiles whose original files are preserved on disk.
for(const [id,q] of Object.entries(Q)){
 assert(ids.includes(id),'Quarantine for unknown venue '+id);
 assert(A[id],'Quarantined ID must be an existing AI mapping (registry untouched): '+id);
 assert(fs.existsSync(A[id].url),'Quarantined original file must be preserved: '+id);
 assert(Array.isArray(q.issues)&&q.issues.length&&q.note.length>=20,'Quarantine needs issues and evidence: '+id);
}
for(const id of ['r02','r11'])assert(Q[id],'Sushi Takeuchi / Yoroniku Chuo tiles stay quarantined: '+id);

// 3. Hash-pinned visual review for all 50 AI files: a new or swapped file fails until reviewed.
const csv=fs.readFileSync('audits/ai-visual-audit-2026-10-22.csv','utf8').trim().split('\n').slice(1)
 .map(line=>line.slice(1,-1).split('","'));
assert.equal(csv.length,Object.keys(A).length,'Every AI mapping has one visual-audit row');
for(const [id,file,sha,,verdict] of csv){
 assert(A[id]&&A[id].url===file,'Audit row matches mapped file: '+id);
 const actual=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 assert.equal(actual,sha,'AI file changed since visual review — re-review before showing: '+id);
 assert.equal(verdict==='QUARANTINED',Boolean(Q[id]),'Audit verdict and quarantine list agree: '+id);
}

// 4. Rendered output: quarantined tiles produce SVG only, no caption, one label, no bad text.
for(const r of DATA){
 if(L[r.id])continue; // card() renders the approved photo; illustration() is not used
 const html=ctx.illustration(r);
 if(Q[r.id]){
  assert(!html.includes(A[r.id].url),'Quarantined AI file never referenced: '+r.id);
  assert(!/<svg hidden/.test(html)||/data-image-source="stock"/.test(html),'SVG visible when no image: '+r.id);
  assert(!html.includes('art-caption'),'No caption over quarantined fallback: '+r.id);
 }
 assert.equal((html.match(/class="card-photo-label"/g)||[]).length,1,'Exactly one label: '+r.id);
 assert(!/(<img[^>]*>[\s\S]*){2}/.test(html.split('photo-credit')[0]),'At most one image per card: '+r.id);
}

// 5. Stock library: direct files on allowed hosts, individual license pages, never the venue.
for(const [key,item] of Object.entries(S)){
 assert.equal(item.sourceType,'stock',key);
 // Stock is generic unless its own location tag shows this exact place (e.g. a public garden).
 assert(item.isActualVenue===false||(item.isActualVenue===true&&(item.locationEvidence||'').length>=20),'Stock image labelled as the venue needs location evidence: '+key);
 assert(ctx.isSafeStockUrl(item.imageUrl),'Stock imageUrl must be a direct image file, not a search page: '+key);
 assert(/^https:\/\/(unsplash\.com\/photos\/|www\.pexels\.com\/photo\/|pixabay\.com\/(photos|illustrations)\/|commons\.wikimedia\.org\/wiki\/File:)/.test(item.sourcePageUrl),'Individual image page required: '+key);
 assert(/^https:\/\//.test(item.licenseUrl)&&item.license&&item.photographer,'License + credit metadata: '+key);
 assert(/^\d{4}-\d{2}-\d{2}$/.test(item.lastVerified),'Verification date: '+key);
 for(const flag of ['approvedForReuse','fileVerified','contentVerified'])assert.equal(typeof item[flag],'boolean',flag+' '+key);
 assert(item.fileVerified&&item.contentVerified||/^\d{4}-\d{2}-\d{2}$/.test(item.ownerApproved||''),'Shown stock needs verification or dated owner approval: '+key);
}
for(const [id,key] of Object.entries(VS)){
 assert(allIds.includes(id),'Stock mapping for unknown venue '+id);
 assert(S[key],'Stock mapping points to library item: '+id);
 assert(!L[id],'Stock must never replace an approved registry photo: '+id);
}
for(const bad of ['https://unsplash.com/s/photos/sushi','https://www.pexels.com/search/sushi/','https://pixabay.com/images/search/sushi/','https://images.pexels.com/search/sushi','http://images.unsplash.com/photo-1','https://example.com/a.jpg']){
 assert(!ctx.isSafeStockUrl(bad),'Rejects non-image or unknown URL '+bad);
}

// 6. Display gate: license confirmed AND (file+content verified OR dated owner approval).
const probe=Object.assign({},S[VS.r02]);
const off={fileVerified:false,contentVerified:false,ownerApproved:undefined};
assert.equal(ctx.isDisplayableStock(Object.assign({},probe,off)),false,'Unchecked and unapproved stock is never displayed');
assert.equal(ctx.isDisplayableStock(Object.assign({},probe,off,{fileVerified:true})),false,'File check alone is not enough');
assert.equal(ctx.isDisplayableStock(Object.assign({},probe,off,{fileVerified:true,contentVerified:true})),true,'Fully verified stock is displayable');
assert.equal(ctx.isDisplayableStock(Object.assign({},probe,off,{ownerApproved:'yes'})),false,'Owner approval must be a dated record');
assert.equal(ctx.isDisplayableStock(Object.assign({},probe,{approvedForReuse:false})),false,'Unlicensed is never displayed, even owner-approved');
assert.equal(ctx.isDisplayableStock(Object.assign({},probe,{isActualVenue:true})),false,'Stock posing as venue is never displayed');
// No photo is reused across venues (the reason the AI duplicates were withdrawn).
const shownUrls=new Map();
for(const r of DATA){const rec=ctx.venueImageRecord(r);if(rec.sourceType==='svg')continue;
 assert(!shownUrls.has(rec.imageUrl),'Same image shown for '+shownUrls.get(rec.imageUrl)+' and '+r.id);shownUrls.set(rec.imageUrl,r.id)}
assert.equal(new Set(Object.values(VS)).size,Object.keys(VS).length,'Each venue maps to its own stock record');
// Rendering: one labelled reference photo, hidden SVG fallback, credit + license, every language.
const r02=DATA.find(r=>r.id==='r02');
for(const lang of ['en','ja','ko']){
 ctx.lang=lang;
 for(const id of Object.keys(VS).filter(id=>ids.includes(id))){ // additions are rendered in venue-additions.cjs
  const html=vm.runInContext('illustration(DATA.find(r=>r.id==="'+id+'"))',ctx),item=S[VS[id]];
  assert(html.includes('data-image-source="stock"')&&html.includes(item.imageUrl.replace(/&/g,'&amp;')),'Stock image rendered: '+id+' '+lang);
  assert(html.includes(ctx.IMAGE_SOURCE_LABELS.stock[lang]),'Reference-photo label: '+id+' '+lang);
  assert(html.includes('<svg hidden')&&html.includes('onerror='),'SVG fallback only on load failure: '+id);
  assert(html.includes(item.sourcePageUrl)&&html.includes(item.licenseUrl)&&html.includes(ctx.esc(item.photographer)),'Credit and license links: '+id);
  assert(item.isActualVenue||!/REAL VENUE PHOTO|実際の施設写真|실제 장소 사진|THIS PLACE|この場所|이 장소의/.test(html),'Generic stock never claims to be the real venue: '+id);
  if(A[id])assert(!html.includes(A[id].url),'Withdrawn AI file not referenced: '+id);
 }
}
// Provenance overlay (2026-10-23): neutral status is limited to a48/a49; every other stock record keeps its label path.
assert.deepEqual(Object.entries(S).filter(([,v])=>v.locationStatus!==undefined).map(([k])=>k).sort(),['unsplash-a48-garden','unsplash-a49-market'],'Only a48/a49 carry locationStatus');
for(const [k,v] of Object.entries(S))if(v.locationStatus!==undefined)assert(v.locationStatus==='unverified'&&v.isActualVenue===false,'locationStatus is only "unverified" and never with a place claim: '+k);
for(const id of ['r16','r20'])for(const l of ['en','ja','ko'])assert(!/without further editing|追加編集なし|追加編集せず|추가 편집 없/.test(ctx.VENUE_PHOTO_CONTEXT[id][l]),'Unverified editing claim withdrawn: '+id+' '+l);
assert(/one Oshiage/.test(ctx.VERIFIED_SOURCES.r37.en)&&!/TWO/.test(ctx.VERIFIED_SOURCES.r37.en),'r37 note matches the official single-store listing');
for(const k of ['unsplash-a48-garden','unsplash-a49-market'])assert(!/Shinjuku|Gyoen|Tsukiji|pavilion|pond/i.test(S[k].alt),'Unverified location is not asserted in alt text: '+k);
ctx.lang='en';
assert.equal(ctx.venueImageRecord(r02).sourceType,'stock','Sushi Takeuchi shows its stock reference photo');

// 7. Registration guard never overwrites a working image and refuses unsafe records.
const licensedId=Object.keys(L)[0];
const base={venueId:'r02',sourceType:'stock',imageUrl:probe.imageUrl,licenseUrl:'https://unsplash.com/license',approvedForReuse:true,isActualVenue:false};
assert(ctx.registerVenueImage({},base,ids).ok,'Valid stock registration accepted');
assert(!ctx.registerVenueImage({r02:{}},base,ids).ok,'Existing image is not overwritten');
assert(!ctx.registerVenueImage({},Object.assign({},base,{venueId:licensedId}),ids).ok,'Approved photo is not overwritten');
assert(!ctx.registerVenueImage({},Object.assign({},base,{isActualVenue:true}),ids).ok,'Stock cannot claim to be the venue');
assert(!ctx.registerVenueImage({},Object.assign({},base,{approvedForReuse:false}),ids).ok,'Unconfirmed rights refused');
assert(!ctx.registerVenueImage({},Object.assign({},base,{imageUrl:'https://unsplash.com/s/photos/sushi'}),ids).ok,'Search page refused as image');
assert(!ctx.registerVenueImage({},Object.assign({},base,{venueId:'zz9'}),ids).ok,'Unknown venue refused');
assert(!ctx.registerVenueImage({},Object.assign({},base,{sourceType:'official',isActualVenue:false}),ids).ok,'Official image must depict the venue');

// 8. Official tier: only records with a documented grant and exact venue identity.
for(const [id,item] of Object.entries(VO)){
 assert.equal(item.venueId,id,'Official image venue identity: '+id);
 assert(item.approvedForReuse===true&&item.isActualVenue===true&&/^https:\/\//.test(item.licenseUrl),'Official image needs written grant: '+id);
}

// 9. Totals: every venue resolves to exactly one source type.
const counts={official:0,licensed:0,stock:0,ai:0,svg:0};
for(const r of DATA)counts[ctx.venueImageRecord(r).sourceType]++;
assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),131,'All 131 original venues resolved (additions load later and are covered by venue-additions.cjs)');
// One approved photo (s09 Shibuya Loft, a building exterior) is withdrawn at runtime by owner request (2026-10-27);
// the protected registry file still holds all 89 and the withdrawn record is kept for audit.
assert.equal(counts.licensed,88,'88 approved photos live (89 in the protected registry minus the withdrawn Shibuya Loft exterior)');
assert.deepEqual(Object.keys(ctx.WITHDRAWN_LICENSED_PHOTOS),['s09'],'Only Shibuya Loft is withdrawn');
assert(/Shibuya-Loft\.jpg/.test(ctx.WITHDRAWN_LICENSED_PHOTOS.s09.record&&ctx.WITHDRAWN_LICENSED_PHOTOS.s09.record.url),'Withdrawn record preserved');
assert.equal(ctx.venueImageRecord(ctx.DATA.find(r=>r.id==='s09')).sourceType,'stock','Shibuya Loft shows its reference stock photo');
assert(/loft/i.test(fs.readFileSync('assets/atelier-media.js','utf8').match(/s09:\{[^}]+\}/)[0]),'Protected atelier-media.js still lists the original Shibuya Loft photo');
console.log('PASS image policy: '+JSON.stringify(counts)+', quarantined AI '+Object.keys(Q).length+', stock candidates '+Object.keys(S).length+' (displayable '+Object.values(S).filter(ctx.isDisplayableStock).length+')');
