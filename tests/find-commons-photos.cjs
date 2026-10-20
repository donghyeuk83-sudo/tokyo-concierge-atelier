// Find Commons photo candidates for all catalog venues without publishing unverified images.
// Runs in GitHub Actions. Wikimedia API metadata is not a substitute for visual venue matching.
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const data=html.split('const DATA=[')[1]?.split('].map(')[0];
if(!data)throw Error('Catalog missing');
const venues=[...data.matchAll(/^\[("(?:[^"\\]|\\.)*"(?:,\s*"(?:[^"\\]|\\.)*"){6})\],?$/gm)].map(m=>JSON.parse('['+m[1]+']'));
const registry=html.split('const LICENSED_VENUE_PHOTOS={')[1]?.split('};')[0]||'';
const registered=new Set([...registry.matchAll(/^([a-z]\d+):\{/gm)].map(m=>m[1]));
const esc=s=>'"'+String(s??'').replace(/"/g,'""')+'"';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// Only CC0, CC BY, or CC BY-SA are accepted for commercial photo review.
// Excludes CC BY-NC, CC BY-ND, public-domain tags not explicitly requested, and missing license labels.
const eligibleLicense=v=>/^CC0(?:[ -]+\d+(?:\.\d+)?)?$|^CC BY(?:-SA)?(?:[ -]+\d+(?:\.\d+)?)?$/i.test(String(v||'').trim());
// Recheck the seven previously rate-limited venues before exhausting Commons quotas.
const PRIORITY_RETRY_IDS=['r33','r36','r37','r50','r51','a34','a37'];
const priority=new Set(PRIORITY_RETRY_IDS);
async function queryCommons(query,retryOn429){
 const api=new URL('https://commons.wikimedia.org/w/api.php');
 for(const [k,val] of Object.entries({action:'query',generator:'search',gsrsearch:'filetype:bitmap '+query,gsrnamespace:'6',gsrlimit:'5',prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'900',format:'json',origin:'*'}))api.searchParams.set(k,val);
 // One request only. A 429 triggers a run-wide circuit breaker below.
 const attempts=1;
 for(let attempt=0;attempt<attempts;attempt++){
  try{
   const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),20000);
   let response;
   try{response=await fetch(api,{signal:controller.signal,headers:{'user-agent':'TokyoConciergeAtelierPhotoResearch/1.1 (github.com/donghyeuk83-sudo/tokyo-concierge-atelier)'}})}
   finally{clearTimeout(timer)}
   if(response.status===429){
    return {status:'RATE_LIMITED_RETRY_LATER',candidates:[],error:'Wikimedia HTTP 429; stop this research run'};
   }
   if(!response.ok)return {status:'API_HTTP_'+response.status,candidates:[]};
   const json=await response.json();
   const pages=Object.values(json.query?.pages||{});
   const candidates=pages.map(p=>{const i=p.imageinfo?.[0]||{},m=i.extmetadata||{};return{file:p.title,source:i.descriptionurl||'',thumb:i.thumburl||'',license:m.LicenseShortName?.value||'',license_url:m.LicenseUrl?.value||'',artist_html:m.Artist?.value||'',restrictions:m.Restrictions?.value||'',description_html:m.ImageDescription?.value||'',attribution_required:m.AttributionRequired?.value||''}})
    .filter(p=>p.thumb&&p.source&&eligibleLicense(p.license))
    .map(p=>({...p,venue_match:'UNVERIFIED',reuse_approved:false}));
   return {status:candidates.length?'CANDIDATES_REQUIRE_REVIEW':'NO_ELIGIBLE_CANDIDATE_FOUND',candidates};
  }catch(e){return {status:'SEARCH_ERROR',candidates:[],error:String(e).slice(0,120)}}
 }
 return {status:'RATE_LIMITED_RETRY_LATER',candidates:[]};
}
async function search(v){
 const [id,category,name,nameJa,area]=v;
 if(registered.has(id))return {id,name,area,status:'REGISTERED',candidate_count:0};
 const englishQuery=category==='restaurant'?name+' Tokyo':name+' '+area+' Tokyo';
 // Add original Japanese venue spelling only for the seven previously throttled venues.
 const queries=[englishQuery,...(priority.has(id)&&nameJa?[nameJa+' '+area+' 東京']:[])];
 let candidates=[],status='NO_ELIGIBLE_CANDIDATE_FOUND';
 for(const q of queries){
  const result=await queryCommons(q,priority.has(id));
  status=result.status;
  if(result.candidates?.length){
   const existing=new Set(candidates.map(x=>x.file));
   for(const v of result.candidates)if(!existing.has(v.file))candidates.push(v);
  }
  if(status!=='NO_ELIGIBLE_CANDIDATE_FOUND'&&status!=='CANDIDATES_REQUIRE_REVIEW')break;
 }
 return{id,name,area,status:candidates.length?'CANDIDATES_REQUIRE_REVIEW':status,
  candidate_count:candidates.length,...(candidates.length?{candidates}:{}),
  ...(priority.has(id)?{priority_retry:true,queries_attempted:queries.length}:{})};
}
(async()=>{
 const results=[];
 // Seven prior rate-limit cases run first, then 35 other missing locations; do not re-query 89 approved photos.
 const ordered=[...venues].sort((a,b)=>{
  const rank=v=>priority.has(v[0])?0:registered.has(v[0])?2:1;
  return rank(a)-rank(b);
 });
 let pauseForRateLimit=false;
 for(let i=0;i<ordered.length;i++){
  const v=ordered[i];
  if(pauseForRateLimit&&!registered.has(v[0])){
   results.push({id:v[0],name:v[2],area:v[4],status:'DEFERRED_API_RATE_LIMIT',candidate_count:0,reason:'API requested fewer queries after Wikimedia 429'});
  }else{
   const record=await search(v);
   results.push(record);
   // Respect Wikimedia's 429. Do not turn deferred queries into "no eligible file" claims.
   if(record.status==='RATE_LIMITED_RETRY_LATER')pauseForRateLimit=true;
  }
  if(i%10===0)console.log('Photo candidates checked',i+1,'/',ordered.length);
  // Throttle only actual queries for the 42 unphotographed venues; no throttling once paused.
  if(!pauseForRateLimit&&!registered.has(v[0]))await sleep(2500);
 }
 // Keep the legacy catalogue order in the CSV/JSON even when the seven searches run first.
 const orderIndex=new Map(venues.map((v,i)=>[v[0],i]));
 results.sort((a,b)=>orderIndex.get(a.id)-orderIndex.get(b.id));
 fs.mkdirSync('audits',{recursive:true});
 fs.writeFileSync('audits/commons-photo-candidates.json',JSON.stringify({generated_at:new Date().toISOString(),warning:'Candidates are NOT verified venue photographs and MUST NOT be automatically published. Review actual image, exact branch/location, author, license and restrictions.',venues:results},null,2)+'\n');
 const rows=[['id','name','area','status','candidate_count','first_candidate_file','first_candidate_source','first_candidate_license'],...results.map(r=>[r.id,r.name,r.area,r.status,r.candidate_count,r.candidates?.[0]?.file||'',r.candidates?.[0]?.source||'',r.candidates?.[0]?.license||''])];
 fs.writeFileSync('audits/commons-photo-candidates.csv',rows.map(r=>r.map(esc).join(',')).join('\n')+'\n');
 const counts={};for(const r of results)counts[r.status]=(counts[r.status]||0)+1;
 console.log('COMMONS_CANDIDATE_SUMMARY',JSON.stringify({...counts,pending_checked:venues.length-registered.size,registered_untouched:registered.size,publication_approvals:0}));
})().catch(e=>{console.error(e);process.exit(1)});
