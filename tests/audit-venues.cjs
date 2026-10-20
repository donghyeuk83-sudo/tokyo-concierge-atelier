// Generate a conservative 131-venue photo/source audit. No guessed rights or images.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const localPhotos=JSON.parse(fs.readFileSync('assets/photos/sources.json','utf8'));
assert.equal(new Set(localPhotos.map(p=>p.id)).size,localPhotos.length,'Duplicate local source review');
const dataSection=html.split('const DATA=[')[1]?.split('].map(')[0];
assert(dataSection,'DATA catalog section missing');
const entries=[...dataSection.matchAll(/^\[("(?:[^"\\]|\\.)*"(?:,\s*"(?:[^"\\]|\\.)*"){6})\],?$/gm)]
 .map(m=>JSON.parse('['+m[1]+']'));
assert.equal(entries.length,131,'Expected exactly 131 venue records');
for(const e of entries){assert.equal(e.length,7,'Venue must have seven fields');assert(e[0]&&e[1]&&e[2]&&e[3]&&e[4]&&e[5],'Venue missing required identity fields: '+e[0]);assert(!e[6]||/^https:\/\//.test(e[6]),'Venue reference URL invalid: '+e[0]);}
// Audit source identity and catalogue filter area together, not just Google Maps.
const kimonoWA=entries.find(v=>v[0]==='a32');
assert(kimonoWA&&kimonoWA[4]==='Meguro','Kimono Photo Studio WA must be catalogued in verified Meguro, not Asakusa');
const ids=entries.map(x=>x[0]);
assert.equal(new Set(ids).size,131,'Duplicate venue ID');
const licensedSection=html.split('const LICENSED_VENUE_PHOTOS={')[1]?.split('};')[0];
assert(licensedSection,'Licensed photos registry missing');
const licensed=[...licensedSection.matchAll(/^([a-z]\d+):\{url:"([^"]+)",source:"([^"]+)",credit:"([^"]+)",license:"([^"]+)",licenseUrl:"([^"]+)"\}/gm)]
 .map(m=>({id:m[1],url:m[2],source:m[3],credit:m[4],license:m[5],licenseUrl:m[6]}));
assert.equal(new Set(licensed.map(x=>x.id)).size,licensed.length,'Duplicate licensed image ID');
assert.equal(licensed.length,licensedSection.split('\n').filter(line=>/^[a-z][0-9]+:\{/.test(line)).length,'Photo registry contains unparsed entries');
for(const p of licensed){assert(ids.includes(p.id),'Unknown image ID: '+p.id);assert(p.url.startsWith('https://')||/^assets\/photos\/[a-z0-9-]+\.(jpg|webp)$/.test(p.url),'Image URL not HTTPS or a local photo');assert(p.source.startsWith('https://'),'Source URL not HTTPS');assert(p.credit.trim(),'Missing photographer');assert(p.licenseUrl.startsWith('https://creativecommons.org/'),'Missing CC license');assert(!/\bNC\b|\/by-nc(?:-|\/)/i.test(p.license+' '+p.licenseUrl),'Non-commercial-only photo cannot be added to the public hotel concierge catalogue without separate permission: '+p.id);}
// Regression checks: every venue remains visually represented, including image-load failures.
assert(html.includes('licensedPhoto||')&&html.includes('illustration(r)'),'Missing photo / AI visual / illustration fallback chain');
assert(html.includes("img.addEventListener('error'"),'Missing broken-photo fallback handler');
for(const p of licensed){
 if(p.url.startsWith('assets/photos/')){
  const review=localPhotos.find(photo=>photo.id===p.id);assert(review,'Local photo requires a reviewed source record: '+p.id);
  assert.equal(p.source,review.source,'Local photo source changed: '+p.id);
  assert.equal(p.url,review.file,'Local photo identity must match the asset: '+p.id);
  assert.equal(p.credit,review.credit,'Local photographer changed: '+p.id);
  assert.equal(p.license,review.license,'Local photo license changed: '+p.id);
  assert.equal(p.licenseUrl,review.licenseUrl,'Local photo license URL changed: '+p.id);
  assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(p.url)).digest('hex'),review.sha256,'Published photo bytes changed since review: '+p.id);
  continue;
 }
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
 ['r26',{source:'https://commons.wikimedia.org/wiki/File:Curry_Udon_@_Tsurutontan_@_Roppongi_(13621744175).jpg',author:'Guilhem Vellut',license:'CC BY 2.0',subject:'Curry udon at the former Roppongi location, April 2014; full frame',checked:'2026-10-19'}],
 ...localPhotos.map(photo=>[photo.id,{source:photo.source,author:photo.credit,license:photo.license,subject:photo.title,checked:photo.reviewedOn,evidence:photo.source+' | Published copy: '+photo.retrievedFrom}]),
 ['w07',{source:'https://commons.wikimedia.org/wiki/File:Westin_Hotel_Tokyo.jpg',author:'Harani0403',license:'CC BY-SA 3.0',subject:'Westin Tokyo hotel exterior, not spa interior',checked:'2026-10-18'}],
 ['w02',{source:'https://commons.wikimedia.org/wiki/File:LaQua01s3872.jpg',author:'663highland',license:'CC BY 2.5',subject:'LaQua complex exterior',checked:'2026-10-18'}],
 ['r30',{source:'https://commons.wikimedia.org/wiki/File:道玄坂_2024年10月12日の渋谷_202410121836_IMG_3124.jpg',author:'ウィ貴公子',license:'CC BY-SA 4.0',subject:'Dogenzaka streetscape with Kura Sushi building sign',checked:'2026-10-18'}],
 ['r46',{source:'https://commons.wikimedia.org/wiki/File:Sumo_wrestling_in_Japan4.jpg',author:'Joli Rumi',license:'CC BY-SA 4.0',subject:'Asakusa Sumo Club demonstration',checked:'2026-10-18'}],
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
assert.equal(header.length,19,'Audit CSV schema changed unexpectedly');
const rows=entries.map(([id,category,name,nameJa,area,type,url])=>{
 const p=photos.get(id); const checked=manuallyChecked.get(id);
 return [id,category,name,nameJa,area,type,url,p?'PHOTO_REGISTERED':'PHOTO_NOT_YET_VERIFIED',p?.url||'',p?.source||'',p?.credit||'',p?.license||'',p?.licenseUrl||'','NEEDS_MANUAL_REVIEW',p?'REGISTERED_IMAGE_NEEDS_VISUAL_REVIEW':'NOT_REVIEWED',p?'LICENSE_CLAIM_RECORDED_RIGHTS_UNVERIFIED':'NOT_REVIEWED',checked?'SOURCE_METADATA_CHECKED':'NEEDS_MANUAL_REVIEW',checked?.checked||'',checked?.evidence||checked?.source||''].map(esc).join(',');
});
fs.mkdirSync('audits',{recursive:true});
fs.writeFileSync('audits/venue-photo-audit.csv',[header.map(esc).join(','),...rows].join('\n')+'\n');
assert.equal(rows.length,entries.length,'Audit row count must match catalogue');
const summary={venues:entries.length,photos_registered:licensed.length,photos_pending:entries.length-licensed.length,venue_reference_urls_missing:missingVenueReferences.length,venue_official_sites_manually_reviewed_in_this_audit:0,photo_license_claims_recorded:licensed.length,reuse_rights_independently_verified:0,source_metadata_manually_checked:manuallyChecked.size,generated_at:new Date().toISOString()};
fs.writeFileSync('audits/venue-photo-summary.json',JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary));
