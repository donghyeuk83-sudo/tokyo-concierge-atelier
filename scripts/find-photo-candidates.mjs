// Conservative Wikimedia Commons candidate discovery for currently unphotographed venues.
// This file only generates a research artifact. It NEVER publishes image assets.
// Usage: node scripts/find-photo-candidates.mjs
import fs from 'node:fs/promises';

const csv=await fs.readFile('audits/missing-photo-queue.csv','utf8');
const rows=csv.trim().split(/\r?\n/).slice(1).map(line=>{
  const cells=[...line.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)].map(m=>m[1].replace(/""/g,'"'));
  if(cells.length!==8)throw Error('Malformed missing-photo queue CSV row: '+line);
  return {id:cells[0],category:cells[1],en:cells[2],ja:cells[3],area:cells[4]};
});
// Derive the live missing-photo ID list from the actual site. It shrinks as cleared
// exact-site images are added, unlike the dated historical 48-venue research sheets.
const html=await fs.readFile('index.html','utf8');
const catalogue=html.split('const DATA=[')[1]?.split('].map(')[0];
const published=html.split('const LICENSED_VENUE_PHOTOS={')[1]?.split('};')[0];
if(!catalogue||!published)throw Error('Cannot locate actual venue/photo catalog');
const venueIds=[...catalogue.matchAll(/^\["([a-z]\d+)","(?:restaurant|attraction|shopping|wellness|transport)"/gm)].map(m=>m[1]);
const photoIds=new Set([...published.matchAll(/^([a-z]\d+):\{/gm)].map(m=>m[1]));
if(venueIds.length!==131)throw Error('Unexpected catalogue size');
const expectedIds=venueIds.filter(id=>!photoIds.has(id));
if(rows.length!==expectedIds.length||rows.some((v,i)=>v.id!==expectedIds[i])||new Set(rows.map(v=>v.id)).size!==rows.length)
  throw Error('Missing-photo queue disagrees with live site. Run node tests/photo-queue.cjs first.');

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const minIntervalMs=Number(process.env.COMMONS_REQUEST_INTERVAL_MS||8000);
if(!Number.isFinite(minIntervalMs)||minIntervalMs<6000)
  throw Error('COMMONS_REQUEST_INTERVAL_MS must be at least 6000');
let lastRequest=0;
let cooldownUntil=0;
let requestCount=0;
const allowedLicense=/^(CC0|CC BY(?:-SA|-ND)?(?: 2\.0| 2\.5| 3\.0| 4\.0)|Public domain)/i;
const rasterPhoto=/\.(?:jpe?g|png|webp)$/i;

async function pacedRequest(url){
  const due=Math.max(lastRequest+minIntervalMs,cooldownUntil);
  if(due>Date.now())await sleep(due-Date.now());
  lastRequest=Date.now();requestCount++;
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),20000);
  try{
    return await fetch(url,{signal:controller.signal,headers:{
      'User-Agent':'TokyoConciergeAtelierPhotoAudit/1.1 (research only; no publishing)',
      'Accept':'application/json'
    }});
  }finally{clearTimeout(timeout);}
}
async function lookup(query){
  const u=new URL('https://commons.wikimedia.org/w/api.php');
  for(const [k,v] of Object.entries({
    action:'query',generator:'search',gsrsearch:query,
    gsrnamespace:'6',gsrlimit:'8',prop:'imageinfo',
    iiprop:'url|mime|extmetadata',format:'json',formatversion:'2'
  }))u.searchParams.set(k,v);

  for(let attempt=1;attempt<=4;attempt++){
    try{
      const res=await pacedRequest(u);
      if(res.status===429||res.status===503){
        const header=Number(res.headers.get('retry-after'));
        const cooldown=Math.min(120000,Math.max(
          Number.isFinite(header)&&header>0?header*1000:0,
          Math.min(120000,15000*attempt)
        ));
        cooldownUntil=Math.max(cooldownUntil,Date.now()+cooldown);
        if(attempt===4)return {error:'HTTP '+res.status+' (rate limited after 4 attempts)',candidates:[]};
        console.warn('Commons HTTP '+res.status+'; waiting '+Math.ceil(cooldown/1000)+'s before retry '+attempt+'/4');
        continue;
      }
      if(!res.ok)return {error:'HTTP '+res.status,candidates:[]};
      const json=await res.json();
      if(json.error)return {error:'Commons API: '+(json.error.code||'unknown'),candidates:[]};
      const pages=json.query?.pages||[];
      const candidates=pages.flatMap(p=>{
        const info=p.imageinfo?.[0]||{},meta=info.extmetadata||{};
        const get=k=>(meta[k]?.value||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
        const photo={
          file:p.title,url:info.descriptionurl||'',image:info.url||'',
          artist:get('Artist'),license:get('LicenseShortName'),
          licenseUrl:get('LicenseUrl'),credit:get('Credit'),
          mime:info.mime||'',
          rightsCandidate:allowedLicense.test(get('LicenseShortName'))&&!/\bNC\b|\/by-nc/i.test(get('LicenseShortName')+' '+get('LicenseUrl'))
        };
        // Search often retrieves unrelated PDFs and GIFs; only plausible still photos
        // belong in the review queue. Identity itself must be checked by a person.
        if(!rasterPhoto.test(photo.file)||!photo.image||!photo.url)return [];
        return [photo];
      });
      return {error:null,candidates};
    }catch(e){
      if(attempt===4)return {error:String(e),candidates:[]};
      cooldownUntil=Math.max(cooldownUntil,Date.now()+Math.min(30000,5000*attempt));
    }
  }
}

const venues=[];
let failed=0;
const researchDeadline=Date.now()+18*60*1000;
for(const venue of rows){
  // A quoted, venue-specific phrase produces fewer generic book/PDF matches
  // than three broad searches. It is a screening query, NOT exhaustive coverage.
  const label=venue.ja.length>3?venue.ja:venue.en;
  const query='"'+label.replace(/"/g,'')+'"';
  const result=Date.now()<researchDeadline?await lookup(query):
    {error:'Search skipped: Commons request budget exceeded',candidates:[]};
  if(result.error)failed++;
  const candidates=[...new Map(result.candidates.map(p=>[p.file,p])).values()];
  venues.push({...venue,query,error:result.error,candidates,
    status:result.error?'SEARCH_FAILED_NOT_A_NEGATIVE_PHOTO_FINDING':
      'UNVERIFIED_REQUIRES_EXACT_VENUE_AND_FILE_LICENSE_REVIEW'});
  console.log(venue.id+' '+venue.en+': '+candidates.length+' still-image candidates'+(result.error?' (ERROR '+result.error+')':''));
}
const output={generatedAt:new Date().toISOString(),
  warning:'Search results are never permission to reuse an image. Exact branch, original file license and visual identity require manual verification. No images are published by this job.',
  coverage:{venuesRequested:rows.length,venuesSearched:rows.length-failed,searchFailures:failed,apiRequests:requestCount,method:'single quoted name query per venue; non-exhaustive'},
  venues};
await fs.mkdir('audits',{recursive:true});
await fs.writeFile('audits/commons-photo-candidates.json',JSON.stringify(output,null,2)+'\n');
console.log('Saved audits/commons-photo-candidates.json');
console.log('Research coverage: '+JSON.stringify(output.coverage));
if(failed){console.error('Commons API failures: '+failed+'; those venues remain UNSEARCHED, not photo-free');process.exitCode=1;}
