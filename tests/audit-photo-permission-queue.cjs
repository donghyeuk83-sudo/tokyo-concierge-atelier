// Keep the photo permission queue complete and distinct from publication approvals.
// Neither an official contact nor a CC search result is proof of image reuse rights.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const parse=filename=>fs.readFileSync(filename,'utf8').trim().split(/\r?\n/).map(line=>[...line.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)].map(x=>x[1].replace(/""/g,'"')));
const source=parse('audits/missing-photo-queue.csv');
const review=parse('audits/photo-permission-outreach-2026-10-19.csv');
const [a,...queued]=source,[b,...items]=review;
const ids=queued.map(row=>row[0]),actual=items.map(row=>row[0]);
// 48 rows are an archival investigation snapshot. The LIVE pending queue shrinks
// as properly licensed images are approved; never throw away earlier rejected files.
const activeApprovals=JSON.parse(fs.readFileSync('audits/photo-clearance-approvals.json','utf8')).approvals;
const approvedIds=new Set(activeApprovals.map(item=>item.id));
assert.equal(actual.length,48,'Historic 48-item outreach coverage must remain intact');
assert.equal(new Set(actual).size,48,'Duplicate historic contact review');
assert.equal(approvedIds.size,activeApprovals.length,'Duplicate licensed image approvals');
assert.equal(ids.length+approvedIds.size,48,'Pending catalogue and newly approved photos must cover all original 48 IDs');
assert.deepEqual(ids,actual.filter(id=>!approvedIds.has(id)),'Live queue must exclude only individually approved images');
assert.deepEqual([...approvedIds].sort(),['r32','r34'],'Approved building photos changed; review and update this protection');
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
console.log('PASS contact queue: '+ids.length+' live pending; '+items.length+' historical inquiry records; '+count+' contact routes (some platform-hosted); '+approvedIds.size+' CC photo approvals; zero individually obtained written permissions');


const sourceCandidates=parse('audits/photo-original-candidate-decisions-2026-10-19.csv');
const [candidateHeader,...candidateRows]=sourceCandidates;
const candidateCols=Object.fromEntries(candidateHeader.map((key,index)=>[key,index]));
assert.deepEqual(candidateRows.map(row=>row[candidateCols.id]),ids,'Original photo decisions must match all 48 pending venue IDs');
for(const row of candidateRows){
  const id=row[candidateCols.id];
  assert.equal(row[candidateCols.publication_status],'DO_NOT_PUBLISH','Cannot publish unapproved candidate: '+id);
  assert(row[candidateCols.candidate_disposition]!=='APPROVED','Only explicit approval ledger + photo gate may clear a photo: '+id);
  if(row[candidateCols.original_candidate_url])assert(/^https:\/\//.test(row[candidateCols.original_candidate_url]),'Candidate must link original research source '+id);
}
console.log('PASS original-file screening queue: '+candidateRows.length+' venues; '+candidateRows.filter(row=>row[candidateCols.original_candidate_url]).length+' documented rejected candidate examples; no permissions presumed');
