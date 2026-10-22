// Concierge first: prove that mobile visitors can reach the catalogue before
// decorative stories and that all guest onboarding copy follows EN/JA/KO.
const {chromium,webkit,devices}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
let server;
async function baseUrl(){
 if(process.env.TEST_URL)return process.env.TEST_URL;
 return await new Promise(resolve=>{
  server=http.createServer((req,res)=>{
   const target=path.resolve(process.cwd(),'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname==='/'
    ?'/index.html':new URL(req.url,'http://localhost').pathname));
   if(!target.startsWith(process.cwd()+path.sep)){res.writeHead(403).end();return}
   const type=target.endsWith('.html')?'text/html;charset=utf-8':target.endsWith('.css')?'text/css;charset=utf-8':target.endsWith('.js')?'text/javascript;charset=utf-8':target.endsWith('.webp')?'image/webp':target.endsWith('.jpg')?'image/jpeg':target.endsWith('.svg')?'image/svg+xml':'text/plain';
   fs.readFile(target,(e,data)=>{if(e){res.writeHead(404).end();return}res.writeHead(200,{'content-type':type}).end(data)});
  }).listen(0,'127.0.0.1',()=>resolve('http://127.0.0.1:'+server.address().port+'/'));
 });
}
// Every card shows exactly one image source; quarantined AI tiles never render; AI/local images
// really decode (naturalWidth>0); image and SVG fallback are never visible together; the label
// stays inside the card and never collides with a caption. Also exercises the stock tier.
async function auditCardImages(page,label){
 const quarantine=await page.evaluate(()=>Object.keys(AI_VISUAL_QUARANTINE));
 const badFiles=await page.evaluate(()=>Object.keys(AI_VISUAL_QUARANTINE).map(id=>AI_VENUE_VISUALS[id].url));
 const totals={cards:0,ai:0,svg:0,stock:0,licensed:0};
 await page.locator('#query').fill('');
 for(const cat of ['restaurant','attraction','shopping','wellness','transport']){
  const tab=page.locator('#tabs [data-cat="'+cat+'"]');
  if(!(await tab.count()))continue;
  await tab.click();
  await page.waitForFunction(c=>document.querySelector('#tabs .tab.active')?.dataset.cat===c,cat);
  const rows=await page.evaluate(async({quarantine,badFiles})=>{
   const out=[];
   for(const card of document.querySelectorAll('#cards .card')){
    card.scrollIntoView({block:'center',behavior:'auto'});
    const id=card.querySelector('[data-detail]')?.dataset.detail;
    const art=card.querySelector('.card-art,.card-photo');
    const imgs=art?[...art.querySelectorAll('img')]:[];
    for(const img of imgs){
     if(img.complete)continue;
     img.loading='eager';
     await new Promise(r=>{img.addEventListener('load',r,{once:true});img.addEventListener('error',r,{once:true});setTimeout(r,6000)});
    }
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const svg=art?.querySelector('svg'),img=imgs[0],badge=art?.querySelector('.card-photo-label'),cap=art?.querySelector('.art-caption');
    const a=art?.getBoundingClientRect(),b=badge?.getBoundingClientRect(),c=cap?.getBoundingClientRect();
    out.push({id,source:art?.dataset.imageSource||(art?.classList.contains('licensed-photo')?'licensed':'unknown'),
     imgCount:imgs.length,src:img?.getAttribute('src')||'',natural:img?img.naturalWidth:0,imgVisible:!!img&&!img.hidden&&getComputedStyle(img).display!=='none',
     svgVisible:!!svg&&!svg.hasAttribute('hidden')&&getComputedStyle(svg).display!=='none',
     badges:art?art.querySelectorAll('.card-photo-label').length:0,
     badgeInside:!!b&&b.left>=a.left-1&&b.right<=a.right+1&&b.top>=a.top-1&&b.bottom<=a.bottom+1,
     overlap:!!(b&&c)&&!(b.bottom<=c.top||c.bottom<=b.top||b.right<=c.left||c.right<=b.left),
     quarantined:quarantine.includes(id),usesBadFile:badFiles.some(f=>card.innerHTML.includes(f))});
   }
   return out;
  },{quarantine,badFiles});
  for(const r of rows){
   totals.cards++;totals[r.source]=(totals[r.source]||0)+1;
   assert(!r.usesBadFile,label+': quarantined AI file referenced on '+r.id);
   assert.equal(r.badges,1,label+': exactly one image-type label '+r.id);
   assert(r.badgeInside,label+': label inside card '+r.id);
   assert(!r.overlap,label+': caption and label do not overlap '+r.id);
   assert(r.imgCount<=1,label+': at most one image '+r.id);
   // r18/r21/r28 are quarantined but keep their approved registry photo, which always wins.
   if(r.quarantined&&r.source!=='licensed')assert(r.imgCount===0&&r.svgVisible&&r.source==='svg',label+': quarantined venue shows SVG only '+r.id+' '+JSON.stringify(r));
   if(r.source==='ai'){
    assert(r.natural>0,label+': AI venue image decodes (naturalWidth>0) '+r.id+' '+r.src);
    assert(r.imgVisible&&!r.svgVisible,label+': loaded AI image hides SVG fallback '+r.id);
   }
   if(r.source==='svg')assert(r.imgCount===0&&r.svgVisible,label+': SVG card has no image '+r.id);
   if(r.source==='licensed'&&!/^https?:/.test(r.src))assert(r.natural>0,label+': local approved photo decodes '+r.id);
  }
 }
 assert.equal(totals.cards,131,label+': all 131 venues rendered');
 assert.equal(totals.licensed,89,label+': 89 approved photos still rendered');
 // Stock tier: simulate a fully verified stock record for r02 and confirm the labelled,
 // mutually exclusive rendering in all three languages, then restore the real (gated) state.
 await page.locator('#tabs [data-cat="restaurant"]').click();
 for(const lang of ['ko','ja','en']){
  await page.locator('#language').selectOption(lang);
  await page.evaluate(()=>{const s=STOCK_IMAGE_LIBRARY[VENUE_STOCK_IMAGES.r02];s.__f=s.fileVerified;s.__c=s.contentVerified;s.fileVerified=true;s.contentVerified=true;document.querySelector('#query').value='Sushi Takeuchi';render()});
  await page.waitForFunction(()=>!!document.querySelector('#cards .card:has([data-detail="r02"]) .stock-art'));
  const stock=await page.locator('#cards .card:has([data-detail="r02"])').evaluate(async card=>{
   const art=card.querySelector('.stock-art'),img=art.querySelector('img');
   img.loading='eager';
   if(!img.complete)await new Promise(r=>{img.addEventListener('load',r,{once:true});img.addEventListener('error',r,{once:true});setTimeout(r,8000)});
   await new Promise(r=>setTimeout(r,50));
   const svgVisible=getComputedStyle(art.querySelector('svg')).display!=='none'&&!art.querySelector('svg').hasAttribute('hidden');
   return {label:art.querySelector('.card-photo-label').textContent,loaded:img.naturalWidth>0&&!img.hidden,svgVisible,
    credit:card.querySelector('.stock-credit')?.textContent||'',links:card.querySelectorAll('.stock-credit a').length,claimsReal:/REAL VENUE PHOTO|実際の施設写真|실제 장소 사진/.test(card.textContent)};
  });
  const expected={en:'REFERENCE PHOTO · NOT THIS VENUE',ja:'参考写真 · 当店の写真ではありません',ko:'참고 사진 · 이 장소 사진 아님'}[lang];
  assert.equal(stock.label,expected,label+': stock reference label '+lang);
  assert(stock.loaded!==stock.svgVisible,label+': stock image and SVG fallback mutually exclusive '+lang+' '+JSON.stringify(stock));
  assert.equal(stock.links,2,label+': stock credit links to photo page and license '+lang);
  assert(!stock.claimsReal,label+': stock card never claims to be the venue '+lang);
  await page.evaluate(()=>{const s=STOCK_IMAGE_LIBRARY[VENUE_STOCK_IMAGES.r02];s.fileVerified=s.__f;s.contentVerified=s.__c;delete s.__f;delete s.__c;document.querySelector('#query').value='';render()});
 }
 await page.locator('#language').selectOption('en');
 assert.equal(await page.evaluate(()=>venueImageRecord(DATA.find(r=>r.id==='r02')).sourceType),'svg',label+': unverified stock stays hidden after restore');
 console.log('PASS '+label+' image sweep '+JSON.stringify(totals));
}
async function verify(browserType,label,dimensions,url){
 const browser=await browserType.launch({headless:true});
 try{
  const context=await browser.newContext(dimensions==='mobile'?{...devices['iPhone 13'],viewport:{width:390,height:844}}:{viewport:{width:1280,height:900}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#cards .card').first().waitFor({timeout:20000});
  // A linked stylesheet can silently fail (MIME, 404, CSP) while JS still renders cards.
  // Assert real parsed CSS rules, not merely the presence of a <link> tag.
  const stylesheetRules=await page.evaluate(()=>{
   const sheet=[...document.styleSheets].find(s=>s.href?.includes('/assets/atelier.css'));
   if(!sheet)return 0;
   try{return sheet.cssRules.length}catch(e){return 0}
  });
  assert(stylesheetRules>50,'Published external stylesheet must load and parse at '+label+': '+stylesheetRules);
  assert.equal(await page.locator('#cards .card').first().evaluate(el=>getComputedStyle(el).boxSizing),'border-box','Original card sizing must survive CSS extraction');
  const positions=()=>page.evaluate(()=>{
   const main=document.querySelector('main'),visual=document.querySelector('.cinematic-gallery');
   return {mainBeforeStories:!!(main.compareDocumentPosition(visual)&Node.DOCUMENT_POSITION_FOLLOWING),
    catalogueVisible:!!document.querySelector('#tabs .tab'),
    mainCount:document.querySelectorAll('main').length,
    viewport:window.innerWidth,scrollWidth:document.documentElement.scrollWidth,
    ctaBottom:document.querySelector('.hero-cta').getBoundingClientRect().bottom};
  });
  let state=await positions();
  assert.equal(state.mainCount,1,'Only one editable guest catalogue');
  assert.equal(state.mainBeforeStories,dimensions==='mobile','Mobile catalogue before inspiration / desktop original editorial order');
  assert(state.catalogueVisible,'Category controls render');
  assert(state.scrollWidth<=state.viewport+2,'No horizontal overflow at '+label+': '+JSON.stringify(state));
  if(dimensions==='mobile')assert(state.ctaBottom<790,'Find places must appear in the first iPhone viewport');
  for(const [lang,cta,title] of [['ko','장소 검색 ↓','도쿄를 더 가깝게.'],['ja','施設を探す ↓','東京を、もっと身近に。'],['en','FIND PLACES ↓','Tokyo, at your fingertips.']]){
   await page.locator('#language').selectOption(lang);
   assert.equal((await page.locator('.hero-cta').textContent()).trim(),cta,'Translated primary CTA '+lang);
   assert.equal((await page.locator('.magazine-lead strong').textContent()).trim(),title,'Translated mobile recommendation onboarding '+lang);
   assert.equal(await page.locator('html').getAttribute('lang'),lang,'Correct screen-reader document language');
   assert.equal(await page.locator('.magazine-tile[aria-label]').count(),3,'All three quick category tiles accessible '+lang);
   assert((await page.locator('.source-explainer>strong').textContent()).trim().length>0,'Source safety label translated '+lang);
  }
  // PR #69: Never render the unrelated Chuo streetscape for Yoroniku.
  // The source registry and original 50 AI assets remain untouched.
  await page.locator('#tabs [data-cat="restaurant"]').click();
  await page.locator('#query').fill('Yoroniku');
  // Wait for the debounced catalogue rerender, not just an r11 card from an older frame.
  await page.waitForFunction(()=>{
   const cards=[...document.querySelectorAll('#cards .card')];
   return cards.length===1&&!!cards[0].querySelector('[data-detail="r11"]');
  },null,{timeout:10000});
  const yoroniku=page.locator('#cards .card:has([data-detail="r11"])');
  const yoronikuArt=yoroniku.locator('.card-art');
  // content-visibility:auto skips layout below the fold. Avoid Playwright's
  // actionability/stability retry while a re-render or CSS transition is settling.
  await page.evaluate(()=>{
   const root=document.documentElement,old=root.style.scrollBehavior;
   root.style.scrollBehavior='auto';
   document.querySelector('#cards .card:has([data-detail="r11"])').scrollIntoView({block:'center',behavior:'auto'});
   root.style.scrollBehavior=old;
  });
  await yoronikuArt.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.waitForFunction(()=>{
   const el=document.querySelector('#cards .card:has([data-detail="r11"]) .card-art');
   return !!el&&el.getBoundingClientRect().height>50;
  },null,{timeout:10000});
  const artworkState=await yoronikuArt.evaluate(el=>{
   const badge=el.querySelector('.card-photo-label');
   const svg=el.querySelector('svg');
   const container=el.getBoundingClientRect(),rect=badge?.getBoundingClientRect();
   return {
    sourcePreserved:!!AI_VENUE_VISUALS.r11 && AI_VENUE_VISUALS.r11.url.includes('ai-unique-r11.webp'),
    imgCount:el.querySelectorAll('img').length,
    svgCount:el.querySelectorAll('svg').length,
    svgVisible:!!svg&&getComputedStyle(svg).display!=='none',
    captions:el.querySelectorAll('.art-caption').length,
    badges:el.querySelectorAll('.card-photo-label').length,
    badgeContained:!!rect&&rect.left>=container.left-1&&rect.right<=container.right+1&&rect.top>=container.top-1&&rect.bottom<=container.bottom+1,
    badgeRect:rect?.toJSON(),containerRect:container.toJSON(),badgeStyle:badge?{position:getComputedStyle(badge).position,bottom:getComputedStyle(badge).bottom,left:getComputedStyle(badge).left,fontSize:getComputedStyle(badge).fontSize}:null,
    containsWrongChuo:el.textContent.includes('Chuo')
   };
  });
  assert(artworkState.sourcePreserved,'The original r11 AI artwork file mapping is preserved');
  assert.equal(artworkState.imgCount,0,'Quarantined r11 never creates an image element');
  assert.equal(artworkState.svgCount,1,'Yoroniku shows exactly one venue-specific SVG fallback');
  assert(artworkState.svgVisible,'Yoroniku SVG is visible');
  assert.equal(artworkState.captions,0,'Yoroniku fallback must not overlap the image-type badge');
  assert.equal(artworkState.badges,1,'Yoroniku has exactly one illustration label');
  assert(artworkState.badgeContained,'Yoroniku label stays inside its card: '+JSON.stringify(artworkState));
  assert(!artworkState.containsWrongChuo,'Yoroniku image has no Chuo text');
  // 2026-10-22 image policy: sweep every card in every category at this browser/viewport.
  await auditCardImages(page,label);
  await page.locator('#query').fill('');
  await page.locator('.magazine-tile[data-cat="attraction"]').click();
  assert.equal(await page.locator('#tabs .tab.active').getAttribute('data-cat'),'attraction','Localized featured shortcut opens real category');
  await page.locator('#language').selectOption('en');
  await page.locator('#tabs [data-cat="restaurant"]').click();
  await page.locator('#cards [data-id]').first().click();
  assert.equal(await page.locator('#guide .guide-item').count(),1,'Moving main does not erase guest selections');
  if(dimensions==='desktop'){
   await page.setViewportSize({width:390,height:844});
   await page.waitForFunction(()=>!!(document.querySelector('main').compareDocumentPosition(document.querySelector('.cinematic-gallery'))&Node.DOCUMENT_POSITION_FOLLOWING),null,{timeout:7000});
   state=await positions();
   assert.equal(state.mainBeforeStories,true,'Live resize to mobile prioritizes tools');
   assert.equal(await page.locator('#guide .guide-item').count(),1,'Selection survives responsive reorder');
   await page.setViewportSize({width:1280,height:900});
   await page.waitForFunction(()=>!!(document.querySelector('.cinematic-gallery').compareDocumentPosition(document.querySelector('main'))&Node.DOCUMENT_POSITION_FOLLOWING),null,{timeout:7000});
   state=await positions();
   assert.equal(state.mainBeforeStories,false,'Desktop editorial layout restored after resize');
  }
  assert.deepEqual(errors,[],'No JS errors during locale updates or DOM repositioning '+label);
  await context.close();
  console.log('PASS '+label+' '+url+': CTA first-screen, compact menu, real catalogue before stories on mobile, 3-language onboarding, preserved shortlist and responsive order');
 }finally{await browser.close()}
}
(async()=>{
 const url=await baseUrl();
 try{
  await verify(chromium,'Chromium desktop','desktop',url);
  await verify(chromium,'Chromium mobile','mobile',url);
  await verify(webkit,'WebKit desktop','desktop',url);
  await verify(webkit,'WebKit iPhone','mobile',url);
 }finally{if(server)await new Promise(resolve=>server.close(resolve))}
})().catch(e=>{console.error(e);process.exitCode=1});
