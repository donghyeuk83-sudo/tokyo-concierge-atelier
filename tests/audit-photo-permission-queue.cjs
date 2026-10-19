// Keep the photo permission queue complete and distinct from publication approvals.
// Neither an official contact nor a CC search result is proof of image reuse rights.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const parse=filename=>fs.readFileSync(filename,'utf8').trim().split(/\r?\n/).map(line=>[...line.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)].map(x=>x[1].replace(/""/g,'"')));
const source=parse('audits/missing-photo-queue.csv');
const review=parse('audits/photo-permission-outreach-2026-10-19.csv');
const [a,...queued]=source,[b,...items]=review;
const ids=queued.map(row=>row[0]),actual=items.map(row=>row[0]);
assert.equal(queued.length,48,'48-venue photo queue changed, update contact research');
assert.deepEqual(actual,ids,'Contact review must cover all and only the queued IDs in the same order');
assert.equal(new Set(actual).size,48,'Duplicate contact review');
const idx=Object.fromEntries(b.map((k,i)=>[k,i]));
for(const row of items){
 const id=row[idx.id],status=row[idx.contact_review_status],contact=row[idx.contact_route],evidence=row[idx.contact_evidence_url];
 assert(row[idx.photo_permission_status]==='NO_EXPLICIT_LICENSE_OR_PERMISSION','Do not treat inquiry channels as photo permissions: '+id);
 if(status==='OFFICIAL_CONTACT_VERIFIED'){
   assert(contact,'Missing verified contact route for '+id);
   assert(/^https:\/\//.test(evidence),'Missing verified contact provenance: '+id);
 }else{
   assert(status==='CONTACT_NOT_YET_VERIFIED'||status==='HISTORIC_CLOSED_DO_NOT_PROMOTE','Unknown review state for '+id);
   assert(!contact&&!evidence,'Do not invent contact details for '+id);
 }
}
const count=items.filter(row=>row[idx.contact_review_status]==='OFFICIAL_CONTACT_VERIFIED').length;
assert(count>=46,'The 46 evidenced business/contact paths must not regress');
assert.equal(items.filter(row=>row[idx.contact_review_status]==='CONTACT_NOT_YET_VERIFIED').length,1,'Only invitation-only r52 remains unresolved');
assert.equal(items.find(row=>row[idx.id]==='r52')[idx.contact_review_status],'CONTACT_NOT_YET_VERIFIED','Do not invent a public Nagatacho Ouka contact');
assert.equal(items.filter(row=>row[idx.contact_review_status]==='HISTORIC_CLOSED_DO_NOT_PROMOTE').length,1,'Closed historical branch must remain separate');
console.log('PASS contact queue: '+items.length+' photo-pending venues; '+count+' evidenced direct business/inquiry routes (some platform-hosted); zero granted image permissions');
