// One strict parser over the three actual deployed JS source assets.
// Never treat an outdated inline HTML snippet as the canonical venue/photo data.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const paths={catalogue:'assets/atelier-catalog.js',sources:'assets/atelier-sources.js',media:'assets/atelier-media.js'};
const catalogue=fs.readFileSync(paths.catalogue,'utf8');
const sources=fs.readFileSync(paths.sources,'utf8');
const media=fs.readFileSync(paths.media,'utf8');
const html=fs.readFileSync('index.html','utf8');
const snapshot=JSON.parse(fs.readFileSync('audits/stage01-original-data-snapshot.json','utf8'));
const section=(text,start,end)=>{
 const a=text.indexOf(start),b=a<0?-1:text.indexOf(end,a+start.length);
 assert(a>=0&&b>a,'Missing or malformed canonical section: '+start);
 return text.slice(a+start.length,b);
};
const catalogueSection=section(catalogue,'const DATA=[','].map(');
const licensedSection=section(media,'const LICENSED_VENUE_PHOTOS={','};');
const aiSection=section(media,'const AI_VENUE_VISUALS={','};');
const publicPhotoSourceBlock=section(media,'const VENUE_PHOTO_SOURCE_LINKS={','};');
const photoContextBlock=section(media,'const VENUE_PHOTO_CONTEXT={','};');
const sourceReviewSection=sources.slice(sources.indexOf('const VERIFIED_SOURCES='));
assert(sourceReviewSection.startsWith('const VERIFIED_SOURCES='),'Verified sources absent from canonical source asset');
const venueRows=[...catalogueSection.matchAll(/^\[("(?:[^"\\]|\\.)*"(?:,\s*"(?:[^"\\]|\\.)*"){6})\],?$/gm)].map(m=>JSON.parse('['+m[1]+']'));
const licensedEntries=[...licensedSection.matchAll(/^([a-z]\d+):\{url:"([^"]+)",source:"([^"]+)",credit:"([^"]+)",license:"([^"]+)",licenseUrl:"([^"]+)"\}/gm)].map(m=>({id:m[1],url:m[2],source:m[3],credit:m[4],license:m[5],licenseUrl:m[6]}));
const aiEntries=[...aiSection.matchAll(/([a-z]\d+):\{url:'([^']+)'/g)].map(m=>({id:m[1],file:m[2]}));
function gitBlobSha1(value){
 const bytes=Buffer.from(value,'utf8');
 return createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0','utf8')).update(bytes).digest('hex');
}
function verifyExtractedSnapshot(){
 for(const [path,digest] of Object.entries(snapshot.git_blob_sha1)){
  assert.equal(gitBlobSha1(fs.readFileSync(path,'utf8')),digest,'Byte-exact source baseline changed without independent review: '+path);
 }
 const expected=snapshot.expected;
 assert.equal(venueRows.length,expected.places,'Original venue record count changed');
 assert.equal(new Set(venueRows.map(r=>r[0])).size,expected.places,'Original venue ID ordering/uniqueness changed');
 assert.equal(licensedEntries.length,expected.licensed_venue_photo_entries,'Original licensed-photo count changed');
 assert.equal(aiEntries.length,expected.ai_visual_mappings,'Original AI visual count changed');
 assert.equal(venueRows.length-licensedEntries.length,expected.pending_photo_rights_slots,'Original unapproved photo count changed');
 assert.equal(new Set(licensedEntries.map(r=>r.id)).size,licensedEntries.length,'Duplicate published photos');
 assert.equal(new Set(aiEntries.map(r=>r.id)).size,aiEntries.length,'Duplicate AI photo mapping');
 assert.equal(licensedSection.split('\n').filter(x=>/^[a-z]\d+:\{/.test(x)).length,licensedEntries.length,'Unparsed licensed photo records');
 assert.equal(catalogueSection.split('\n').filter(x=>/^\[/.test(x)).length,venueRows.length,'Unparsed catalogue rows');
 // Ensure the public HTML actually loads the audited files, in strict dependency order.
 const expectedScripts=[paths.catalogue,paths.sources,paths.media,'assets/atelier-image-policy.js','assets/atelier-illustration.js','assets/atelier-search.js','assets/atelier-i18n.js'];
 let prior=-1;
 for(const path of expectedScripts){
  const match='<script src="'+path+'?v=';
  const pos=html.indexOf(match);
  assert(pos>prior,'Source file missing or loaded out of dependency order: '+path);
  assert(html.indexOf(match,pos+1)===-1,'Source asset loaded more than once: '+path);
  prior=pos;
 }
 const appPos=html.indexOf('<script src="assets/atelier-app.js?v=');
 assert(appPos>prior,'All audited canonical data scripts must load before the external app entrypoint');
 for(const name of ['DATA','VERIFIED_SOURCES','LICENSED_VENUE_PHOTOS','AI_VENUE_VISUALS','VENUE_PHOTO_SOURCE_LINKS','VENUE_PHOTO_CONTEXT']){
  assert(!html.includes('const '+name+'='),'Duplicate inline canonical declaration: '+name);
 }
 return {places:venueRows.length,licensed:licensedEntries.length,ai:aiEntries.length,pending:venueRows.length-licensedEntries.length};
}
// 2026-10-22: venues added after the protected 131-record baseline live in their own file,
// in the identical 7-field row format. The original catalogue above stays byte-pinned.
paths.additions='assets/atelier-catalog-additions.js';
const additions=fs.readFileSync(paths.additions,'utf8');
const additionsSection=section(additions,'const VENUE_ADDITIONS=[','].map(');
const additionRows=[...additionsSection.matchAll(/^\[("(?:[^"\\]|\\.)*"(?:,\s*"(?:[^"\\]|\\.)*"){6})\],?$/gm)].map(m=>JSON.parse('['+m[1]+']'));
assert.equal(additionsSection.split('\n').filter(x=>/^\[/.test(x)).length,additionRows.length,'Unparsed venue addition rows');
const additionSourceUrls=new Map([...additions.slice(additions.indexOf('const VENUE_ADDITION_SOURCES=')).matchAll(/(?:^|\n)([a-z]\d+):\{url:"(https:[^"]+)",checked:"(\d{4}-\d{2}-\d{2})"/g)].map(m=>[m[1],m[2]]));
const allVenueRows=[...venueRows,...additionRows];
assert.equal(new Set(allVenueRows.map(r=>r[0])).size,allVenueRows.length,'Added venue ID collides with an existing venue');
module.exports={paths,catalogue,sources,media,html,snapshot,catalogueSection,licensedSection,aiSection,publicPhotoSourceBlock,photoContextBlock,sourceReviewSection,venueRows,licensedEntries,aiEntries,verifyExtractedSnapshot,additions,additionRows,additionSourceUrls,allVenueRows};
