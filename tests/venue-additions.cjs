// Venues added after the protected 131-record baseline (2026-10-22).
// Checks every added row has a dated official/reference source and EN/JA/KO copy, never
// collides with or modifies an original venue, and merges correctly at runtime.
// Usage: node tests/venue-additions.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {verifyExtractedSnapshot,venueRows,additionRows}=require('./atelier-source-registry.cjs');

// The original 131 records, photos and AI mappings stay byte-identical.
assert.deepEqual(verifyExtractedSnapshot(),{places:131,licensed:89,ai:50,pending:42},'Protected baseline untouched');
assert.equal(additionRows.length,78,'Exactly 78 venues added (10 on 2026-10-22 + 39 + 27 restaurants + 2 shops on 2026-10-25); update this pin when adding more');

const original=new Set(venueRows.map(r=>r[0]));
const prefix={restaurant:'r',attraction:'a',shopping:'s',wellness:'w',transport:'t'};
for(const [id,category,name,ja,area,type,url] of additionRows){
 assert(!original.has(id),'Added ID reuses an original venue ID: '+id);
 assert(prefix[category],'Unknown category for '+id);
 assert(id.startsWith(prefix[category]),'ID prefix must match category: '+id);
 assert(name&&ja&&area&&type,'Missing identity fields: '+id);
 assert(/^https:\/\//.test(url),'Reference URL must be https: '+id);
 assert(!/\/search[\/?]|[?&]q=/.test(url),'Reference URL must be a venue page, not a search: '+id);
}

// Run the real load order in a sandbox: data → search → guidance → additions.
const ctx={URL,console};vm.createContext(ctx);
const load=f=>vm.runInContext(fs.readFileSync('assets/'+f,'utf8').replace(/^(const|let) /gm,'var '),ctx,{filename:f});
for(const f of ['atelier-catalog.js','atelier-sources.js','atelier-media.js','atelier-search.js','atelier-i18n.js','atelier-common.js','atelier-guidance.js'])load(f);
const before=ctx.DATA.slice(),beforeSources=Object.assign({},ctx.VERIFIED_SOURCES),beforeAliases=Object.assign({},ctx.PLACE_ALIASES),beforeGuidance=Object.assign({},ctx.CONCIERGE_GUIDANCE);
load('atelier-catalog-additions.js');
const {DATA,ROWS_BY_CATEGORY,VERIFIED_SOURCES,SOURCE_SCOPE,PLACE_ALIASES,SEARCH_ALIASES,CONCIERGE_GUIDANCE}=ctx;

assert.equal(DATA.length,209,'131 original + 78 added venues at runtime');
before.forEach((r,i)=>assert.equal(DATA[i],r,'Original venue order/object unchanged: '+r.id));
for(const [id,v] of Object.entries(beforeSources))assert.equal(VERIFIED_SOURCES[id],v,'Original source untouched: '+id);
for(const [id,v] of Object.entries(beforeGuidance))assert.equal(CONCIERGE_GUIDANCE[id],v,'Original guidance untouched: '+id);
for(const r of before)assert.equal(PLACE_ALIASES[r.id],beforeAliases[r.id],'Original alias untouched: '+r.id);
for(const [cat,rows] of ROWS_BY_CATEGORY)assert.deepEqual(rows,DATA.filter(r=>r.category===cat),'Category cache matches DATA for '+cat);

const today=new Date('2026-10-25');
for(const [id] of additionRows){
 const r=DATA.find(x=>x.id===id),src=VERIFIED_SOURCES[id];
 assert(r&&r.status==='NEEDS_CONFIRMATION','Added venue present and flagged for confirmation: '+id);
 assert(src&&/^https:\/\//.test(src.url),'Dated source for '+id);
 assert(/^\d{4}-\d{2}-\d{2}$/.test(src.checked)&&new Date(src.checked)<=today,'Source check date: '+id);
 for(const l of ['en','ja','ko'])assert(typeof src[l]==='string'&&src[l].length>=40,'Source summary in '+l+': '+id);
 const g=CONCIERGE_GUIDANCE[id];
 for(const l of ['en','ja','ko'])assert(typeof g?.[l]==='string'&&g[l].length>=20,'Concierge note in '+l+': '+id);
 assert(PLACE_ALIASES[id]&&/[가-힣]/.test(PLACE_ALIASES[id]),'Korean search alias: '+id);
 assert(SEARCH_ALIASES[r.area],'Area has a multilingual alias: '+r.area);
 // Third-party listings must be labelled "reference only".
 if(/tabelog\.com|gnavi|hotpepper|retty/.test(src.url))assert(SOURCE_SCOPE[id],'Third-party listing must carry a reference-only scope: '+id);
}
// An orphan alias that belonged to no venue (w08 "Spa Izumi") must not leak into the new w08.
assert(!/Izumi|イーズミ/.test(PLACE_ALIASES.w08),'Stale orphan alias replaced for w08');

// Search finds every added venue by its Korean alias and by its Japanese name.
for(const [id,,,ja] of additionRows){
 const r=DATA.find(x=>x.id===id),text=ctx.searchText(r);
 assert(text.includes(ja.toLocaleLowerCase()),'Japanese name searchable: '+id);
 assert(text.includes(PLACE_ALIASES[id].split(' ')[0].toLocaleLowerCase()),'Korean alias searchable: '+id);
}
// Stock photos of the place itself (location-tagged) vs generic references, in all languages.
ctx.esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const f of ['atelier-image-policy.js','atelier-manual-photos.js','atelier-illustration.js'])load(f);
for(const lang of ['en','ja','ko']){
 vm.runInContext('lang='+JSON.stringify(lang),ctx); // atelier-common.js declares lang with let
 for(const id of ['a48','a49']){const html=vm.runInContext('illustration(DATA.find(r=>r.id==="'+id+'"))',ctx);assert(html.includes(ctx.IMAGE_SOURCE_LABELS.stockUnverified[lang]),'Neutral unverified-location label: '+id+' '+lang);assert(!html.includes(ctx.IMAGE_SOURCE_LABELS.stockActual[lang])&&!html.includes(ctx.IMAGE_SOURCE_LABELS.stock[lang]),'Neither place-specific nor NOT-THIS-VENUE claim: '+id+' '+lang)}
 for(const id of ['r53','r54','r55'])assert(vm.runInContext('illustration(DATA.find(r=>r.id==="'+id+'"))',ctx).includes(ctx.IMAGE_SOURCE_LABELS.stock[lang]),'Generic reference label: '+id+' '+lang);
}
// Photo queue for additions is generated and current.
const queue=fs.readFileSync('audits/missing-photo-queue-additions.csv','utf8').trim().split('\n').slice(1).map(l=>l.match(/^"([^"]+)"/)[1]);
assert.deepEqual(queue,additionRows.map(r=>r[0]),'Additions photo queue lists every added venue (run tests/photo-queue.cjs)');
console.log('PASS venue additions: '+additionRows.length+' added ('+additionRows.map(r=>r[0]).join(' ')+'), 209 at runtime, originals untouched');
