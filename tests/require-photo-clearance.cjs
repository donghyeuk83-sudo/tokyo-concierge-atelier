// Guard new/changed licensed venue photographs against missing review records.
// Legacy photographs remain frozen as an existing snapshot, NOT deemed legally cleared.
// Any changed source/photo metadata or newly added ID needs its own documented review.
// Usage: node tests/require-photo-clearance.cjs
const fs=require('node:fs');
const assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const block=html.split('const LICENSED_VENUE_PHOTOS={')[1]?.split('};')[0];
assert(block,'Missing published photo registry');
const pattern=/^([a-z]\d+):\{url:"([^"]+)",source:"([^"]+)",credit:"([^"]+)",license:"([^"]+)",licenseUrl:"([^"]+)"\}/gm;
const photos=[...block.matchAll(pattern)].map(m=>({id:m[1],url:m[2],source:m[3],credit:m[4],license:m[5],licenseUrl:m[6]}));
assert.equal(photos.length,block.split('\n').filter(line=>/^[a-z]\d+:\{/.test(line)).length,'Registry has unparseable entries');
const baseline=JSON.parse(fs.readFileSync('audits/photo-registry-baseline.json','utf8')).entries;
const ledger=JSON.parse(fs.readFileSync('audits/photo-clearance-approvals.json','utf8')).approvals;
assert(Array.isArray(ledger),'Photo approvals must be an array');
const current=new Map(photos.map(({id,...metadata})=>[id,metadata]));
assert.equal(current.size,photos.length,'Duplicate image ID');
for(const id of Object.keys(baseline))assert(current.has(id),'Existing published image removed without review: '+id);
const approvals=new Map();
for(const record of ledger){
  assert(record&&typeof record.id==='string'&&!approvals.has(record.id),'Duplicate/invalid photo clearance approval');
  approvals.set(record.id,record);
}
let newOrChanged=0;
for(const [id,photo] of current){
  if(baseline[id]&&JSON.stringify(photo)===JSON.stringify(baseline[id]))continue;
  newOrChanged++;
  // Official operator lists Kimono Photo Studio WA in Meguro, while the venue catalogue says Asakusa.
  // Do not approve a photo against a misidentified location until the catalogue is reconciled.
  assert.notEqual(id,'a32','a32 studio area mismatch (Meguro vs Asakusa) must be resolved before photo publication');
  const review=approvals.get(id);
  assert(review,'New or replaced photo '+id+' needs approval record before publication');
  for(const key of ['url','source','credit','license','licenseUrl']){
    assert.equal(review[key],photo[key],'Approval metadata mismatch '+id+' '+key);
  }
  assert(/^https:\/\//.test(review.venueEvidenceUrl||''),'Missing exact venue/branch evidence URL: '+id);
  assert(/^https:\/\//.test(review.licenseEvidenceUrl||''),'Missing file-level rights evidence URL: '+id);
  assert(typeof review.venueIdentityExplanation==='string'&&review.venueIdentityExplanation.trim().length>=35,'Exact branch identity evidence too vague: '+id);
  assert(typeof review.rightsExplanation==='string'&&review.rightsExplanation.trim().length>=35,'Commercial reuse analysis too vague: '+id);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(review.reviewedOn||''),'Missing review date: '+id);
  assert(/^(CC0 1\.0|Public domain|CC BY(?:-SA|-ND)? (?:2\.0|2\.5|3\.0|4\.0))$/.test(photo.license),'Unapproved rights class '+id);
  assert(!/\bNC\b|\/by-nc/i.test(photo.license+' '+photo.licenseUrl),'Noncommercial image not allowed: '+id);
}
for(const id of approvals.keys())assert(current.has(id),'Orphaned clearance record '+id);
console.log('PASS photo clearance gate: existing registry '+Object.keys(baseline).length+', currently mapped '+current.size+', new/replaced '+newOrChanged+', documented approvals '+approvals.size);
