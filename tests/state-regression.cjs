// Regression for location truth, shortlist/cross-tab state and blocked Safari storage.
// Run against both repository HTML and the deployed Pages revision.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const target=process.env.TEST_URL||'file://'+process.cwd()+'/index.html';
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(target,{waitUntil:'domcontentloaded',timeout:45000});
 await page.locator('.card').first().waitFor();
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
 assert.deepEqual(errors,[],'No JS errors during bad-storage, area or tab sync');

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
})().catch(e=>{console.error(e);process.exit(1)});
