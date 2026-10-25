// iPhone Safari-compatible WebKit end-to-end regressions.
// Uses HTTP even for the checked-out repo: file:// storage behavior differs from HTTPS.
const {webkit,devices}=require('playwright');
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=process.cwd();
let server;
function startLocalServer(){
 return new Promise(resolve=>{
  server=http.createServer((req,res)=>{
   try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const name=pathname==='/'?'/index.html':pathname;
    const filepath=path.resolve(root,'.'+name);
    if(!filepath.startsWith(root+path.sep)){res.writeHead(403).end();return}
    const type=filepath.endsWith('.html')?'text/html; charset=utf-8':filepath.endsWith('.css')?'text/css;charset=utf-8':filepath.endsWith('.js')?'text/javascript;charset=utf-8':filepath.endsWith('.webp')?'image/webp':filepath.endsWith('.jpg')?'image/jpeg':filepath.endsWith('.svg')?'image/svg+xml':filepath.endsWith('.json')?'application/json':'text/plain';
    fs.readFile(filepath,(err,body)=>{if(err){res.writeHead(404).end();return}res.writeHead(200,{'content-type':type,'cache-control':'no-store'}).end(body)});
   }catch(e){res.writeHead(400).end()}
  }).listen(0,'127.0.0.1',()=>resolve('http://127.0.0.1:'+server.address().port+'/'));
 });
}
(async()=>{
 let browser,context;
 try{
  const target=process.env.TEST_URL||await startLocalServer();
  browser=await webkit.launch({headless:true});
  context=await browser.newContext({...devices['iPhone 13'],acceptDownloads:true});
  const page=await context.newPage(),jsErrors=[];
  page.on('pageerror',e=>jsErrors.push(e.message));
  await page.goto(target,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#cards .card').first().waitFor({timeout:20000});
  assert((await page.locator('html').getAttribute('lang'))==='en','Language defaults to English');
  const viewport=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert(viewport.scroll<=viewport.width+2,'No sideways iPhone viewport overflow: '+JSON.stringify(viewport));

  // iPhone screenshot regression: prevent duplicate labels over AI venue artwork.
  // Fixture moved from Seirinkan (r06) to Zauo Shibuya (r45) on 2026-10-22: r06's AI tile showed an
  // invented storefront sign and duplicated tiles were withdrawn; r45 keeps a unique AI image.
  for(const locale of ['ko','ja','en']){
   await page.locator('#language').selectOption(locale);
   await page.locator('#query').fill('Zauo Shibuya');
   // Wait for the debounced catalogue rerender (same guard as the PR #69 Yoroniku check).
   await page.waitForFunction(()=>{const cards=document.querySelectorAll('#cards .card');return cards.length===1&&!!cards[0].querySelector('[data-detail="r45"]')},null,{timeout:10000});
   await page.waitForTimeout(400);
   const artwork=page.locator('#cards .card:has([data-detail="r45"]) .card-art');
   await artwork.waitFor({timeout:10000});
   await page.waitForFunction(()=>{const el=document.querySelector('#cards .card:has([data-detail="r45"]) .card-art');if(!el)return false;el.scrollIntoView({block:'center'});return true;}); // Avoid detached Playwright locators during language rerender.
   await artwork.locator('img').evaluate(el=>new Promise(resolve=>{
    el.loading='eager'; // Explicitly request the image in headless WebKit.
    if(el.complete)return resolve();
    el.addEventListener('load',resolve,{once:true});
    el.addEventListener('error',resolve,{once:true});
    setTimeout(resolve,8000); // Bound the wait when WebKit never emits image events.
   }));
   const layout=await artwork.evaluate(el=>{
    const img=el.querySelector('img'),svg=el.querySelector('svg'),badge=el.querySelector('.card-photo-label');
    const caption=el.querySelector('.art-caption');
    const outer=el.getBoundingClientRect(),box=badge.getBoundingClientRect();
    return {loaded:img.naturalWidth>0,svgHidden:getComputedStyle(svg).display==='none',
     captionCount:el.querySelectorAll('.art-caption').length,
     badgeCount:el.querySelectorAll('.card-photo-label').length,
     badgeFits:box.left>=outer.left&&box.right<=outer.right+1&&box.top>=outer.top&&box.bottom<=outer.bottom+1,
     captionOverlaps:!!caption&&!(box.bottom<=caption.getBoundingClientRect().top||caption.getBoundingClientRect().bottom<=box.top)};
   });
   // A failed/missing image must show its SVG fallback; a loaded image must hide it.
   assert(layout.loaded ? layout.svgHidden : !layout.svgHidden,
    'AI image and SVG fallback are mutually exclusive in '+locale+': '+JSON.stringify(layout));
   assert.equal(layout.captionCount,0,'No duplicate venue caption over image in '+locale);
   assert.equal(layout.badgeCount,1,'Exactly one image-type label in '+locale);
   assert(layout.badgeFits&&!layout.captionOverlaps,'Art labels fit and do not collide in '+locale+': '+JSON.stringify(layout));
  }
  const aiFixtureArt=page.locator('#cards .card:has([data-detail="r45"]) .card-art');
  await aiFixtureArt.locator('img').evaluate(el=>el.dispatchEvent(new Event('error')));
  assert(await aiFixtureArt.locator('img').evaluate(el=>el.hidden),'Failed illustration image becomes hidden');
  assert.notEqual(await aiFixtureArt.locator('svg').evaluate(el=>getComputedStyle(el).display),'none','SVG fallback appears on image failure');
  // Withdrawn AI tiles (wrong baked-in area text, watermarks, fictional signage, duplicates) never render;
  // those venues show their own labelled stock reference photo or the SVG.
  for(const [cat,query,id,expect] of [['restaurant','Seirinkan','r06','stock'],['restaurant','Sushi Takeuchi','r02','stock'],['restaurant','Yoroniku','r11','stock'],['wellness','Shimizuyu','w05','svg']]){
   await page.locator('#tabs [data-cat="'+cat+'"]').click();
   await page.locator('#query').fill(query);
   await page.waitForFunction(id=>{const cards=document.querySelectorAll('#cards .card');return cards.length===1&&!!cards[0].querySelector('[data-detail="'+id+'"]')},id,{timeout:10000});
   const state=await page.locator('#cards .card:has([data-detail="'+id+'"]) .card-art').evaluate(async(el,id)=>{
    el.scrollIntoView({block:'center'});const img=el.querySelector('img');
    if(img){img.loading='eager';if(!img.complete)await new Promise(r=>{img.addEventListener('load',r,{once:true});img.addEventListener('error',r,{once:true});setTimeout(r,8000)})}
    const outer=el.getBoundingClientRect(),badge=el.querySelector('.card-photo-label').getBoundingClientRect(),svg=el.querySelector('svg');
    return {imgs:el.querySelectorAll('img').length,imgVisible:!!img&&!img.hidden&&img.naturalWidth>0,svgVisible:getComputedStyle(svg).display!=='none'&&!svg.hasAttribute('hidden'),
     captions:el.querySelectorAll('.art-caption').length,badges:el.querySelectorAll('.card-photo-label').length,source:el.dataset.imageSource,
     badgeFits:badge.left>=outer.left-1&&badge.right<=outer.right+1,text:el.textContent,usesWithdrawn:!!AI_VENUE_VISUALS[id]&&el.innerHTML.includes(AI_VENUE_VISUALS[id].url)}},id);
   assert.equal(state.source,expect,'Expected image source on iPhone: '+id);
   assert(!state.usesWithdrawn,'Withdrawn AI image never rendered on iPhone: '+id);
   assert(state.imgVisible!==state.svgVisible,'Exactly one of image / SVG visible: '+id+' '+JSON.stringify(state));
   if(expect==='svg')assert.equal(state.imgs,0,'SVG-only venue has no image '+id);
   assert.equal(state.captions,0,'No caption over fallback '+id);
   assert.equal(state.badges,1,'Exactly one image-type label '+id);
   assert(state.badgeFits,'Label fits card on iPhone '+id);
   assert(!/Chuo|Tsukiji|pollinations/i.test(state.text),'No wrong area/venue/watermark text '+id);
  }
  await page.locator('#tabs [data-cat="restaurant"]').click();
  await page.locator('#query').fill('');

  // Multilingual aliases are loaded before the catalogue and remain searchable
  // on iPhone WebKit; return to Restaurants to preserve every existing test.
  await page.locator('#tabs [data-cat="attraction"]').click();
  for(const query of ['도쿄타워','東京タワー']){
   await page.locator('#query').fill(query);
   await page.waitForFunction(()=>document.querySelectorAll('#cards .card').length===1&&document.querySelector('#cards [data-detail="a01"]')!==null);
   assert.equal(await page.locator('#cards .card').count(),1,'Tokyo Tower search alias on iPhone: '+query);
  }
  await page.locator('#query').fill('');
  await page.locator('#tabs [data-cat="restaurant"]').click();
  await page.locator('#query').fill('Udatsu');
  await page.waitForFunction(()=>document.querySelectorAll('#cards .card').length>0);
  assert((await page.locator('#cards').textContent()).includes('Udatsu'),'iPhone keyword search');
  await page.locator('#query').fill('NO_SUCH_RESTAURANT_123');
  await page.waitForFunction(()=>document.querySelectorAll('#cards .card').length===0);
  await page.locator('#query').fill('');
  await page.waitForFunction(()=>document.querySelectorAll('#cards .card').length>0);
  const photo=page.locator('#photoFilter');
  await photo.selectOption('venue');
  const filtered=await page.locator('#cards .card').count();
  assert(filtered>0,'Venue photo filtering on iPhone');
  assert.equal(await page.locator('#cards img[data-venue-photo]').count(),filtered,'No illustrations mixed into venue-only filter');
  await photo.selectOption('source');
  assert((await page.locator('#cards a.venue-photo-source').count())>0,'Source-only photo filter on iPhone');
  await page.locator('#photoQuickbar [data-photo-quick="all"]').click();
  assert.equal(await photo.inputValue(),'all','Quick filter and dropdown synchronized');
  for(const language of ['ja','ko','en']){
   await page.locator('#language').selectOption(language);
   assert.equal(await page.locator('html').getAttribute('lang'),language,'iPhone language '+language);
   assert(await page.locator('#tabs .tab.active').count()===1,'One active translated category');
  }
  // Cross-tab synchronization uses a real WebKit storage event, not a synthetic JS event.
  const twin=await context.newPage();
  await twin.goto(target,{waitUntil:'domcontentloaded',timeout:45000});
  await twin.locator('#cards .card').first().waitFor();
  const targetID=await page.locator('#cards .card button[data-id]').first().getAttribute('data-id');
  await page.locator('#cards .card button[data-id="'+targetID+'"]').first().click();
  await twin.waitForFunction(id=>document.querySelector('#guide .guide-item')?.textContent.includes(document.querySelector('[data-detail="'+id+'"]')?.closest('.card')?.querySelector('h3')?.textContent||'__never__'),targetID,{timeout:10000});
  assert.equal(await twin.locator('#guide .guide-item').count(),1,'Real two-tab shortlist storage sync');
  // Real WebKit multi-tab clear sends a storage event with key === null.
  // Reproduces an otherwise invisible stale-shortlist defect.
  await twin.evaluate(()=>localStorage.clear());
  await page.waitForFunction(()=>document.querySelectorAll('#guide .guide-item').length===0);
  assert.equal(await page.locator('#shortlistBadge').textContent(),'0','Real cross-tab localStorage.clear refreshes the shortlist badge');
  await page.locator('#cards .card button[data-id="'+targetID+'"]').first().click();
  await twin.waitForFunction(()=>document.querySelectorAll('#guide .guide-item').length===1);
  assert.equal(await page.locator('#guide .guide-item').count(),1,'Guest can add again after another tab cleared storage');
  // Complete the two-tab scenario before export: later storage events must not
  // invalidate a CSV generated in this independent single-tab scenario.
  await twin.close();
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#guide .guide-item').count(),1,'iPhone WebKit shortlist survives reload');
  await page.locator('#language').selectOption('ko');
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('html').getAttribute('lang'),'ko','Korean locale persists after reload');
  assert.equal(await page.locator('#guide .guide-item').count(),1,'Shortlist remains populated after locale change and reload');
  // iPhone Safari may open a blob instead of producing a Playwright download event.
  // Verify the actual generated file BYTES and a visible human-tappable fallback,
  // not merely that Chromium's automatic download event happens in WebKit.
  const dl=page.waitForEvent('download',{timeout:3500}).catch(()=>null);
  assert(await page.locator('#download').evaluate(el=>typeof el.onclick==='function'),'CSV export button must have registered click handler in WebKit');
  const errorsBefore=jsErrors.length;
  await page.evaluate(()=>{window.__csvClickSeen=0;document.querySelector('#download').addEventListener('click',()=>{window.__csvClickSeen++},{capture:true})});
  // Mobile WebKit needs a real touch path; mouse click can focus the button
  // without dispatching click during scroll/layout transitions on deployed Pages.
  await page.evaluate(()=>{
    window.__csvTouchStart=0;window.__csvTouchEnd=0;
    const button=document.querySelector('#download');
    button.addEventListener('touchstart',()=>{window.__csvTouchStart++},{capture:true});
    button.addEventListener('touchend',()=>{window.__csvTouchEnd++},{capture:true});
  });
  // GitHub Pages loads remote photo assets and uses CSS smooth scrolling.
  // Emulate a guest who has finished scrolling before tapping the control.
  // A tap during an active WebKit scroll can fire touchstart/touchend but no click.
  await page.locator('#download').evaluate(async button=>{
    const root=document.documentElement,original=root.style.scrollBehavior;
    root.style.scrollBehavior='auto';
    button.scrollIntoView({behavior:'auto',block:'center',inline:'nearest'});
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    root.style.scrollBehavior=original;
  });
  await page.waitForFunction(()=>{
    const r=document.querySelector('#download').getBoundingClientRect();
    return r.top>40&&r.bottom<innerHeight-80;
  });
  await page.locator('#download').tap();
  const fallback=page.locator('#csvDirectDownload');
  // A scripted Blob click must NOT navigate iOS Safari away from the guest guide.
  assert(page.url().startsWith(target),'iPhone Safari stays on the guide after preparing CSV');
  if(!await fallback.isVisible()){
    const state=await page.evaluate(()=>({
      url:location.href,userAgent:navigator.userAgent,
      selected:JSON.parse(localStorage.getItem('atelier-shortlist-v2')||'[]'),
      items:document.querySelectorAll('#guide .guide-item').length,
      fallbackClasses:document.querySelector('#csvDownloadFallback')?.className,
      directHref:document.querySelector('#csvDirectDownload')?.getAttribute('href'),
      status:document.querySelector('#interactionStatus')?.textContent,
      handler:typeof document.querySelector('#download')?.onclick,
      urlCreator:typeof URL.createObjectURL,
      activeElement:document.activeElement?.id,
      clickEvents:window.__csvClickSeen,
      touchStarts:window.__csvTouchStart,
      touchEnds:window.__csvTouchEnd,
      scrollY:window.scrollY,
      buttonRect:document.querySelector('#download')?.getBoundingClientRect().toJSON(),
      hitTarget:(()=>{
        const r=document.querySelector('#download').getBoundingClientRect();
        const node=document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2);
        return {id:node?.id,tag:node?.tagName};
      })()
    }));
    console.error('WEBKIT_CSV_DIAGNOSTIC',JSON.stringify({...state,newPageErrors:jsErrors.slice(errorsBefore)}));
  }
  assert((await page.evaluate(()=>window.__csvClickSeen))>0,'iPhone WebKit touch must dispatch a real export click event');
  await fallback.waitFor({state:'visible',timeout:5000});
  assert.equal(await fallback.getAttribute('download'),'tokyo-concierge-shortlist.csv','Direct CSV has a real download filename');
  assert((await fallback.textContent()).includes('CSV'),'Language-aware CSV fallback label');
  const csvFile=await page.evaluate(async()=>{
    const url=document.querySelector('#csvDirectDownload').href;
    const response=await fetch(url);
    if(!response.ok)throw new Error('Generated CSV Blob is inaccessible');
    const buffer=await response.arrayBuffer();
    const bytes=new Uint8Array(buffer);
    return {url,bom:Array.from(bytes.slice(0,3)),text:new TextDecoder('utf-8').decode(bytes)};
  });
  assert(csvFile.url.startsWith('blob:'),'The accessible fallback points at a live CSV Blob');
  assert.deepEqual(csvFile.bom,[239,187,191],'CSV includes actual UTF-8 BOM bytes for Excel');
  assert(csvFile.text.includes('Name')&&csvFile.text.includes('Category')&&csvFile.text.split(/\r?\n/).length>=2,'CSV Blob contains expected heading and shortlisted venue row');
  const native=await dl;
  if(native){
    assert(native.suggestedFilename().endsWith('.csv'),'Native WebKit auto-download uses the correct filename');
    assert(fs.readFileSync(await native.path()).length>3,'Native file download is not empty');
  }else console.log('INFO iPhone WebKit emulation suppressed automatic download; the complete CSV Blob and visible manual download link were verified');
  // A no-op storage update from another tab must never revoke a valid CSV Blob.
  await page.evaluate(()=>{
    const unchanged=localStorage.getItem('atelier-shortlist-v2');
    window.dispatchEvent(new StorageEvent('storage',{key:'atelier-shortlist-v2',newValue:unchanged}));
  });
  assert(await fallback.isVisible(),'Unchanged external shortlist event must preserve Safari CSV fallback');
  assert.equal(await fallback.getAttribute('href'),csvFile.url,'Unchanged shortlist event must preserve the existing CSV Blob URL');
  await page.evaluate(()=>window.dispatchEvent(new StorageEvent('storage',{key:'atelier-shortlist-v2',newValue:'[]'})));
  assert(!await page.locator('#csvDownloadFallback').isVisible(),'Previously generated CSV is invalidated when guest selection changes in another tab');
  await page.locator('#tabs [data-cat="attraction"]').click();
  const studio=page.locator('#cards .card').filter({has:page.locator('[data-detail="a32"]')});
  assert.equal(await studio.count(),1,'Correct Meguro studio still indexed');
  await page.locator('#area').selectOption('Meguro');
  assert.equal(await studio.count(),1,'Meguro area filter in WebKit');
  await page.locator('#area').selectOption('Asakusa');
  assert.equal(await page.locator('[data-detail="a32"]').count(),0,'Asakusa does not include Meguro studio');
  await page.locator('#area').selectOption('Meguro');
  await page.locator('#language').selectOption('en');
  await studio.locator('.detail-trigger').click();
  assert(await page.locator('#detailDialog').evaluate(el=>el.open),'iPhone WebKit detail modal');
  await page.locator('#detailClose').click();
  await page.locator('#area').selectOption('');
  // Photo viewer needs to open/close at mobile width with attribution intact.
  const trigger=page.locator('[data-view-photo="a01"]');
  await trigger.click();
  assert(await page.locator('#photoDialog').evaluate(el=>el.open),'iPhone WebKit venue photo modal');
  assert.equal(await page.locator('#photoAttribution a').count(),2,'Photo credit and license present in Safari');
  assert((await page.locator('#photoDialog').boundingBox()).width<=390,'Photo modal fits iPhone');
  await page.locator('#photoClose').click();
  assert(!await page.locator('#photoDialog').evaluate(el=>el.open),'Photo modal closes in WebKit');
  // New isolated browser context: a simulated fresh Safari private session must
  // not inherit a previous tab's storage or receive stale cross-tab storage events.
  const blockedContext=await browser.newContext({...devices['iPhone 13'],acceptDownloads:true});
  const blocked=await blockedContext.newPage(),blockedErrors=[];
  blocked.on('pageerror',e=>blockedErrors.push(e.message));
  await blocked.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Storage blocked','QuotaExceededError')}});
  await blocked.goto(target,{waitUntil:'domcontentloaded',timeout:45000});
  await blocked.locator('#cards .card').first().waitFor();
  assert.equal(await blocked.locator('#guide .guide-item').count(),0,'Isolated private Safari session starts empty');
  await blocked.locator('#cards .card button[data-id]').first().click();
  // The warning is written by the click handler; WebKit can lag behind the click on the 200+ card page, so poll
  // for it instead of reading once, and report what the status line actually held if it never appears.
  const blockedWarning=/storage is blocked|保存機能|저장소/;
  const warned=await blocked.waitForFunction(re=>new RegExp(re).test(document.getElementById('interactionStatus').textContent),blockedWarning.source,{timeout:8000}).then(()=>true,()=>false);
  assert(warned,'Safari blocked storage warning (status was: '+JSON.stringify(await blocked.locator('#interactionStatus').textContent())+', shortlist items: '+await blocked.locator('#guide .guide-item').count()+')');
  assert.equal(await blocked.locator('#guide .guide-item').count(),1,'Blocked storage still allows temporary shortlist in the independent session');
  assert.deepEqual(jsErrors,[],'No iPhone WebKit page errors: '+jsErrors);
  assert.deepEqual(blockedErrors,[],'No blocked-storage WebKit runtime errors: '+blockedErrors);
  await blockedContext.close();
  await context.close();
  console.log('PASS WebKit iPhone '+target+': mobile width/search, photos and source quick-filters, EN/JA/KO persistence, actual cross-tab storage, CSV bytes and Safari fallback, detail/photo dialogs, safe blocked storage');
 }finally{
  if(context)await context.close().catch(()=>{});
  if(browser)await browser.close().catch(()=>{});
  if(server)await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{
 console.error(e);process.exitCode=1;
 // Surface the failing assertion as a GitHub annotation (job logs are not always retrievable).
 if(process.env.GITHUB_ACTIONS){
  const line=(e.stack||'').split('\n').find(l=>l.includes('webkit-mobile.cjs:'))||'';
  console.log('::error title=WebKit mobile regression::'+String(e.message||e).replace(/\r?\n/g,' ').slice(0,900)+' @ '+line.trim().slice(-80));
 }
});
