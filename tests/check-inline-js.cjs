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
const searchPath='assets/atelier-search.js';
const illustrationTag='<script src="'+illustrationPath+'?v=20261021-a"></script>';
const searchTag='<script src="'+searchPath+'?v=20261021-a"></script>';
assert(html.includes(searchTag),'Versioned external multilingual search index missing');
assert(html.indexOf(illustrationTag)<html.indexOf(searchTag)&&html.indexOf(searchTag)<html.indexOf('<script>'),'Illustration and search assets must load before inline catalogue initialization');
const searchSource=fs.readFileSync(searchPath,'utf8');
new vm.Script(searchSource,{filename:searchPath});
assert(searchSource.includes('function searchText(r)'),'Dedicated search index must define searchText');
console.log('PASS',blocks.length,'inline syntax block(s) and illustration + multilingual search assets');
