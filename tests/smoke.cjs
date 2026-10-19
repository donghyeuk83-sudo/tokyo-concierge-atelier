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
 await page.waitForFunction(()=>document.querySelectorAll('.card').length===0,null,{timeout:5000});
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
 const localPhotos=JSON.parse(fs.readFileSync('assets/photos/sources.json','utf8'));
 const localPhotoById=new Map(localPhotos.map(photo=>[photo.id,photo]));
 const registry=html.split('const LICENSED_VENUE_PHOTOS={')[1]?.split('};')[0]||'';
 const expectedPhotos=[...registry.matchAll(/^([a-z]\d+):\{/gm)].map(m=>m[1]);
 const publicPhotoSourceBlock=html.split('const VENUE_PHOTO_SOURCE_LINKS={')[1]?.split('};')[0]||'';
 const externalPhotoIds=[...publicPhotoSourceBlock.matchAll(/^([a-z]\d+):\{url:/gm)].map(m=>m[1]);
 assert.equal(externalPhotoIds.length,39,'39 external exact-venue photo and information source references expected');
 assert.equal(new Set(externalPhotoIds).size,externalPhotoIds.length,'Duplicate external source ID');
 const checkedPhotoRefs=[
   ['restaurant','r18','www.fourseasons.com'],
   ['wellness','w05','www.shimizuyu.com'],
   ['attraction','a30','prtimes.jp'],
   ['shopping','s15','www.jalan.net']
 ];
 for(const [category,id,host] of checkedPhotoRefs){
   await page.locator('#tabs [data-cat="'+category+'"]').click();
   const card=page.locator('article.card').filter({has:page.locator('.detail-trigger[data-detail="'+id+'"]')});
   const link=card.locator('a.venue-photo-source');
   assert.equal(await link.count(),1,'External original-venue image reference shown on illustration card '+id);
   assert.equal(new URL(await link.getAttribute('href')).hostname,host,'Original-source hostname '+id);
   assert.equal(await link.getAttribute('target'),'_blank','External source opens independently '+id);
   assert((await link.getAttribute('rel')).includes('noopener'),'External source protects opener '+id);
   assert.equal(await card.locator('img[data-venue-photo]').count(),0,'Original third-party photography not embedded '+id);
   await card.locator('.detail-trigger').click();
   const detailLink=page.locator('#detailActions .detail-photo-source');
   assert.equal(await detailLink.count(),1,'Details expose the same photograph source '+id);
   assert.equal(await detailLink.getAttribute('href'),await link.getAttribute('href'),'Details and card photo link agree '+id);
   await page.locator('#detailClose').click();
 }
 await page.locator('#language').selectOption('ko');
 await page.locator('#tabs [data-cat="wellness"]').click();
 const koreanRef=page.locator('article.card').filter({has:page.locator('.detail-trigger[data-detail="w05"]')}).locator('a.venue-photo-source');
 assert((await koreanRef.textContent()).includes('현장 사진·시설 보기'),'Korean photo source link translation');
 await page.locator('#language').selectOption('en');
 assert((await page.locator('body').evaluate(el=>el.scrollWidth))<=405,'Photo-source links do not overflow iPhone viewport');
 assert(expectedPhotos.length>=24,'Photo registry unexpectedly shrank');
 assert.equal(expectedPhotos.length,85,'Expected 85 original images including 2 licensed shopping-complex exteriors');
 for(const [id,filename] of [['r32','Shibuya_Parco.jpg'],['r34','Omotesando-Harajuku-Tokyo---2024-06-15_010.jpg']]){
   assert(expectedPhotos.includes(id),'Missing newly licensed building exterior image for '+id);
   const line=registry.split('\n').find(row=>row.startsWith(id+':{'));
   assert(line && line.includes(encodeURIComponent(filename)),'Expected exact Commons source file for '+id);
 }
 // Both exterior photos are authentic photos of shopping complexes containing
 // the target restaurant, NOT interior photos of those sushi restaurants.
 await page.locator('#language').selectOption('en');
 await page.locator('#tabs [data-cat="restaurant"]').click();
 for(const id of ['r32','r34']){
   const article=page.locator('article.card').filter({has:page.locator('.detail-trigger[data-detail="'+id+'"]')});
   assert.equal(await article.locator('img[data-venue-photo="'+id+'"]').count(),1,'Licensed exterior photo visible '+id);
   assert.equal(await article.locator('a.venue-photo-source').count(),1,'Building image keeps operator-specific venue details link '+id);
   assert.equal((await article.locator('.card-photo-label').textContent()).trim(),'BUILDING EXTERIOR','Exterior is never labeled as the restaurant interior '+id);
   assert.equal(await article.locator('.photo-credit a').count(),2,'Author and CC license links '+id);
 }


 // Structural metadata checks catch mismatched Wikimedia filenames and missing attribution.
 const entries=[...registry.matchAll(/^([a-z]\d+):\{([^\n]+)\},?$/gm)];
 assert.equal(entries.length,expectedPhotos.length,'Every photo registry entry parses');
 const seenSources=new Set();
 for(const [,id,fields] of entries){
   const pick=name=>fields.match(new RegExp('(?:^|,)'+name+':"([^"]*)"'))?.[1];
   const url=pick('url'),source=pick('source'),credit=pick('credit'),license=pick('license'),licenseUrl=pick('licenseUrl');
   assert(url&&source&&credit&&license&&licenseUrl,'Photo attribution fields present: '+id);
   const sourceHost=new URL(source).hostname;
   const srcName=decodeURIComponent(new URL(source).pathname.split('/').pop()).replace(/^File:/,'').replace(/_/g,' ');
   const imagePath=new URL(url,'https://atelier.invalid/').pathname;
   const imgName=decodeURIComponent(imagePath.includes('/commons/thumb/')?imagePath.split('/').slice(-2,-1)[0]:imagePath.split('/').pop()).replace(/^[0-9]+px-/,'').replace(/_/g,' ');
   if(sourceHost==='www.flickr.com'){
     const review=localPhotoById.get(id);assert(review,'Flickr photo has a reviewed venue mapping: '+id);
     assert.equal(source,review.source,'Flickr source identity: '+id);
     assert.equal(url,review.file,'Local asset identity: '+id);
     assert.equal(credit,review.credit,'Local photo photographer: '+id);
     assert.equal(license,review.license,'Flickr license matches review: '+id);
   }else assert.equal(imgName,srcName,'Photo image and source filename match: '+id);
   assert(!seenSources.has(source),'Photo source reused across venues: '+id);
   seenSources.add(source);
   assert(['commons.wikimedia.org','www.flickr.com'].includes(sourceHost),'Photo source must be a reviewed provider: '+id);
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
     await img.locator('xpath=ancestor::article').scrollIntoViewIfNeeded();
     await img.evaluate(el=>{el.loading='eager';el.decoding='sync'});
     await img.evaluate(el=>new Promise(resolve=>{if(el.complete)return resolve();el.addEventListener('load',resolve,{once:true});el.addEventListener('error',resolve,{once:true});setTimeout(resolve,12000)}));
     const status=await img.evaluate(el=>({complete:el.complete,width:el.naturalWidth,src:el.currentSrc}));
     console.log('VENUE_PHOTO_STATUS',id,JSON.stringify(status));
     if(status.width===0)failedPhotos.push(id+' '+status.src);
     const card=img.locator('xpath=ancestor::article');
     assert.equal(await card.locator('.photo-credit a').count(),2,'Photo source and license links: '+id);
     if(localPhotoById.has(id)){
       await card.hover();
       assert.equal(await card.locator('.card-photo').evaluate(el=>getComputedStyle(el).filter),'none','Published photo colors remain unchanged on hover: '+id);
       assert.equal(await img.evaluate(el=>getComputedStyle(el).objectFit),'contain','Published photo preserves its complete frame: '+id);
       assert((await card.locator('.photo-credit').textContent()).includes(localPhotoById.get(id).title),'Original photo title is credited: '+id);
       assert.equal(await card.locator('.card-photo-label').textContent(),({en:'REAL VENUE PHOTO',ja:'実際の施設写真',ko:'실제 장소 사진'})[await page.locator('html').getAttribute('lang')],'Venue photo is not labeled as a building exterior: '+id);
     }
   }
 }
 assert.deepEqual(failedPhotos,[],'Venue images failed to load');
 // View every photo without cropping; check mobile modal, attribution and native keyboard close.
 await page.locator('#tabs [data-cat="attraction"]').click();
 for(const language of ['en','ja','ko']){
   await page.locator('#language').selectOption(language);
   const trigger=page.locator('[data-view-photo="a01"]');await trigger.click();
   assert(await page.locator('#photoDialog').evaluate(el=>el.open),'Photo viewer opens: '+language);
   assert.equal(await page.locator('#photoAttribution a').count(),2,'Enlarged photo retains attribution');
   assert((await page.locator('#photoTitle').textContent()).trim(),'Enlarged photo has a title');
   assert((await page.locator('#photoDialog').boundingBox()).width<=390,'Photo viewer fits mobile');
   assert.equal(await page.locator('#photoLarge').evaluate(el=>getComputedStyle(el).objectFit),'contain','Enlarged photo keeps full frame');
   const backgroundScroll=await page.evaluate(()=>window.scrollY);
   await page.mouse.move(3,200);
   await page.mouse.wheel(0,600);
   await page.waitForTimeout(150);
   assert.equal(await page.evaluate(()=>window.scrollY),backgroundScroll,'Photo backdrop does not scroll the catalogue');
   if(language==='ja')await page.locator('#photoClose').click();else await page.keyboard.press('Escape');
   assert(!await page.locator('#photoDialog').evaluate(el=>el.open),'Photo viewer closes: '+language);
   assert(await trigger.evaluate(el=>el===document.activeElement),'Focus returns to photo button');
   assert.notEqual(await page.evaluate(()=>getComputedStyle(document.documentElement).overflowY),'hidden','Catalogue scrolling restored after close');
 }
 await page.locator('[data-view-photo="a01"]').click();
 await page.locator('#photoLarge').evaluate(el=>el.dispatchEvent(new Event('error')));
 assert(await page.locator('#photoLarge').evaluate(el=>el.hidden),'Failed enlarged photo is hidden');
 assert((await page.locator('#photoStatus').textContent()).includes('사진'),'Photo viewer gives a localized loading error');
 await page.locator('#photoClose').click();

 await page.locator('#tabs [data-cat="attraction"]').click();
 // Exercise the broken-image replacement path, not just the happy-path photo loader.
 const broken=page.locator('img[data-venue-photo="a01"]');
 await broken.evaluate(el=>el.dispatchEvent(new Event('error')));
 const brokenCard=page.locator('.card').filter({has:page.locator('img[data-venue-photo="a01"]')});
 assert.equal(await brokenCard.locator('.card-art').count(),1,'Photo failure shows one illustration');
 await broken.evaluate(el=>{el.dispatchEvent(new Event('error'));el.dispatchEvent(new Event('error'))});
 assert.equal(await brokenCard.locator('.card-art').count(),1,'Repeated photo errors never duplicate the fallback');
 assert.equal(await brokenCard.locator('.card-photo').evaluate(el=>getComputedStyle(el).display),'none','Broken photo is hidden');

 assert.equal(errors.length,0,'JS errors: '+errors.join('; '));
 console.log('PASS '+target+': render, search, no results, EN/JA/KO, shortlist, CSV, print invocation, detail, Korean search, mobile width, JS console');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
