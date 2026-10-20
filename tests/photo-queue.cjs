// Produce a prioritized missing-photo queue from the actual catalogue and registry.
// Usage: node tests/photo-queue.cjs
const fs = require('node:fs');
const assert = require('node:assert/strict');
const {catalogueSection:data,licensedSection:photoSection,verifyExtractedSnapshot}=require('./atelier-source-registry.cjs');
verifyExtractedSnapshot();
assert(data && photoSection, 'Missing catalogue or photo registry');
const venues = [...data.matchAll(/^\[("(?:[^"\\]|\\.)*"(?:,\s*"(?:[^"\\]|\\.)*"){6})\],?$/gm)].map(m=>JSON.parse('['+m[1]+']'));
const registered = new Set([...photoSection.matchAll(/^([a-z]\d+):\{/gm)].map(m=>m[1]));
assert.equal(venues.length,131,'Catalogue size changed; inspect before updating queue');
const missing=venues.filter(v=>!registered.has(v[0])).map(v=>({id:v[0],category:v[1],name_en:v[2],name_ja:v[3],area:v[4],type:v[5],venue_url:v[6],status:'NEEDS_RIGHTS_AND_VENUE_MATCH_REVIEW'}));
const csv=s=>'"'+String(s??'').replace(/"/g,'""')+'"';
const columns=['id','category','name_en','name_ja','area','type','venue_url','status'];
fs.mkdirSync('audits',{recursive:true});
fs.writeFileSync('audits/missing-photo-queue.csv',[columns.map(csv).join(','),...missing.map(v=>columns.map(k=>csv(v[k])).join(','))].join('\n')+'\n');
console.log(JSON.stringify({venues:venues.length,registered:registered.size,pending:missing.length,output:'audits/missing-photo-queue.csv'}));
