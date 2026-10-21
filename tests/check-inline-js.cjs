// Fail fast on malformed inline JavaScript before any slow HTTP venue or browser checks.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const stage4=JSON.parse(fs.readFileSync('audits/stage04-original-code-snapshot.json','utf8'));
const appTag='<script src="assets/atelier-app.js?v=20261021-e"></script>';
const entryPos=html.indexOf(appTag);
assert(entryPos>=0,'External app must be present in HTML');

const {paths,verifyExtractedSnapshot}=require('./atelier-source-registry.cjs');
const baseline=verifyExtractedSnapshot();
assert.deepEqual(baseline,{places:131,licensed:89,ai:50,pending:42},'Original data and rights baseline');
for(const path of [paths.catalogue,paths.sources,paths.media]){
 new vm.Script(fs.readFileSync(path,'utf8'),{filename:path});
}
const scriptTags=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
assert.equal(scriptTags.length,13,'Expected exactly thirteen source-controlled external classic JavaScript tags');
assert(scriptTags.every(m=>/\bsrc="assets\/[\w-]+\.js\?v=[^"]+"/.test(m[1])&&!m[2].trim()),'No inline executable scripts or unknown script URL forms are permitted');

const illustrationPath='assets/atelier-illustration.js';
assert(html.includes('<script src="'+illustrationPath+'?v=20261022-yoroniku-r11"></script>'),'Venue illustration renderer must load before catalogue inline script');
const externalJS=fs.readFileSync(illustrationPath,'utf8');
assert(externalJS.includes('function illustration(r){'),'Venue artwork function missing from extracted asset');
new vm.Script(externalJS,{filename:illustrationPath});
const searchPath='assets/atelier-search.js';
const illustrationTag='<script src="'+illustrationPath+'?v=20261022-label-fix"></script>';
const searchTag='<script src="'+searchPath+'?v=20261021-a"></script>';
assert(html.includes(searchTag),'Versioned external multilingual search index missing');
assert(html.indexOf(illustrationTag)<html.indexOf(searchTag)&&html.indexOf(searchTag)<entryPos,'Illustration and search assets must load before inline catalogue initialization');
const searchSource=fs.readFileSync(searchPath,'utf8');
new vm.Script(searchSource,{filename:searchPath});
const localePath='assets/atelier-i18n.js';
const localeTag='<script src="'+localePath+'?v=20261021-a"></script>';
const searchTagPos=html.indexOf(searchTag),localeTagPos=html.indexOf(localeTag),appTagPos=entryPos;
assert(localeTagPos>searchTagPos&&localeTagPos<appTagPos,'Locales must be loaded after search and before main catalogue script');
const localeJS=fs.readFileSync(localePath,'utf8');
new vm.Script(localeJS,{filename:localePath});
const originalLocale=localeJS.slice(localeJS.indexOf('const I18N='));
assert(originalLocale.startsWith('const I18N='),'Locale translation literal must exist');
let h=2166136261;
for(let i=0;i<originalLocale.length;i++){h^=originalLocale.charCodeAt(i);h=Math.imul(h,16777619)}
assert.equal((h>>>0).toString(16),'a7fb4a39','Original three-language copy changed unexpectedly');
assert(!html.includes('const I18N='),'Locale definitions must have exactly one source of truth');
assert(searchSource.includes('function searchText(r)'),'Dedicated search index must define searchText');
// Stage 2: immutable original code extraction + ordered classic-script initialization.
const {createHash}=require('node:crypto');
const stage2=JSON.parse(fs.readFileSync('audits/stage02-original-code-snapshot.json','utf8'));
const blob=(source)=>{const bytes=Buffer.from(source,'utf8');return createHash('sha1').update(Buffer.from('blob '+bytes.length,'utf8')).update(Buffer.from([0])).update(bytes).digest('hex');};
const scripts=[...stage2.load_after,...stage2.load_order];
let prev=-1;
for(const path of scripts){
 const token='<script src="'+path+'?v=';
 const pos=html.indexOf(token);
 assert(pos>prev&&pos<entryPos,'Classic script missing or out of order: '+path);
 assert(!html.includes(token,pos+token.length),'Classic script duplicated: '+path);
 prev=pos;
}
for(const [path,sha] of Object.entries(stage2.git_blob_sha1)){
 const source=fs.readFileSync(path,'utf8');
 new vm.Script(source,{filename:path});
 assert.equal(blob(source),sha,'Stage 2 extracted code changed without review: '+path);
}
for(const name of ['CONCIERGE_GUIDANCE','VENUE_ALERTS','DESCRIPTIONS','INTERNAL_RECOMMENDATIONS','VALID_VENUE_IDS']){
 assert(!html.includes('const '+name+'='),'Duplicated extracted declaration '+name);
}
assert(!html.includes('function shortlistUrl()')&&!html.includes('function save()'),'Shortlist state must have one source of truth');
// Stage 3: prove editorial and renderer extraction kept byte-identical code.
const stage3=JSON.parse(fs.readFileSync('audits/stage03-original-code-snapshot.json','utf8'));
let previous=-1;
for(const path of [...stage3.load_after,...stage3.load_order]){
 const token='<script src="'+path+'?v=';
 const at=html.indexOf(token);
 assert(at>previous&&at<entryPos,'Stage 3 classic JS dependency order: '+path);
 assert(html.indexOf(token,at+token.length)===-1,'Duplicate classic script: '+path);
 previous=at;
}
for(const [path,expected] of Object.entries(stage3.git_blob_sha1)){
 const contents=fs.readFileSync(path,'utf8');
 new vm.Script(contents,{filename:path});
 assert.equal(blob(contents),expected,'Stage 3 byte-exact source fingerprint changed: '+path);
}
const renderSource=fs.readFileSync('assets/atelier-render.js','utf8');
const editorialSource=fs.readFileSync('assets/atelier-editorial.js','utf8');
for(const name of ['options','card','openVenuePhoto','openDetail','syncPhotoQuickbar','render']){
 assert(renderSource.includes('function '+name+'(')&&!html.includes('function '+name+'('),'Renderer duplication or disappearance: '+name);
}
for(const name of ['translateLanding','prioritizeConciergeOnMobile','translateImageLabels','translateChrome','translateEditorial','verifyEditorialPhotos']){
 assert(editorialSource.includes('function '+name+'(')&&!html.includes('function '+name+'('),'Editorial duplication or disappearance: '+name);
}
for(const name of ['LANDING_COPY','VISUAL_COPY','IMAGE_LABELS','CHROME_COPY']){
 assert(editorialSource.includes('const '+name+'=')&&!html.includes('const '+name+'='),'Editorial language content source duplicate: '+name);
}
// Stage 3 original startup and event behavior is checked below in the external app and export modules.
// Stage 4: there is no inline JavaScript. CSV and application source are the
// original inline business logic, guarded by exact Git blob SHA-1 checks.
let lastOrder=-1;
for(const path of stage4.load_order){
 const token='<script src="'+path+'?v=';
 const position=html.indexOf(token);
 assert(position>lastOrder,'Missing/out-of-order external classic JS: '+path);
 assert(html.indexOf(token,position+token.length)===-1,'Duplicate source reference: '+path);
 lastOrder=position;
}
assert.equal(lastOrder,entryPos,'The application must load last');
for(const [path,digest] of Object.entries(stage4.git_blob_sha1)){
 const src=fs.readFileSync(path,'utf8');
 new vm.Script(src,{filename:path});
 assert.equal(blob(src),digest,'Stage 4 application/export source changed from original: '+path);
}
const exportSource=fs.readFileSync('assets/atelier-export.js','utf8');
const appSource=fs.readFileSync('assets/atelier-app.js','utf8');
for(const statement of stage3.unchanged_bootstrap_in_index){
 assert(appSource.includes(statement),'Original UI startup behavior missing from app source: '+statement);
}
for(const statement of stage4.retained_in_export){
 assert(exportSource.includes(statement),'CSV original behavior removed: '+statement);
}
for(const statement of stage4.retained_in_app){
 assert(appSource.includes(statement),'Application original event/init behavior removed: '+statement);
}
const originalCSVHeader=JSON.stringify(stage4.csv_columns);
assert(exportSource.includes(stage4.csv_columns.map(s=>JSON.stringify(s)).join(',')),'Original 11-column CSV header lost');
assert(!html.includes('$("download").onclick=')&&!html.includes('document.addEventListener("click"'),'Inline business/event logic must not remain after stage 4');
console.log('PASS',scriptTags.length,'external JS modules and stage 1-4 exact original fingerprints, CSV, event, privacy and photo gates');



