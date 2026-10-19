// Batch Wikimedia Commons image candidate discovery for all missing venues.
// Run: node scripts/find-photo-candidates.mjs
// Candidates are NOT licensed/venue-verified and must never auto-publish.
import fs from 'node:fs/promises';
const csv = await fs.readFile('audits/missing-photo-queue.csv','utf8');
const rows = csv.trim().split(/\r?\n/).slice(1).map(line => {
  const cells=[...line.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)].map(m=>m[1].replace(/""/g,'"'));
  return {id:cells[0],category:cells[1],en:cells[2],ja:cells[3],area:cells[4]};
});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function lookup(q){
 const u=new URL('https://commons.wikimedia.org/w/api.php');
 for(const [k,v] of Object.entries({action:'query',generator:'search',gsrsearch:'filetype:bitmap '+q,gsrnamespace:'6',gsrlimit:'8',prop:'imageinfo',iiprop:'url|extmetadata',format:'json',origin:'*'}))u.searchParams.set(k,v);
 for(let attempt=0;attempt<3;attempt++){
  try{
   const res=await fetch(u,{headers:{'User-Agent':'TokyoConciergeAtelierPhotoAudit/1.0 (source verification; no publishing)'}});
   if(!res.ok)throw Error('HTTP '+res.status);
   const j=await res.json();
   return Object.values(j.query?.pages||{}).map(p=>{
    const i=p.imageinfo?.[0]||{},m=i.extmetadata||{};
    const value=k=>(m[k]?.value||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
    return {file:p.title,url:i.descriptionurl||'',image:i.url||'',artist:value('Artist'),license:value('LicenseShortName'),licenseUrl:value('LicenseUrl'),credit:value('Credit')};
   });
  }catch(e){if(attempt===2)return [{error:String(e)}];await sleep(500*(attempt+1));}
 }
}
const out=[];
for(const v of rows){
 const queries=[v.ja+' '+v.area,v.en+' Tokyo'];
 const results=[];
 for(const q of queries){results.push(...await lookup(q));await sleep(120);}
 const unique=[...new Map(results.filter(x=>x.file).map(x=>[x.file,x])).values()];
 out.push({...v,queries,candidates:unique,status:'UNVERIFIED_REQUIRES_HUMAN_VENUE_AND_LICENSE_REVIEW'});
 console.log(v.id+' '+v.en+': '+unique.length+' candidates');
}
await fs.mkdir('audits',{recursive:true});
await fs.writeFile('audits/commons-photo-candidates.json',JSON.stringify({generatedAt:new Date().toISOString(),warning:'Search results are NOT evidence of venue identity or image reuse permission.',venues:out},null,2)+'\n');
console.log('Saved audits/commons-photo-candidates.json');
