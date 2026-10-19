// Verify research leads are not accidentally treated as file-level photo grants.
// This audit is deliberately NOT proof of copyright ownership or image clearance.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const csv=path=>fs.readFileSync(path,'utf8').trim().split(/\r?\n/).map(line=>[...line.matchAll(/"((?:[^"]|"")*)"(?:,|$)/g)].map(m=>m[1].replace(/""/g,'"')));
const [candidateCols,...candidates]=csv('audits/photo-original-candidate-decisions-2026-10-19.csv');
const [pageCols,...pages]=csv('audits/photo-source-page-leads-32-2026-10-19.csv');
const [contactCols,...contacts]=csv('audits/photo-permission-outreach-2026-10-19.csv');
const [rightsCols,...rights]=csv('audits/photo-rightsholder-routing-2026-10-19.csv');
const col=h=>Object.fromEntries(h.map((name,index)=>[name,index]));
const ci=col(candidateCols),pi=col(pageCols),oi=col(contactCols),ri=col(rightsCols);
assert.equal(candidates.length,48);
assert.equal(contacts.length,48);
assert.equal(rights.length,48);
const unresolvedIds=candidates.filter(row=>!row[ci.original_candidate_url]).map(row=>row[ci.id]);
assert.equal(unresolvedIds.length,32,'Update research lead batch if existing original candidate tally changed');
assert.deepEqual(pages.map(row=>row[pi.id]),unresolvedIds,'All 32 original-file-unknown venues must be screened once in order');
assert.deepEqual(rights.map(row=>row[ri.id]),contacts.map(row=>row[oi.id]),'All 48 venue-rights routing entries must be in the same order');
const count=pages.filter(row=>row[pi.candidate_page_url]).length;
assert(count>=17,'Known source-page leads lost');
for(const row of pages){
 const id=row[pi.id];
 assert.equal(row[pi.original_image_file_url],'','Original photo not independently verified: '+id);
 assert.equal(row[pi.file_level_commercial_license],'NOT_VERIFIED','No CC/owner commercial license proved: '+id);
 assert.equal(row[pi.original_photographer_verified],'NO','Photo author identity cannot be assumed: '+id);
 assert.equal(row[pi.publication_status],'DO_NOT_PUBLISH','Unlicensed photo publication prohibited: '+id);
 if(row[pi.candidate_page_url])assert(/^https:\/\//.test(row[pi.candidate_page_url]),'Unsafe source lead '+id);
}
for(let i=0;i<rights.length;i++){
 const row=rights[i],contact=contacts[i],id=row[ri.id];
 assert.equal(row[ri.operator_contact_route],contact[oi.contact_route],'Route diverged: '+id);
 assert.equal(row[ri.operator_contact_evidence],contact[oi.contact_evidence_url],'Contact evidence diverged: '+id);
 assert.equal(row[ri.copyright_owner_identified],'NO','Rights-holder verification needs explicit evidence before changing this audit: '+id);
 assert.equal(row[ri.written_commercial_web_grant],'NO','No written hotel commercial rights grant obtained: '+id);
 assert.equal(row[ri.rights_clearance_status],'NOT_CLEARED','Contact route is not permission to republish: '+id);
}
const nagatacho=rights.find(row=>row[ri.id]==='r52');
assert(nagatacho,'Missing Nagatacho Ouka rights investigation');
assert.equal(nagatacho[ri.operator_contact_route],'','Do not invent a public owner/phone for invitation-only Nagatacho Ouka');
assert(/株式会社月下/.test(nagatacho[ri.potential_successor_legal_lead]),'Corporate merger lead missing');
const cleared=JSON.parse(fs.readFileSync('audits/photo-clearance-approvals.json','utf8')).approvals;
assert.deepEqual(cleared.map(x=>x.id).sort(),['r32','r34'],'Only the two evidenced building-exterior files are approved in this batch');
assert(cleared.every(x=>x.license==='CC0 1.0'||x.license==='CC BY 4.0'),'All added photos require commercially reusable CC');
console.log('PASS photo source/rights audit: '+pages.length+' legacy lead rows; '+count+' old source-page leads; '+rights.length+' historical rights-route records; '+cleared.length+' new file-specific CC grants recorded in the live approval ledger');
