// Fail fast on malformed inline JavaScript before any slow HTTP venue or browser checks.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const blocks=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
assert(blocks.length>0,'Atelier must contain at least one runnable inline script');
for(const [i,match] of blocks.entries()){
 if(!match[1].trim())continue;
 new vm.Script(match[1],{filename:'index.html inline script '+(i+1)});
}
const illustrationPath='assets/atelier-illustration.js';
assert(html.includes('<script src="'+illustrationPath+'?v=20261021-a"></script>'),'Venue illustration renderer must load before catalogue inline script');
const externalJS=fs.readFileSync(illustrationPath,'utf8');
assert(externalJS.includes('function illustration(r){'),'Venue artwork function missing from extracted asset');
new vm.Script(externalJS,{filename:illustrationPath});
console.log('PASS',blocks.length,'inline JavaScript syntax block(s) and external illustration renderer');
