// Regression for location truth, shortlist/cross-tab state and blocked Safari storage.
// Run against both repository HTML and the deployed Pages revision.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const target=process.env.TEST_URL||'file://'+process.cwd()+'/index.html';
 const testUrl=new URL(target);
 testUrl.searchParams.set('guest','PRIVATE_TEST_GUEST');
 testUrl.searchParams.set('v','cache-test');
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(testUrl.toString(),{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('.card').first().waitFor();
 const stage2=await page.evaluate(()=>{
  const required=[parseSavedShortlist,invalidateCsvDownload,save,shortlistUrl,importShortlistHash,conciergeNote,hotelDirections,currentVenueLocation,esc,tr];
  const callable=required.every(fn=>typeof fn==='function');
  const untouched=DATA.length===180&&Object.keys(LICENSED_VENUE_PHOTOS).length===89&&Object.keys(AI_VENUE_VISUALS).length===50;
  const privacy=!shortlistUrl().includes('PRIVATE_TEST_GUEST')&&!shortlistUrl().includes('cache-test');
  const outside=CONCIERGE_GUIDANCE.w05.ko.includes('웨스틴')&&PLACE_ALIASES.r29.includes('쿠라스시');
  return {callable,untouched,privacy,outside};
 });
 assert.deepEqual(stage2,{callable:true,untouched:true,privacy:true,outside:true},'Extracted stage 2 functions, data, guide privacy, and search guidance parity');
 await page.locator('#tabs [data-cat="attraction"]').click();
 const area=page.locator('#area');
 assert(await area.locator('option').allTextContents().then(a=>a.includes('Meguro')),'Meguro selectable in attraction area filters');
 await area.selectOption('Meguro');
 const studio=page.locator('article.card').filter({has:page.locator('.detail-trigger[data-detail="a32"]')});
 assert.equal(await studio.count(),1,'Kimono WA appears in Meguro area');
 assert((await studio.locator('.venue-alert').textContent()).includes('Meguro'),'Exact Meguro alert retained');
 await studio.locator('.detail-trigger').click();
 assert.equal(await page.locator('#detailArea').textContent(),'Meguro','Detail area reflects exact studio address');
 await page.locator('#detailClose').click();
 await area.selectOption('Asakusa');
 assert.equal(await page.locator('.detail-trigger[data-detail="a32"]').count(),0,'Meguro studio not incorrectly shown in Asakusa');
 await area.selectOption('Meguro');
 const add=page.locator('article.card').filter({has:page.locator('.detail-trigger[data-detail="a32"]')}).locator('button[data-id="a32"]');
 await add.click();
 assert.equal(await page.locator('#guide .guide-item').count(),1,'Shortlist selected successfully');
 // A separate tab calling localStorage.clear() sends key=null (not the
 // shortlist key). A stale selection must not remain visible in this tab.
 await page.evaluate(()=>window.dispatchEvent(new StorageEvent('storage',{key:null,newValue:null,storageArea:localStorage})));
 assert.equal(await page.locator('#guide .guide-item').count(),0,'Cross-tab localStorage.clear removes stale recommendations');
 assert.equal(await page.locator('#shortlistBadge').textContent(),'0','Cleared shortlist count is synchronized');
 await add.click();
 assert.equal(await page.locator('#guide .guide-item').count(),1,'Shortlist still works after remote clear');
 // A malformed guest guide hash must not destroy a concierge's existing picks.
 // A valid guide continues importing normally. replaceState avoids unrelated
 // hashchange/navigation timing so this is a deterministic parser regression.
 const invalidGuide=await page.evaluate(()=>{
  history.replaceState(null,'',location.pathname+location.search+'#guide=NOT_A_REAL_VENUE');
  return importShortlistHash();
 });
 assert.equal(invalidGuide,false,'Reject a guest guide hash containing zero valid venue IDs');
 assert.equal(await page.locator('#guide .guide-item').count(),1,'Invalid guest guide hash does not erase existing shortlist');
 assert((await page.locator('#guide').textContent()).includes('Kimono Photo Studio WA'),'Existing selection stays intact after malformed link');
 const emptyGuide=await page.evaluate(()=>{
  history.replaceState(null,'',location.pathname+location.search+'#guide=');
  return importShortlistHash();
 });
 assert.equal(emptyGuide,false,'Empty link is not silently treated as a delete-all shortlist command');
 assert.equal(await page.locator('#guide .guide-item').count(),1,'Empty guide hash does not erase existing recommendations');
 const validGuide=await page.evaluate(()=>{
  history.replaceState(null,'',location.pathname+location.search+'#guide=a01');
  const loaded=importShortlistHash();
  if(loaded)render(); // hashchange listener also renders after successful import.
  return loaded;
 });
 assert.equal(validGuide,true,'Valid guest link remains importable');
 assert((await page.locator('#guide').textContent()).includes('Tokyo Tower'),'Valid guest link changes selected places as intended');
 await page.evaluate(()=>{
  history.replaceState(null,'',location.pathname+location.search+'#guide=a32');
  if(importShortlistHash())render();
 });
 const shared=new URL(await page.evaluate(()=>shortlistUrl()));
 if(testUrl.protocol==='file:'||['localhost','127.0.0.1','[::1]'].includes(testUrl.hostname)){
  assert.equal(shared.origin,'https://donghyeuk83-sudo.github.io','Local file or localhost share points to a reachable public host');
  assert.equal(shared.pathname,'/tokyo-concierge-atelier/','Local share uses the published catalogue path');
 }
 assert.equal(shared.search,'','Public shortlist URL must remove all arbitrary query parameters, not only cache-busting v');
 assert.equal(shared.hash,'#guide=a32','Public shortlist still contains the selected venue ID');
 assert(!shared.href.includes('PRIVATE_TEST_GUEST'),'Guest-like query data must never leak into a copied guide');
 await page.locator('#share').evaluate(el=>el.textContent='Link copied');
 await add.click();
 assert.equal(await page.locator('#share').textContent(),'Copy guide link','Share-button copied status clears when shortlist changes');
 // Simulate a second tab changing the same localStorage key.
 await page.evaluate(()=>window.dispatchEvent(new StorageEvent('storage',{key:'atelier-shortlist-v2',newValue:'["a32","invalid_venue"]'})));
 assert.equal(await page.locator('#guide .guide-item').count(),1,'Cross-tab shortlist imports valid IDs only');
 assert((await page.locator('#guide').textContent()).includes('Kimono Photo Studio WA'),'Correct cross-tab venue imported');
 await page.locator('.detail-trigger[data-detail="a32"]').click();
 assert.equal((await page.locator('#detailActions [data-id="a32"]').textContent()).trim(),'Remove','Detail button reflects selected state');
 await page.evaluate(()=>window.dispatchEvent(new StorageEvent('storage',{key:'atelier-shortlist-v2',newValue:'[]'})));
 assert.equal((await page.locator('#detailActions [data-id="a32"]').textContent()).trim(),'Add to shortlist','Open detail follows changes in other tabs');
 await page.locator('#detailClose').click();
 await page.evaluate(()=>window.dispatchEvent(new StorageEvent('storage',{key:'atelier-shortlist-v2',newValue:'{bad-json'})));
 assert.equal(await page.locator('#guide .guide-item').count(),0,'Corrupt stored shortlist safely clears without crashing');
 // A prepared CSV contains localized concierge notes; a later language switch
 // must never offer a stale file with text from the previous language.
 await add.click();
 await page.locator('#download').click();
 assert(await page.locator('#csvDownloadFallback').isVisible(),'Prepared CSV has a visible manual fallback');
 const preparedHref=await page.locator('#csvDirectDownload').getAttribute('href');
 assert(preparedHref?.startsWith('blob:'),'Prepared CSV fallback points to the current Blob');
 await page.locator('#language').selectOption('ja');
 assert(!await page.locator('#csvDownloadFallback').isVisible(),'Changing language invalidates the previously prepared CSV');
 assert.equal(await page.locator('#csvDirectDownload').getAttribute('href'),null,'Old-language CSV blob is no longer offered');
 assert.deepEqual(errors,[],'No JS errors during bad-storage, area, language or tab sync');

 const deniedContext=await browser.newContext({viewport:{width:390,height:844}});
 const denied=await deniedContext.newPage();const deniedErrors=[];
 denied.on('pageerror',e=>deniedErrors.push(e.message));
 await denied.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Storage unavailable','QuotaExceededError')}});
 await denied.goto(target,{waitUntil:'domcontentloaded',timeout:45000});
 await denied.locator('.card').first().waitFor();
 await denied.locator('.card button[data-id]').first().click();
 const status=await denied.locator('#interactionStatus').textContent();
 assert(/storage is blocked|保存機能が利用でき|저장소가 차단/.test(status),'Blocked or quota-full storage gets a usable in-page warning: '+status);
 assert((await denied.locator('#guide .guide-item').count())===1,'Shortlist remains usable in current session without storage');
 assert.deepEqual(deniedErrors,[],'Blocked storage does not crash runtime');
 await deniedContext.close();await context.close();await browser.close();
 console.log('PASS '+target+': verified Meguro venue indexing, cross-tab shortlist, malformed storage recovery, share-state reset and blocked-storage warnings');
})().catch(e=>{
 console.error(e);
 // Surface the failing assertion as a GitHub annotation (job logs are not always retrievable).
 if(process.env.GITHUB_ACTIONS){
  const line=(e.stack||'').split('\n').find(l=>l.includes('state-regression.cjs:'))||'';
  console.log('::error title=Shortlist/state regression::'+String(e.message||e).replace(/\r?\n/g,' ').slice(0,900)+' @ '+line.trim().slice(-80)+(process.env.TEST_URL?' [deployed]':' [repo]'));
 }
 process.exit(1);
});
