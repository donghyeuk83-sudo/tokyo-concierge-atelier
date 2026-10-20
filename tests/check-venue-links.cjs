// Non-destructive network check of the 131 venue reference links.
// A 403, bot challenge or timeout does not prove a venue is closed.
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const dataSection=html.split('const DATA=[')[1]?.split('].map(')[0];
if(!dataSection)throw Error('DATA section missing');
const venues=[...dataSection.matchAll(/^\[("(?:[^"\\]|\\.)*"(?:,\s*"(?:[^"\\]|\\.)*"){6})\],?$/gm)].map(m=>JSON.parse('['+m[1]+']'));
if(venues.length!==131)throw Error('Expected 131 venues, got '+venues.length);
// Audit the actual guest-visible URL, which prefers a manually reviewed source
// over the original catalogue link. Keep both URLs for human review.
const reviewStart=html.indexOf('const VERIFIED_SOURCES=');
const reviewEnd=html.indexOf('const LICENSED_VENUE_PHOTOS=',reviewStart);
if(reviewStart<0||reviewEnd<reviewStart)throw Error('Verified venue sources block missing');
const sourceMatches=[...html.slice(reviewStart,reviewEnd).matchAll(/(?:^|\n)([a-z]\d+):\{url:"(https:[^"]+)",checked:"(\d{4}-\d{2}-\d{2})"/gm)];
const reviewedUrls=new Map(sourceMatches.map(m=>[m[1],m[2]]));
if(reviewedUrls.size<120)throw Error('Unexpected verified-source coverage: '+reviewedUrls.size);
const results=new Array(venues.length);
let cursor=0;
async function checkOne(v){
 const [id,category,name,nameJa,area,type,reference_url]=v;
 const url=reviewedUrls.get(id)||reference_url;
 const record={id,name,category,area,url,reference_url,reviewed_url_used:String(url!==reference_url),http_status:'',result:'',final_url:'',note:''};
 if(!url){record.result='MISSING';return record}
 for(let attempt=0;attempt<2;attempt++){
  const method=attempt===0?'HEAD':'GET';
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),12000);
  try{
   const res=await fetch(url,{method,redirect:'follow',signal:controller.signal,headers:{'user-agent':'TokyoConciergeAtelierLinkAudit/1.0 (non-commercial verification)','accept':'text/html,*/*'}});
   record.http_status=String(res.status);record.final_url=res.url;
   if(res.ok){record.result='HTTP_OK';record.note='Link responds; venue identity and current operations NOT verified';return record}
   if(attempt===0)continue; // HEAD may return misleading 4xx/5xx; verify with GET before classification.
   record.result=res.status===403||res.status===429?'ACCESS_RESTRICTED':res.status>=500?'UPSTREAM_UNAVAILABLE':'HTTP_ERROR';
   record.note=res.status>=500?'Upstream provider/server unavailable at check time; retry manually, NOT proof of closure':'Manual venue review needed; not proof of closure';return record;
  }catch(e){
   record.note=String(e?.name==='AbortError'?'TIMEOUT':e?.message||e).slice(0,180);
   if(attempt===0)continue;
   record.result='NETWORK_ERROR';return record;
  }finally{clearTimeout(timer)}
 }
 return record;
}
async function worker(){while(cursor<venues.length){const i=cursor++;results[i]=await checkOne(venues[i]);console.log(results[i].id,results[i].result,results[i].http_status)}}
(async()=>{
 await Promise.all(Array.from({length:5},worker));
 const q=s=>'"'+String(s??'').replace(/"/g,'""')+'"';
 const cols=['id','name','category','area','url','reference_url','reviewed_url_used','http_status','result','final_url','note'];
 fs.mkdirSync('audits',{recursive:true});
 fs.writeFileSync('audits/venue-link-check.csv',[cols.map(q).join(','),...results.map(r=>cols.map(k=>q(r[k])).join(','))].join('\n')+'\n');
 if(results.length!==venues.length||results.some(r=>!r||!r.id||!r.result))throw Error('Incomplete venue link audit');
 const counts={};for(const r of results)counts[r.result]=(counts[r.result]||0)+1;
 const review=results.filter(r=>r.result!=='HTTP_OK').map(r=>({id:r.id,name:r.name,result:r.result,http_status:r.http_status,url:r.url,reference_url:r.reference_url,note:r.note,priority:r.result==='HTTP_ERROR'?'HIGH':'MANUAL_REVIEW'}));
 if(Object.values(counts).reduce((a,b)=>a+b,0)!==venues.length||review.length!==venues.length-(counts.HTTP_OK||0))throw Error('Venue audit counts inconsistent');
 fs.writeFileSync('audits/venue-links-needing-review.json',JSON.stringify({total:review.length,items:review},null,2)+'\n');
 fs.writeFileSync('audits/venue-link-check-summary.json',JSON.stringify({total:results.length,reviewed_url_overrides:results.filter(r=>r.reviewed_url_used==='true').length,counts,checked_at:new Date().toISOString(),disclaimer:'Checks the actual source link shown to guests, with original catalogue URL separately retained. HTTP success does not prove venue identity or operations; 403/429 and transient 5xx do not prove closure.'},null,2)+'\n');
 console.log('LINK_AUDIT_SUMMARY',JSON.stringify(counts));
})().catch(e=>{console.error(e);process.exit(1)});
