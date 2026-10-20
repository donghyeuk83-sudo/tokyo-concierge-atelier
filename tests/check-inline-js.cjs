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
const localePath='assets/atelier-i18n.js';
const localeTag='<script src="'+localePath+'?v=20261021-a"></script>';
const searchTagPos=html.indexOf(searchTag),localeTagPos=html.indexOf(localeTag),inlineTagPos=html.indexOf('<script>');
assert(localeTagPos>searchTagPos&&localeTagPos<inlineTagPos,'Locales must be loaded after search and before main catalogue script');
const localeJS=fs.readFileSync(localePath,'utf8');
new vm.Script(localeJS,{filename:localePath});
const originalLocale=localeJS.slice(localeJS.indexOf('const I18N='));
assert(originalLocale.startsWith('const I18N='),'Locale translation literal must exist');
let h=2166136261;
for(const ch of originalLocale){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}
assert.equal((h>>>0).toString(16),'a7fb4a39','Original three-language copy changed unexpectedly');
assert(!html.includes('const I18N='),'Locale definitions must have exactly one source of truth');
assert(searchSource.includes('function searchText(r)'),'Dedicated search index must define searchText');
console.log('PASS',blocks.length,'inline and three extracted JS assets with original translations');
