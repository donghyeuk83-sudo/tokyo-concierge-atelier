const { chromium } = require('playwright');
const assert=require('assert');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1365,height:900},acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const target=process.env.TEST_URL || ('file://'+process.cwd()+'/index.html');
 await page.goto(target,{waitUntil:'domcontentloaded',timeout:45000});
 assert((await page.title()).includes('Tokyo Concierge Atelier'),'site title');
 await page.waitForSelector('.card',{timeout:15000});
 assert((await page.locator('.card').count())>0,'catalogue cards render');
 await page.locator('#query').fill('Udatsu');
 assert((await page.locator('.card').count())>=1,'search returns results');
 await page.locator('#query').fill('NO_SUCH_VENUE_123');
 await page.waitForTimeout(180);
 assert.equal(await page.locator('.card').count(),0,'empty search');
 await page.locator('#query').fill('');
 for(const l of ['ja','ko','en']){await page.locator('#language').selectOption(l);assert.equal(await page.locator('html').getAttribute('lang'),l,'language '+l)}
 await page.locator('.card button[data-id]').first().click();
 assert((await page.locator('#guide .guide-item').count())>0,'shortlist add');
 await page.locator('#share').click();
 const downloadPromise=page.waitForEvent('download',{timeout:10000});
 await page.locator('#download').click();const download=await downloadPromise;
 assert(download.suggestedFilename().endsWith('.csv'),'CSV download');
 await page.locator('#print').evaluate(el=>{window.__printClicked=false;window.print=()=>{window.__printClicked=true}});
 await page.locator('#print').click();
 assert(await page.evaluate(()=>window.__printClicked),'print action invoked');
 await page.locator('.detail-trigger').first().click();
 assert(await page.locator('#detailDialog').evaluate(el=>el.open),'detail dialog');
 await page.locator('#detailClose').click();
 assert(!await page.locator('#detailDialog').evaluate(el=>el.open),'dialog close');
 await page.setViewportSize({width:390,height:844});
 assert((await page.locator('body').evaluate(el=>el.scrollWidth))<=405,'mobile horizontal overflow');
 await page.locator('#language').selectOption('ko');
 await page.locator('#query').fill('도쿄도 사진미술관');
 await page.locator('#tabs [data-cat="attraction"]').click();
 assert((await page.locator('.card').count())>=1,'Korean museum search');
 await page.locator('#query').fill('');
 await page.locator('#tabs [data-cat="attraction"]').click();
 const fs=require('node:fs');
 const html=fs.readFileSync('index.html','utf8');
 const registry=html.split('const LICENSED_VENUE_PHOTOS={')[1]?.split('};')[0]||'';
 const expectedPhotos=[...registry.matchAll(/^([a-z]\d+):\{/gm)].map(m=>m[1]);
 assert(expectedPhotos.length>=24,'Photo registry unexpectedly shrank');

 // Structural metadata checks catch mismatched Wikimedia filenames and missing attribution.
 const entries=[...registry.matchAll(/^([a-z]\\d+):\\{([^\\n]+)\\},?$/gm)];
 assert.equal(entries.length,expectedPhotos.length,'Every photo registry entry parses');
 const seenSources=new Set();
 for(const [,id,fields] of entries){
   const pick=name=>fields.match(new RegExp('(?:^|,)'+name+':"([^"]*)"'))?.[1];
   const url=pick('url'),source=pick('source'),credit=pick('credit'),license=pick('license'),licenseUrl=pick('licenseUrl');
   assert(url&&source&&credit&&license&&licenseUrl,'Photo attribution fields present: '+id);
   const srcName=decodeURIComponent(new URL(source).pathname.split('/').pop()).replace(/_/g,' ');
   const imgName=decodeURIComponent(new URL(url).pathname.split('/').pop()).replace(/_/g,' ');
   assert.equal(imgName,srcName,'Photo image and source filename match: '+id);
   assert(!seenSources.has(source),'Photo source reused across venues: '+id);
   seenSources.add(source);
   assert.equal(new URL(source).hostname,'commons.wikimedia.org','Photo source must be Commons: '+id);
   assert.equal(new URL(licenseUrl).hostname,'creativecommons.org','License must link to Creative Commons: '+id);
 }

 const catalog=html.split('const DATA=[')[1]?.split('].map(')[0]||'';
 const categoryById=new Map([...catalog.matchAll(/^\["([a-z]\d+)","(restaurant|attraction|shopping|wellness|transport)"/gm)].map(m=>[m[1],m[2]]));
 const failedPhotos=[];
 // The catalogue renders only one category at a time. Visit each category before asserting its photos.
 for(const cat of [...new Set(expectedPhotos.map(id=>categoryById.get(id)))]){
   assert(cat,'Photo references unknown catalogue venue');
   await page.locator('#tabs [data-cat="'+cat+'"]').click();
   for(const id of expectedPhotos.filter(id=>categoryById.get(id)===cat)){
     const img=page.locator('img[data-venue-photo="'+id+'"]');
     assert.equal(await img.count(),1,'Photo element present in '+cat+': '+id);
     await img.scrollIntoViewIfNeeded();
     await img.evaluate(el=>{el.loading='eager';el.decoding='sync'});
     await img.evaluate(el=>new Promise(resolve=>{if(el.complete)return resolve();el.addEventListener('load',resolve,{once:true});el.addEventListener('error',resolve,{once:true});setTimeout(resolve,12000)}));
     const status=await img.evaluate(el=>({complete:el.complete,width:el.naturalWidth,src:el.currentSrc}));
     console.log('VENUE_PHOTO_STATUS',id,JSON.stringify(status));
     if(status.width===0)failedPhotos.push(id+' '+status.src);
     const card=img.locator('xpath=ancestor::article');
     assert.equal(await card.locator('.photo-credit a').count(),2,'Photo source and license links: '+id);
   }
 }
 assert.deepEqual(failedPhotos,[],'Venue images failed to load');
 await page.locator('#tabs [data-cat="attraction"]').click();
 // Exercise the broken-image replacement path, not just the happy-path photo loader.
 const broken=page.locator('img[data-venue-photo="a01"]');
 await broken.evaluate(el=>el.dispatchEvent(new Event('error')));
 const brokenCard=page.locator('.card').filter({has:page.locator('img[data-venue-photo="a01"]')});
 assert.equal(await brokenCard.locator('.card-art').count(),1,'Photo failure shows one illustration');
 assert.equal(await brokenCard.locator('.card-photo').evaluate(el=>getComputedStyle(el).display),'none','Broken photo is hidden');

 assert.equal(errors.length,0,'JS errors: '+errors.join('; '));
 console.log('PASS '+target+': render, search, no results, EN/JA/KO, shortlist, CSV, print invocation, detail, Korean search, mobile width, JS console');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
