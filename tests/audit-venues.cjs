// Generate a conservative 131-venue photo/source audit. No guessed rights or images.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const dataSection=html.split('const DATA=[')[1]?.split('].map(')[0];
assert(dataSection,'DATA catalog section missing');
const entries=[...dataSection.matchAll(/^\[("(?:[^"\\]|\\.)*"(?:,\s*"(?:[^"\\]|\\.)*"){6})\],?$/gm)]
 .map(m=>JSON.parse('['+m[1]+']'));
assert.equal(entries.length,131,'Expected exactly 131 venue records');
const ids=entries.map(x=>x[0]);
assert.equal(new Set(ids).size,131,'Duplicate venue ID');
const licensedSection=html.split('const LICENSED_VENUE_PHOTOS={')[1]?.split('};')[0];
assert(licensedSection,'Licensed photos registry missing');
const licensed=[...licensedSection.matchAll(/^([a-z]\d+):\{url:"([^"]+)",source:"([^"]+)",credit:"([^"]+)",license:"([^"]+)",licenseUrl:"([^"]+)"\}/gm)]
 .map(m=>({id:m[1],url:m[2],source:m[3],credit:m[4],license:m[5],licenseUrl:m[6]}));
assert.equal(new Set(licensed.map(x=>x.id)).size,licensed.length,'Duplicate licensed image ID');
for(const p of licensed){assert(ids.includes(p.id),'Unknown image ID: '+p.id);assert(p.url.startsWith('https://'),'Image URL not HTTPS');assert(p.source.startsWith('https://'),'Source URL not HTTPS');assert(p.credit.trim(),'Missing photographer');assert(p.licenseUrl.startsWith('https://creativecommons.org/'),'Missing CC license');}
const photos=new Map(licensed.map(p=>[p.id,p]));
const esc=s=>'"'+String(s??'').replace(/"/g,'""')+'"';
const header=['id','category','name_en','name_ja','area','type','venue_reference_url','photo_status','image_url','image_source_url','photographer','license','license_url','venue_official_site_review','image_venue_match_review','reuse_rights_review'];
const rows=entries.map(([id,category,name,nameJa,area,type,url])=>{
 const p=photos.get(id);
 return [id,category,name,nameJa,area,type,url,p?'PHOTO_REGISTERED':'PHOTO_NOT_YET_VERIFIED',p?.url||'',p?.source||'',p?.credit||'',p?.license||'',p?.licenseUrl||'','NEEDS_MANUAL_REVIEW',p?'REGISTERED_IMAGE_NEEDS_VISUAL_REVIEW':'NOT_REVIEWED',p?'CC_LICENSE_RECORDED':'NOT_REVIEWED'].map(esc).join(',');
});
fs.mkdirSync('audits',{recursive:true});
fs.writeFileSync('audits/venue-photo-audit.csv',[header.map(esc).join(','),...rows].join('\n')+'\n');
const summary={venues:entries.length,photos_registered:licensed.length,photos_pending:entries.length-licensed.length,venue_official_sites_manually_reviewed_in_this_audit:0,photo_license_records:licensed.length,generated_at:new Date().toISOString()};
fs.writeFileSync('audits/venue-photo-summary.json',JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary));
