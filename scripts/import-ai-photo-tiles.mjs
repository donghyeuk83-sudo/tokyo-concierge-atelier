#!/usr/bin/env node
// Import real raster AI concept files into existing site. Never label these as real venue photos.
// Usage: node scripts/import-ai-photo-tiles.mjs /path/to/tokyo_ai_photo_tiles
import fs from 'node:fs';
import path from 'node:path';
const folder=process.argv[2];if(!folder)throw Error('Provide extracted WebP folder');
const mapping={r06:'seirinkan-concept.webp',r45:'zauo-concept.webp'};
const dest='assets/photos';let html=fs.readFileSync('index.html','utf8');
for(const [id,file] of Object.entries(mapping)){
 const source=path.join(folder,file),target=path.join(dest,'ai-'+id+'-photo.webp');
 if(!fs.existsSync(source))throw Error('Missing '+source);
 const bytes=fs.readFileSync(source);
 if(bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')throw Error('Not WebP: '+file);
 fs.copyFileSync(source,target);
 const entry=new RegExp(id+":\\{url:'[^']+'\\}");
 const registry=html.split('const AI_VENUE_VISUALS={')[1].split('};')[0];
 if(entry.test(registry)) html=html.replace(entry,id+":{url:'"+target+"'}");
 else html=html.replace('const AI_VENUE_VISUALS={','const AI_VENUE_VISUALS={'+id+":{url:'"+target+"'},");
 console.log(id+' -> '+target+' ('+bytes.length+' bytes)');
}
fs.writeFileSync('index.html',html);
console.log('Updated index.html; review the visual disclosure and commit assets.');
