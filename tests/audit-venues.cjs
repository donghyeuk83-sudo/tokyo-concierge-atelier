// Generate a conservative 131-venue photo/source audit. No guessed rights or images.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const dataSection=html.split('const DATA=[')[1]?.split('].map(')[0];
assert(dataSection,'DATA catalog section missing');
const entries=[...dataSection.matchAll(/^\[("(?:[^"\\]|\\.)*"(?:,\s*"(?:[^"\\]|\\.)*"){6})\],?$/gm)]
 .map(m=>JSON.parse('['+m[1]+']'));
assert.equal(entries.length,131,'Expected exactly 131 venue records');
for(const e of entries){assert.equal(e.length,7,'Venue must have seven fields');assert(e[0]&&e[1]&&e[2]&&e[3]&&e[4]&&e[5],'Venue missing required identity fields: '+e[0]);assert(!e[6]||/^https:\/\//.test(e[6]),'Venue reference URL invalid: '+e[0]);}
const ids=entries.map(x=>x[0]);
assert.equal(new Set(ids).size,131,'Duplicate venue ID');
const licensedSection=html.split('const LICENSED_VENUE_PHOTOS={')[1]?.split('};')[0];
assert(licensedSection,'Licensed photos registry missing');
const licensed=[...licensedSection.matchAll(/^([a-z]\d+):\{url:"([^"]+)",source:"([^"]+)",credit:"([^"]+)",license:"([^"]+)",licenseUrl:"([^"]+)"\}/gm)]
 .map(m=>({id:m[1],url:m[2],source:m[3],credit:m[4],license:m[5],licenseUrl:m[6]}));
assert.equal(new Set(licensed.map(x=>x.id)).size,licensed.length,'Duplicate licensed image ID');
for(const p of licensed){assert(ids.includes(p.id),'Unknown image ID: '+p.id);assert(p.url.startsWith('https://'),'Image URL not HTTPS');assert(p.source.startsWith('https://'),'Source URL not HTTPS');assert(p.credit.trim(),'Missing photographer');assert(p.licenseUrl.startsWith('https://creativecommons.org/'),'Missing CC license');}
// Regression checks: every venue remains visually represented, including image-load failures.
assert(html.includes('licensedPhoto|| illustration(r)'),'Missing illustration fallback for venues without photos');
assert(html.includes("img.addEventListener('error'"),'Missing broken-photo fallback handler');
for(const p of licensed){
 const path=decodeURIComponent(new URL(p.url).pathname); const imageName=path.includes('/Special:FilePath/')?path.split('/Special:FilePath/')[1].replace(/_/g,' '):path.includes('/commons/thumb/')?path.split('/').slice(-2,-1)[0].replace(/_/g,' '):path.split('/').pop().replace(/_/g,' ');
 const sourceName=decodeURIComponent(p.source.split('/wiki/File:')[1]||'').replace(/_/g,' ');
 assert(imageName&&sourceName&&imageName===sourceName,'Photo filename differs from credited Commons file: '+p.id);
}
// Ensure failures hide the broken photo and insert a visible venue illustration.
assert(html.includes("photo.style.display='none'"),'Broken photos must be hidden');
assert(html.includes("photo.insertAdjacentElement('afterend',fallback.firstElementChild)"),'Fallback illustration must be inserted');
// Evidence-backed manual checks; all other images remain unverified.
// This records source-page metadata, not blanket permission for every downstream use.
const manuallyChecked=new Map([
 ['a11',{source:'https://commons.wikimedia.org/wiki/File:Mori_Art_Museum_entrance.jpg',author:'Syced',license:'CC BY-SA 3.0',subject:'Mori Art Museum',checked:'2026-10-18'}]
]);
for(const [id,review] of manuallyChecked){
 const p=licensed.find(x=>x.id===id);
 assert(p,'Manual review references missing photo: '+id);
 assert.equal(p.source,review.source,'Source changed since manual review: '+id);
 assert.equal(p.credit,review.author,'Author changed since manual review: '+id);
 assert.equal(p.license,review.license,'License changed since manual review: '+id);
}
const photos=new Map(licensed.map(p=>[p.id,p]));
const knownCategories=new Set(['restaurant','attraction','shopping','wellness','transport']);
for(const e of entries)assert(knownCategories.has(e[1]),'Unknown venue category: '+e[0]);
const esc=s=>'"'+String(s??'').replace(/"/g,'""')+'"';
const header=['id','category','name_en','name_ja','area','type','venue_reference_url','photo_status','image_url','image_source_url','photographer','license','license_url','venue_official_site_review','image_venue_match_review','reuse_rights_review','source_metadata_review','source_review_date','source_review_evidence'];
const missingVenueReferences=entries.filter(e=>!e[6]).map(e=>({id:e[0],name:e[2]}));
console.log('VENUES_WITHOUT_REFERENCE_URL',JSON.stringify(missingVenueReferences));
assert.equal(missingVenueReferences.length,0,'Venue reference URLs missing: '+JSON.stringify(missingVenueReferences));
const rows=entries.map(([id,category,name,nameJa,area,type,url])=>{
 const p=photos.get(id); const checked=manuallyChecked.get(id);
 return [id,category,name,nameJa,area,type,url,p?'PHOTO_REGISTERED':'PHOTO_NOT_YET_VERIFIED',p?.url||'',p?.source||'',p?.credit||'',p?.license||'',p?.licenseUrl||'','NEEDS_MANUAL_REVIEW',p?'REGISTERED_IMAGE_NEEDS_VISUAL_REVIEW':'NOT_REVIEWED',p?'LICENSE_CLAIM_RECORDED_RIGHTS_UNVERIFIED':'NOT_REVIEWED',checked?'SOURCE_METADATA_CHECKED':'NEEDS_MANUAL_REVIEW',checked?.checked||'',checked?.source||''].map(esc).join(',');
});
fs.mkdirSync('audits',{recursive:true});
fs.writeFileSync('audits/venue-photo-audit.csv',[header.map(esc).join(','),...rows].join('\n')+'\n');
const summary={venues:entries.length,photos_registered:licensed.length,photos_pending:entries.length-licensed.length,venue_reference_urls_missing:missingVenueReferences.length,venue_official_sites_manually_reviewed_in_this_audit:0,photo_license_claims_recorded:licensed.length,reuse_rights_independently_verified:0,source_metadata_manually_checked:manuallyChecked.size,generated_at:new Date().toISOString()};
fs.writeFileSync('audits/venue-photo-summary.json',JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary));
