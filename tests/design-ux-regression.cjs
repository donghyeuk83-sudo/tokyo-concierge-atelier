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
