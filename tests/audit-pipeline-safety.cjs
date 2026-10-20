// Regression gate for background workflows and venue-specific AI concept semantics.
// Enforce review-only creation: image and metadata edits must enter main through a reviewed PR.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const manual=[
 '.github/workflows/generate-venue-ai-images.yml',
 '.github/workflows/map-uploaded-ai-concepts.yml',
 '.github/workflows/publish-ai-raster.yml',
 '.github/workflows/photo-candidate-research.yml'
];
for(const path of manual){
 const content=read(path);
 assert(content.includes('workflow_dispatch:'),'Workflow must support explicit dispatch: '+path);
 assert(!/^\s+push:\s*$/m.test(content),'No image-generation or Commons research changes automatically on push: '+path);
 assert(!/git\s+push\b|git\s+commit\b/.test(content),'Never directly publish generated images to main: '+path);
 if(!path.includes('photo-candidate'))assert(/contents:\s*read/.test(content),'Image review workflow must have read-only repository access: '+path);
}
const commons=read('.github/workflows/photo-discovery.yml');
assert(commons.includes("cron: '25 1 * * 1'"),'Limit Commons discovery to weekly');
assert(!/^\s+push:\s*$/m.test(commons),'No Commons research on every main push');
const research=read('scripts/find-photo-candidates.mjs');
assert(research.includes('commonsRateLimited=true'),'Second Commons script must trip rate-limit breaker');
assert(research.includes('DEFERRED_API_RATE_LIMIT'),'Report not-queried venues as deferred');
assert(!research.includes('CC BY(?:-SA|-ND)'), 'ND images are not review-cleared commercial photos');
assert(research.includes("reuseApproved:false"),'Search results must never be auto-published');
const generator=read('scripts/generate-venue-ai-images.py');
for(const id of ['r31','r52'])assert(generator.includes("'"+id+"'")&&generator.includes('PROMPTS.pop(blocked_id, None)'),'Unsafe historical/private venues excluded from new AI generation: '+id);
const corrected=[
 ['a34','sumo'],['s15','sumo'],['a31','sake'],['r21','pizza'],['r18','French'],
 ['r11','yakiniku'],['r29','conveyor'],['r37','conveyor'],['a28','indigo'],
 ['a29','ninja'],['a32','Meguro'],['a38','traditional culture'],['r51','Noh'],
 ['r50','teamLab']
];
for(const [id,term] of corrected){
 const line=generator.split('\n').find(s=>s.startsWith("'"+id+"':"));
 assert(line&&line.toLowerCase().includes(term.toLowerCase()),'Venue AI concept must reflect actual subject: '+id+' '+term);
}
console.log('PASS workflow safety: 4 manual-only jobs, no unreviewed pushes, Commons 429 breaker, 14 venue-specific AI concept corrections and 2 blocked private/closed locations');
