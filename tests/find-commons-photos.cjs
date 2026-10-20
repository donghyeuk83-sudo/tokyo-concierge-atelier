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
async function search(v){
 const [id,category,name,nameJa,area]=v;
 if(registered.has(id))return {id,name,area,status:'REGISTERED',candidate_count:0};
 const query=(category==='restaurant'?name+' Tokyo':name+' '+area+' Tokyo');
 const api=new URL('https://commons.wikimedia.org/w/api.php');
 for(const [k,val] of Object.entries({action:'query',generator:'search',gsrsearch:'filetype:bitmap '+query,gsrnamespace:'6',gsrlimit:'5',prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'900',format:'json',origin:'*'}))api.searchParams.set(k,val);
 try{
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),20000);
  let response;try{response=await fetch(api,{signal:controller.signal,headers:{'user-agent':'TokyoConciergeAtelierPhotoResearch/1.0 (github.com/donghyeuk83-sudo/tokyo-concierge-atelier)'}})}finally{clearTimeout(timer)}
  if(response.status===429){await sleep(12000);return{id,name,area,status:'RATE_LIMITED_RETRY_LATER',candidate_count:0}}
  if(!response.ok)return{id,name,area,status:'API_HTTP_'+response.status,candidate_count:0};
  const json=await response.json();
  const pages=Object.values(json.query?.pages||{});
  const candidates=pages.map(p=>{const i=p.imageinfo?.[0]||{},m=i.extmetadata||{};return{file:p.title,source:i.descriptionurl||'',thumb:i.thumburl||'',license:m.LicenseShortName?.value||'',license_url:m.LicenseUrl?.value||'',artist_html:m.Artist?.value||'',restrictions:m.Restrictions?.value||'',description_html:m.ImageDescription?.value||'',attribution_required:m.AttributionRequired?.value||''}})
    .filter(p=>p.thumb&&p.source&&eligibleLicense(p.license))
    .map(p=>({...p,venue_match:'UNVERIFIED',reuse_approved:false}));
  return{id,name,area,status:candidates.length?'CANDIDATES_REQUIRE_REVIEW':'NO_ELIGIBLE_CANDIDATE_FOUND',candidate_count:candidates.length,candidates};
 }catch(e){return{id,name,area,status:'SEARCH_ERROR',candidate_count:0,error:String(e).slice(0,120)}}
}
(async()=>{
 const results=[];
 for(let i=0;i<venues.length;i++){
  const v=venues[i];results.push(await search(v));
  if(i%10===0)console.log('Photo candidates checked',i+1,'/',venues.length);
  // Skip throttling registered locations: network queries are only needed for the missing 42.
  if(!registered.has(v[0]))await sleep(2500);
 }
 fs.mkdirSync('audits',{recursive:true});
 fs.writeFileSync('audits/commons-photo-candidates.json',JSON.stringify({generated_at:new Date().toISOString(),warning:'Candidates are NOT verified venue photographs and MUST NOT be automatically published. Review actual image, exact branch/location, author, license and restrictions.',venues:results},null,2)+'\n');
 const rows=[['id','name','area','status','candidate_count','first_candidate_file','first_candidate_source','first_candidate_license'],...results.map(r=>[r.id,r.name,r.area,r.status,r.candidate_count,r.candidates?.[0]?.file||'',r.candidates?.[0]?.source||'',r.candidates?.[0]?.license||''])];
 fs.writeFileSync('audits/commons-photo-candidates.csv',rows.map(r=>r.map(esc).join(',')).join('\n')+'\n');
 const counts={};for(const r of results)counts[r.status]=(counts[r.status]||0)+1;
 console.log('COMMONS_CANDIDATE_SUMMARY',JSON.stringify({...counts,pending_checked:venues.length-registered.size,registered_untouched:registered.size,publication_approvals:0}));
})().catch(e=>{console.error(e);process.exit(1)});
