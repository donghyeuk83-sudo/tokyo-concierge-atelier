// Non-destructive network check of the 131 venue reference links.
// A 403, bot challenge or timeout does not prove a venue is closed.
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const dataSection=html.split('const DATA=[')[1]?.split('].map(')[0];
if(!dataSection)throw Error('DATA section missing');
const venues=[...dataSection.matchAll(/^\[("(?:[^"\\]|\\.)*"(?:,\s*"(?:[^"\\]|\\.)*"){6})\],?$/gm)].map(m=>JSON.parse('['+m[1]+']'));
if(venues.length!==131)throw Error('Expected 131 venues, got '+venues.length);
const results=new Array(venues.length);
let cursor=0;
async function checkOne(v){
 const [id,category,name,nameJa,area,type,url]=v;
 const record={id,name,category,area,url,http_status:'',result:'',final_url:'',note:''};
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
   record.result=res.status===403||res.status===429?'ACCESS_RESTRICTED':'HTTP_ERROR';
   record.note='Manual venue review needed; not proof of closure';return record;
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
 const cols=['id','name','category','area','url','http_status','result','final_url','note'];
 fs.mkdirSync('audits',{recursive:true});
 fs.writeFileSync('audits/venue-link-check.csv',[cols.map(q).join(','),...results.map(r=>cols.map(k=>q(r[k])).join(','))].join('\n')+'\n');
 if(results.length!==venues.length||results.some(r=>!r||!r.id||!r.result))throw Error('Incomplete venue link audit');
 const counts={};for(const r of results)counts[r.result]=(counts[r.result]||0)+1;
 const review=results.filter(r=>r.result!=='HTTP_OK').map(r=>({id:r.id,name:r.name,result:r.result,http_status:r.http_status,url:r.url,note:r.note,priority:r.result==='HTTP_ERROR'?'HIGH':'MANUAL_REVIEW'}));
 if(Object.values(counts).reduce((a,b)=>a+b,0)!==venues.length||review.length!==venues.length-(counts.HTTP_OK||0))throw Error('Venue audit counts inconsistent');
 fs.writeFileSync('audits/venue-links-needing-review.json',JSON.stringify({total:review.length,items:review},null,2)+'\n');
 fs.writeFileSync('audits/venue-link-check-summary.json',JSON.stringify({total:results.length,counts,checked_at:new Date().toISOString(),disclaimer:'HTTP success is not proof of venue identity, business operation, prices or hours. HTTP errors are not proof of closure.'},null,2)+'\n');
 console.log('LINK_AUDIT_SUMMARY',JSON.stringify(counts));
})().catch(e=>{console.error(e);process.exit(1)});
