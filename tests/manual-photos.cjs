// Manually added venue photos (2026-10-22): registry integrity, priority and rendering.
// Usage: node tests/manual-photos.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const {allVenueRows,licensedEntries}=require('./atelier-source-registry.cjs');

// 1. The browser registry is exactly what the intake script generates from registry.json.
const js='assets/atelier-manual-photos.js',before=fs.readFileSync(js,'utf8');
execFileSync('python3',['scripts/manual-photo-intake.py','--regenerate-only']);
assert.equal(fs.readFileSync(js,'utf8'),before,'atelier-manual-photos.js is out of date: run python3 scripts/manual-photo-intake.py --regenerate-only');
const registry=JSON.parse(fs.readFileSync('assets/manual-photos/registry.json','utf8')).photos;
assert(Array.isArray(registry),'registry.json photos array');

// 2. Inbox is empty after intake (only the README may remain).
const leftovers=fs.readdirSync('assets/manual-photos/inbox').filter(f=>!/^(README\.md|\.gitkeep)$/.test(f));
assert.deepEqual(leftovers,[],'Unprocessed photos left in the inbox');

// 3. Every record is publishable, points at a real WebP, a real venue, and no approved-photo venue.
const ctx={URL,lang:'en',esc:s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))};vm.createContext(ctx);
for(const f of ['catalog','sources','media','image-policy','manual-photos','illustration'])vm.runInContext(fs.readFileSync('assets/atelier-'+f+'.js','utf8').replace(/^(const|let) /gm,'var '),ctx,{filename:f});
const venueIds=new Set(allVenueRows.map(r=>r[0])),licensed=new Set(licensedEntries.map(e=>e.id));
const seen=new Set();
for(const rec of registry){
 assert(!seen.has(rec.venueId),'Duplicate manual photo '+rec.venueId);seen.add(rec.venueId);
 assert(venueIds.has(rec.venueId),'Manual photo for unknown venue '+rec.venueId);
 assert(!licensed.has(rec.venueId),'Manual photo would be hidden behind an approved photo: '+rec.venueId);
 assert(ctx.isPublishableManualPhoto(rec,rec.venueId),'Manual photo record incomplete (credit, rights, source, date): '+rec.venueId);
 assert.deepEqual(ctx.MANUAL_VENUE_PHOTOS[rec.venueId],rec,'Browser registry matches registry.json: '+rec.venueId);
 const buf=fs.readFileSync(rec.file);
 assert(buf.length>1000&&buf.toString('ascii',0,4)==='RIFF'&&buf.toString('ascii',8,12)==='WEBP','Manual photo must be a WebP produced by the intake script: '+rec.file);
 if(rec.permissionUrl)assert(/^https:\/\//.test(rec.permissionUrl),'Permission link must be https: '+rec.venueId);
}
for(const f of fs.readdirSync('assets/manual-photos').filter(f=>f.endsWith('.webp')))
 assert(registry.some(r=>r.file==='assets/manual-photos/'+f),'Orphan manual photo file without a registry record: '+f);

// 4. Priority and rendering, using a synthetic record (no real file needed to render).
const rec={venueId:'r02',file:'assets/manual-photos/r02.webp',sourceType:'official',credit:'Sushi Takeuchi',rightsBasis:'Written permission from the venue, 2026-10-22',isActualVenue:true,alt:'Counter',addedOn:'2026-10-22',permissionUrl:'https://example.com/permission'};
const saved=Object.assign({},ctx.MANUAL_VENUE_PHOTOS);
ctx.MANUAL_VENUE_PHOTOS.r02=rec;
const r02=ctx.DATA.find(r=>r.id==='r02');
assert.equal(ctx.venueImageRecord(r02).sourceType,'manual','Manual photo outranks the stock photo');
for(const [lang,label] of [['en','OFFICIAL VENUE PHOTO'],['ja','施設提供の公式写真'],['ko','공식 제공 사진']]){
 ctx.lang=lang;const html=vm.runInContext('illustration(DATA.find(r=>r.id==="r02"))',ctx);
 assert(html.includes('data-image-source="manual"')&&html.includes('src="assets/manual-photos/r02.webp"'),'Manual image rendered '+lang);
 assert(html.includes(label),'Official manual label '+lang);
 assert(html.includes('<svg hidden')&&html.includes('onerror='),'SVG appears only if the manual photo fails '+lang);
 assert(html.includes('Sushi Takeuchi')&&html.includes('https://example.com/permission'),'Credit and permission link shown '+lang);
 assert(!html.includes('images.unsplash.com'),'Stock image not rendered when a manual photo exists '+lang);
}
ctx.lang='en';
ctx.MANUAL_VENUE_PHOTOS.r02=Object.assign({},rec,{sourceType:'owner',isActualVenue:false});
assert(vm.runInContext('illustration(DATA.find(r=>r.id==="r02"))',ctx).includes('REFERENCE PHOTO · ADDED BY STAFF'),'Non-venue manual photo is labelled as a reference');
ctx.MANUAL_VENUE_PHOTOS.r02=Object.assign({},rec,{rightsBasis:'ok'});
assert.equal(ctx.venueImageRecord(r02).sourceType,'stock','A record without a rights statement is never published');
ctx.MANUAL_VENUE_PHOTOS.r02=Object.assign({},rec,{file:'https://tabelog.com/x.jpg'});
assert.equal(ctx.venueImageRecord(r02).sourceType,'stock','Manual photos must be files in this repository, never hotlinked');
const licensedId=[...licensed][0];
ctx.MANUAL_VENUE_PHOTOS[licensedId]=Object.assign({},rec,{venueId:licensedId,file:'assets/manual-photos/'+licensedId+'.webp'});
assert.equal(ctx.venueImageRecord(ctx.DATA.find(r=>r.id===licensedId)).sourceType,'licensed','Approved registry photo outranks a manual photo');
for(const k of Object.keys(ctx.MANUAL_VENUE_PHOTOS))delete ctx.MANUAL_VENUE_PHOTOS[k];Object.assign(ctx.MANUAL_VENUE_PHOTOS,saved);
console.log('PASS manual photos: '+registry.length+' registered; priority approved > manual > stock > AI > SVG; EN/JA/KO labels; inbox clean');
