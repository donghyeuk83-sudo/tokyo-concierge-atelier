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
for(const f of ['catalog','sources','media','image-policy','illustration']){
 vm.runInContext(fs.readFileSync('assets/atelier-'+f+'.js','utf8').replace(/^(const|let) /gm,'var '),ctx,{filename:f});
}
const {DATA,LICENSED_VENUE_PHOTOS:L,AI_VENUE_VISUALS:A,AI_VISUAL_QUARANTINE:Q,STOCK_IMAGE_LIBRARY:S,VENUE_STOCK_IMAGES:VS,VENUE_OFFICIAL_IMAGES:VO}=ctx;
const ids=DATA.map(r=>r.id);

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
 assert.equal(item.isActualVenue,false,'Stock image cannot be labelled as the venue: '+key);
 assert(ctx.isSafeStockUrl(item.imageUrl),'Stock imageUrl must be a direct image file, not a search page: '+key);
 assert(/^https:\/\/(unsplash\.com\/photos\/|www\.pexels\.com\/photo\/|pixabay\.com\/(photos|illustrations)\/|commons\.wikimedia\.org\/wiki\/File:)/.test(item.sourcePageUrl),'Individual image page required: '+key);
 assert(/^https:\/\//.test(item.licenseUrl)&&item.license&&item.photographer,'License + credit metadata: '+key);
 assert(/^\d{4}-\d{2}-\d{2}$/.test(item.lastVerified),'Verification date: '+key);
 for(const flag of ['approvedForReuse','fileVerified','contentVerified'])assert.equal(typeof item[flag],'boolean',flag+' '+key);
}
for(const [id,key] of Object.entries(VS)){
 assert(ids.includes(id),'Stock mapping for unknown venue '+id);
 assert(S[key],'Stock mapping points to library item: '+id);
 assert(!L[id],'Stock must never replace an approved registry photo: '+id);
}
for(const bad of ['https://unsplash.com/s/photos/sushi','https://www.pexels.com/search/sushi/','https://pixabay.com/images/search/sushi/','https://images.pexels.com/search/sushi','http://images.unsplash.com/photo-1','https://example.com/a.jpg']){
 assert(!ctx.isSafeStockUrl(bad),'Rejects non-image or unknown URL '+bad);
}

// 6. Display gate: a stock image appears only when license, file and content were each verified.
const probe=Object.assign({},S['unsplash-sushi-Jm5uc0Z-5MQ']);
assert.equal(ctx.isDisplayableStock(Object.assign({},probe,{fileVerified:true,contentVerified:false})),false,'Unseen content is never displayed');
assert.equal(ctx.isDisplayableStock(Object.assign({},probe,{fileVerified:false,contentVerified:true})),false,'Unverified file is never displayed');
assert.equal(ctx.isDisplayableStock(Object.assign({},probe,{approvedForReuse:false,fileVerified:true,contentVerified:true})),false,'Unlicensed is never displayed');
assert.equal(ctx.isDisplayableStock(Object.assign({},probe,{isActualVenue:true,fileVerified:true,contentVerified:true})),false,'Stock posing as venue is never displayed');
assert.equal(ctx.isDisplayableStock(Object.assign({},probe,{fileVerified:true,contentVerified:true})),true,'Fully verified stock is displayable');
// Rendering a verified stock image: one labelled reference photo, hidden SVG fallback, credit + license.
const r02=DATA.find(r=>r.id==='r02');
S['unsplash-sushi-Jm5uc0Z-5MQ'].fileVerified=true;S['unsplash-sushi-Jm5uc0Z-5MQ'].contentVerified=true;
for(const lang of ['en','ja','ko']){
 ctx.lang=lang;const html=vm.runInContext('illustration(DATA.find(r=>r.id==="r02"))',ctx);
 assert(html.includes('data-image-source="stock"')&&html.includes(probe.imageUrl.replace(/&/g,'&amp;')),'Stock image rendered: '+lang);
 assert(html.includes(ctx.IMAGE_SOURCE_LABELS.stock[lang]),'Reference-photo label in '+lang);
 assert(html.includes('<svg hidden'),'SVG fallback hidden while image loads: '+lang);
 assert(html.includes('onerror='),'Load failure reveals SVG fallback: '+lang);
 assert(html.includes(probe.sourcePageUrl)&&html.includes(probe.licenseUrl),'Credit and license links: '+lang);
 assert(!/REAL VENUE PHOTO|実際の施設写真|실제 장소 사진/.test(html),'Never claims to be the real venue: '+lang);
}
S['unsplash-sushi-Jm5uc0Z-5MQ'].fileVerified=probe.fileVerified;S['unsplash-sushi-Jm5uc0Z-5MQ'].contentVerified=probe.contentVerified;ctx.lang='en';
assert.equal(ctx.venueImageRecord(r02).sourceType,Object.values(probe).length&&ctx.isDisplayableStock(probe)?'stock':'svg','r02 falls back safely');

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
assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),131,'All 131 venues resolved');
assert.equal(counts.licensed,89,'89 approved photos untouched');
console.log('PASS image policy: '+JSON.stringify(counts)+', quarantined AI '+Object.keys(Q).length+', stock candidates '+Object.keys(S).length+' (displayable '+Object.values(S).filter(ctx.isDisplayableStock).length+')');
