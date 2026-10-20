// Check every AI photo card and publish a precise duplicate-image audit.
// Does not mistake a reused filename for a venue-specific photograph.
const fs=require('node:fs');
const {catalogueSection:catalog,aiSection:registry,verifyExtractedSnapshot}=require('./atelier-source-registry.cjs');
verifyExtractedSnapshot();
if(!catalog||!registry)throw Error('Catalogue or AI image registry missing');
const venues=[...catalog.matchAll(/^\[("(?:[^"\\]|\\.)*"(?:,\s*"(?:[^"\\]|\\.)*"){6})\],?$/gm)].map(m=>JSON.parse('['+m[1]+']'));
const photos=[...registry.matchAll(/([a-z]\d+):\{url:'([^']+)'/g)].map(m=>({id:m[1],file:m[2]}));
const byId=new Map(venues.map(v=>[v[0],v]));
if(venues.length!==131)throw Error('Expected 131 venues');
if(photos.length!==50)throw Error('Expected 50 AI image mappings');
const groups=new Map();
for(const p of photos){
 if(!byId.has(p.id))throw Error('Unknown venue '+p.id);
 if(!p.file.endsWith('.webp'))throw Error('Non-WebP AI card '+p.id);
 if(!fs.existsSync(p.file))throw Error('Missing image asset '+p.file);
 const list=groups.get(p.file)||[];list.push(p.id);groups.set(p.file,list);
}
const duplicates=[...groups].filter(([,ids])=>ids.length>1).map(([file,ids])=>({file,ids}));
const rows=['venue_id,venue_name,photo_file,shared_by_count,other_venue_ids'];
for(const p of photos){const ids=groups.get(p.file);const name=byId.get(p.id)[2];rows.push([p.id,name,p.file,ids.length,ids.filter(id=>id!==p.id).join(' | ')].map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(','));}
fs.mkdirSync('audits',{recursive:true});fs.writeFileSync('audits/ai-image-uniqueness.csv',rows.join('\n')+'\n');
console.log(JSON.stringify({venues:venues.length,aiCards:photos.length,uniqueImageFiles:groups.size,sharedImageGroups:duplicates.length,cardsUsingSharedImages:photos.filter(p=>groups.get(p.file).length>1).length,duplicates},null,2));
