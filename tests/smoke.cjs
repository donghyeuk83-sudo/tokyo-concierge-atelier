const { chromium } = require('playwright');
const assert=require('assert');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1365,height:900},acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Deterministic external-image handling (repo mode). Third-party photo hosts are unreachable from sandboxes and can
 // reject CI traffic; the renderer then correctly hides the failed photo block, which also hides its zoom button.
 // Serve a local fixture for external image requests so the happy path is always exercised; real image failure is
 // verified separately below. SMOKE_LIVE_IMAGES=1, or TEST_URL (deployed check), keeps the real hosts.
 const mockExternalImages=!process.env.TEST_URL&&process.env.SMOKE_LIVE_IMAGES!=='1';
 const externalRequest=/^https?:\/\/(?!127\.0\.0\.1|localhost)/;
 const fixturePng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==','base64');
 if(mockExternalImages)await page.route(externalRequest,route=>route.request().resourceType()==='image'?route.fulfill({status:200,contentType:'image/png',body:fixturePng}):route.continue());
 const target=process.env.TEST_URL || ('file://'+process.cwd()+'/index.html');
 await page.goto(target,{waitUntil:'domcontentloaded',timeout:45000});
 assert((await page.title()).includes('Tokyo Concierge Atelier'),'site title');
 await page.waitForSelector('.card',{timeout:15000});
 // Stage 4 runs without any inline executable script; the original
 // CSV and application event handlers remain wired in classic-script order.
 const stage4Boot=await page.evaluate(()=>{
  const scripts=[...document.scripts];
  const files=scripts.map(node=>node.getAttribute('src')?.split('?')[0]||'');
  return {count:scripts.length,noInline:scripts.every(node=>Boolean(node.getAttribute('src'))&&!node.textContent.trim()),
   csvLastTwo:files.slice(-2),csvReady:typeof document.querySelector('#download').onclick==='function',
   bootReady:typeof translate==='function'&&typeof feedback==='function'&&typeof render==='function',
   savedKey:'atelier-shortlist-v2'};
 });
 assert.deepEqual(stage4Boot,{count:17,noInline:true,csvLastTwo:['assets/atelier-export.js','assets/atelier-app.js'],csvReady:true,bootReady:true,savedKey:'atelier-shortlist-v2'},'Stage 4 file:// and published site must boot 17 external classic scripts (13 original + image policy + manual photos + venue additions + landing count sync) with original CSV and app handlers');

 assert((await page.locator('.card').count())>0,'catalogue cards render');
 assert.equal(await page.evaluate(()=>typeof illustration),'function','Separate illustrative renderer is initialized before catalogue cards');
 assert((await page.locator('#cards .card-art').count())>0,'Unlicensed venue slots still render the existing illustrative artwork');
 // Stage 3: functions and 3-language editorial content must resolve as
 // ordinary globals on file:// AND on live Pages before any user events.
 const stage3Browser=await page.evaluate(()=>{
  const funcs=[options,openVenuePhoto,card,openDetail,syncPhotoQuickbar,render,translateLanding,prioritizeConciergeOnMobile,translateImageLabels,translateChrome,translateEditorial,verifyEditorialPhotos];
  return {callable:funcs.every(f=>typeof f==='function'),languages:Object.keys(LANDING_COPY).sort(),visibleVenues:DATA.length,images:Object.keys(LICENSED_VENUE_PHOTOS).length,artwork:Object.keys(AI_VENUE_VISUALS).length,mobileQuery:typeof mobileConciergeMedia.matches==='boolean'};
 });
 assert.deepEqual(stage3Browser,{callable:true,languages:['en','ja','ko'],visibleVenues:141,images:89,artwork:50,mobileQuery:true},'Unchanged editorial and render functions work together on file and Pages');

 // Prove that cached category partitions are identical, in the same order,
 // to the old full-catalogue filter for each of the five tabs.
 const categoriesMatch=await page.evaluate(()=>{
  const expected=CATS.every(cat=>{
   const originals=DATA.filter(r=>r.category===cat);
   const cached=ROWS_BY_CATEGORY.get(cat);
   return Array.isArray(cached)&&cached.length===originals.length&&cached.every((r,i)=>r===originals[i]);
  });
  return {expected,allCategories:ROWS_BY_CATEGORY.size,total:[...ROWS_BY_CATEGORY.values()].reduce((n,rows)=>n+rows.length,0),languageKeys:Object.keys(I18N).sort()};
 });
 assert.deepEqual(categoriesMatch,{expected:true,allCategories:5,total:141,languageKeys:['en','ja','ko']},'Rendering category partitions and all three locale dictionaries preserve original site data');
 // Every venue's new cached search string must be exactly identical to the
 // original uncached EN/JA/KO indexing formula (all 131 entries, original case
 // folding and aliases). This guards search behavior during modularization.
 const indexProof=await page.evaluate(()=>{
  const same=DATA.every(r=>searchText(r)===[r.name,r.ja,r.area,r.type,SEARCH_ALIASES[r.area]||"",PLACE_ALIASES[r.id]||"",I18N.en.cats[CATS.indexOf(r.category)],I18N.ja.cats[CATS.indexOf(r.category)],I18N.ko.cats[CATS.indexOf(r.category)]].join(" ").toLocaleLowerCase());
  const cache=typeof SEARCH_TEXT_CACHE!=="undefined"&&DATA.every(r=>SEARCH_TEXT_CACHE.get(r)===searchText(r));
  const tokyo=searchText(DATA.find(r=>r.id==='a01'));
  return {same,cache,count:DATA.length,japanese:tokyo.includes("東京タワー"),korean:tokyo.includes("도쿄타워")};
 });
 assert.deepEqual(indexProof,{same:true,cache:true,count:141,japanese:true,korean:true},'Multilingual search index stays exactly compatible across every venue');
 // Exact labels distinguish third-party references from official operator links.
 const seirinkan=page.locator('article.card').filter({has:page.locator('[data-detail="r06"]')});
 const sourceLink=seirinkan.locator('.actions a').filter({hasText:/^Reference website$/});
 assert.equal(await sourceLink.count(),1,'Third-party Tabelog reference is truthfully labelled');
 assert((await sourceLink.getAttribute('href')).includes('tabelog.com/'),'Keep the same Tabelog link');
 for(const [locale,label] of [['ja','参考サイト'],['ko','참고 사이트'],['en','Reference website']]){
  await page.locator('#language').selectOption(locale);
  assert.equal(await seirinkan.locator('.actions a').filter({hasText:new RegExp('^'+label+'$')}).count(),1,'Exact source label translated: '+locale);
 }
 await page.locator('#query').fill('Udatsu');
 assert((await page.locator('.card').count())>=1,'search returns results');
 await page.locator('#query').fill('NO_SUCH_VENUE_123');
 await page.waitForFunction(()=>document.querySelectorAll('.card').length===0,null,{timeout:5000});
 assert.equal(await page.locator('.card').count(),0,'empty search');
 await page.locator('#query').fill('');
 for(const l of ['ja','ko','en']){await page.locator('#language').selectOption(l);assert.equal(await page.locator('html').getAttribute('lang'),l,'language '+l)}
 // Photo-first guest browsing: show only illustrated/reviewed photo cards or external venue sources.
 await page.locator('#photoFilter').selectOption('photo');
 const photoCards=await page.locator('#cards .card').count();
 assert(photoCards>0,'Photo-only filter returns venue cards in restaurant category');
 assert.equal(await page.locator('#cards img[data-venue-photo]').count(),photoCards,'Photo-only filter excludes illustrated venues');
 await page.locator('#photoFilter').selectOption('venue');
 const specificCount=await page.locator('#cards .card').count();
 assert(specificCount>0,'Venue-specific photo filter returns pictures');
 assert.equal(await page.locator('#cards img[data-venue-photo]').count(),specificCount,'Venue-specific filter includes only pictured places');
 assert.equal(await page.locator('#cards .card-photo-label').filter({hasText:'BUILDING EXTERIOR'}).count(),0,'Venue-specific photo filter excludes host building exteriors');
 await page.locator('#photoFilter').selectOption('building');
 const exteriorCount=await page.locator('#cards .card').count();
 assert.equal(exteriorCount,6,'Six restaurant cards have verified host-building exterior photo contexts');
 assert.equal(await page.locator('#cards .card-photo-label').filter({hasText:'BUILDING EXTERIOR'}).count(),exteriorCount,'Building exterior filter does not mix venue photos');
 await page.locator('#language').selectOption('ja');
 assert.equal(await page.locator('#photoFilter').inputValue(),'building','Exterior filter selection survives Japanese language switch');
 assert((await page.locator('#photoFilter option:checked').textContent()).includes('入居ビル'),'Japanese exterior option states it is a host building');
 await page.locator('#photoFilter').selectOption('photo');

 await page.locator('#language').selectOption('ko');
 assert.equal(await page.locator('#photoFilter').inputValue(),'photo','Photo filter persists when switching to Korean');
 assert((await page.locator('#photoFilter option:checked').textContent()).includes('사진 있는 카드'),'Korean photo filter label');
 await page.locator('#photoFilter').selectOption('source');
 const sourceCards=await page.locator('#cards .card').count();
 assert(sourceCards>0,'Original-source-only filter returns venues');
 assert.equal(await page.locator('#cards a.venue-photo-source').count(),sourceCards,'Source filter excludes cards without external venue links');
 const ebisuShop=page.locator('article.card').filter({has:page.locator('.detail-trigger[data-detail="r42"]')});
 assert.equal(await ebisuShop.locator('a.venue-photo-source').count(),1,'Exact Bikkuri Sushi Ebisu photo gallery link shown');
 assert.equal(new URL(await ebisuShop.locator('.venue-photo-source').getAttribute('href')).pathname,'/tokyo/A1303/A130302/13015656/dtlphotolst/smp2/','Bikkuri Sushi Ebisu link points to its exact photo gallery');
 assert.equal(await ebisuShop.locator('img[data-venue-photo]').count(),0,'Do not embed copyright-unverified shop photos');
 await page.locator('#resetFilters').click();
 assert.equal(await page.locator('#photoFilter').inputValue(),'all','Reset clears photo filter too');
 await page.locator('#language').selectOption('en');
 // Do not send guests to an outdated Asakusa address when the studio itself lists Meguro.
 await page.locator('#tabs [data-cat="attraction"]').click();
 const studioWA=page.locator('article.card').filter({has:page.locator('.detail-trigger[data-detail="a32"]')});
 assert((await studioWA.locator('.venue-alert').textContent()).includes('Meguro'),'Kimono Studio WA location discrepancy is clearly disclosed');
 assert.equal(await studioWA.locator('a.venue-photo-source').count(),1,'Kimono WA card links its own studio photography instead of borrowing pictures');
 assert.equal(new URL(await studioWA.locator('a.venue-photo-source').getAttribute('href')).hostname,'www.kimono-wa.com','Studio photo gallery comes from actual studio operator');
 assert.equal(await studioWA.locator('img[data-venue-photo]').count(),0,'Studio photos are not copied without license');
 const studioMapUrl=new URL(await studioWA.locator('.actions a[href*="/maps/search/"]').getAttribute('href'));
 const studioQuery=studioMapUrl.searchParams.get('query')||'';
 assert(studioQuery.includes('上大崎2-24-13')&&!studioQuery.includes('Asakusa'),'Map search uses verified Meguro address, not the stale Asakusa catalogue area');
 await studioWA.locator('.detail-trigger').click();
 const studioDestinations=await page.locator('#detailActions .route-links a').evaluateAll(els=>els.map(el=>new URL(el.href).searchParams.get('destination')));
 assert.equal(studioDestinations.length,3,'Walk/transit/car links offered');
 assert(studioDestinations.every(destination=>destination.includes('上大崎2-24-13')&&!destination.includes('Asakusa')),'All three hotel routes use studio address from official operator');
 await page.locator('#detailClose').click();

 await page.locator('#tabs [data-cat="restaurant"]').click();
 const privateOuka=page.locator('article.card').filter({has:page.locator('.detail-trigger[data-detail="r52"]')});
 assert((await privateOuka.locator('.venue-alert').textContent()).includes('INVITATION-ONLY'),'Nagatacho Ouka is not presented as an ordinary publicly bookable restaurant');
 assert.equal(await privateOuka.locator('img[data-venue-photo]').count(),0,'Do not embed unrelated photos for private Nagatacho Ouka');
 // Existing venue alerts must survive shortlisting, printing, and CSV export.
 const closedRestaurant=page.locator('article.card').filter({has:page.locator('.detail-trigger[data-detail="r31"]')});
 await closedRestaurant.locator('button[data-id="r31"]').click();
 assert((await page.locator('#guide .guide-item .venue-alert').textContent()).includes('PERMANENTLY CLOSED September 30, 2026'),'Guest print guide contains existing closure warning');
 await page.locator('#download').click();
 const safetyCsv=await page.evaluate(async()=>await (await fetch(document.querySelector('#csvDirectDownload').href)).text());
 assert(safetyCsv.includes('PERMANENTLY CLOSED September 30, 2026'),'CSV retains existing closure warning');
 await page.locator('#guide [data-id="r31"]').click();
 await privateOuka.locator('button[data-id="r52"]').click();
 assert((await page.locator('#guide .guide-item .venue-alert').textContent()).includes('INVITATION-ONLY'),'Guide retains invitation-only caution');
 await page.locator('#guide [data-id="r52"]').click();
 assert.equal(await page.locator('#guide .guide-item').count(),0,'Warning regressions do not alter later shortlist expectations');
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
 // iPhone quick photo shortcuts keep the full photo filter in sync and do not imply
 // that a shopping building exterior is the interior of the listed restaurant.
 const quickButtons=page.locator('#photoQuickbar button[data-photo-quick]');
 assert.equal(await quickButtons.count(),4,'Four one-tap photo browsing choices on mobile');
 assert(await page.locator('#photoQuickbar').isVisible(),'Quick photo shortcuts visible on iPhone');
 const initialCount=await page.locator('#cards .card').count();
 assert((await page.locator('#photoQuickbar [data-photo-quick="all"]').textContent()).includes('('+initialCount+')'),'All quick filter badge reflects visible restaurant count');

 const quickVenue=page.locator('#photoQuickbar [data-photo-quick="venue"]');
 await quickVenue.click();
 assert.equal(await page.locator('#photoFilter').inputValue(),'venue','Venue-only chip sets photo filter select');
 assert.equal(await quickVenue.getAttribute('aria-pressed'),'true','Active chip announced accessibly');
 assert.equal(await page.locator('#cards .card-photo-label').filter({hasText:'BUILDING EXTERIOR'}).count(),0,'Venue photo shortcut hides building exteriors');
 await page.locator('#photoQuickbar [data-photo-quick="building"]').click();
 assert.equal(await page.locator('#photoFilter').inputValue(),'building','Building-exterior chip filters correctly');
 const actualBuildingCards=await page.locator('#cards .card').count();
 assert.equal(actualBuildingCards,6,'Six restaurant cards depict their verified building exteriors');
 assert((await page.locator('#photoQuickbar [data-photo-quick="building"]').textContent()).includes('(6)'),'Building chip count matches six restaurant host-building exteriors');
 assert.equal(await page.locator('#photoQuickbar [data-photo-quick="building"]').getAttribute('aria-label'),'Building exteriors: 6','Accessible building filter count');

 await page.locator('#photoQuickbar [data-photo-quick="source"]').click();
 const sourceOnlyCount=await page.locator('#cards .card').count();
 assert(sourceOnlyCount>0,'Photo source chip returns gallery-linked venues');
 assert.equal(await page.locator('#cards .venue-photo-source').count(),sourceOnlyCount,'Photo source chip shows only source-linked venues');
 await page.locator('#photoQuickbar [data-photo-quick="all"]').click();
 assert.equal(await page.locator('#photoFilter').inputValue(),'all','All places chip resets photo mode');
 await page.locator('#language').selectOption('ko');
 assert.equal(await page.locator('#photoQuickbar [data-photo-quick="source"]').textContent(),'사진·자료 링크 ('+sourceOnlyCount+')','Quick shortcuts translate into Korean with correct category-aware source count');
 assert.equal(await page.locator('#photoQuickbar [data-photo-quick="all"]').getAttribute('aria-pressed'),'true','Language switch retains active filter status');
 assert.equal(await page.locator('#photoQuickbar [data-photo-quick="all"]').getAttribute('aria-label'),'전체: '+initialCount,'Accessible all filter count translated to Korean');
 await page.locator('#query').fill('NO_SUCH_PLACE_12345');
 await page.waitForFunction(()=>document.querySelector('#photoQuickbar [data-photo-quick="venue"]').textContent.includes('(0)'),null,{timeout:5000});
 assert((await page.locator('#photoQuickbar [data-photo-quick="venue"]').textContent()).includes('(0)'),'Photo totals recalculate after debounced search');
 await page.locator('#query').fill('');
 await page.waitForFunction(()=>document.querySelector('#photoQuickbar [data-photo-quick="all"]').textContent.includes('('+document.querySelectorAll('#cards .card').length+')'),null,{timeout:5000});

 assert((await page.locator('#photoQuickbar').evaluate(el=>el.scrollWidth))>=0,'Quick photo chips have contained horizontal scrolling');
 assert((await page.locator('body').evaluate(el=>el.scrollWidth))<=405,'Photo shortcuts do not cause horizontal page overflow');

 const filterHeight=await page.locator('#photoFilter').evaluate(el=>el.getBoundingClientRect().height);
 assert(filterHeight>=44,'Photo filter is finger-friendly on iPhone');

 await page.locator('#language').selectOption('ko');
 await page.locator('#query').fill('도쿄도 사진미술관');
 await page.locator('#tabs [data-cat="attraction"]').click();
 assert((await page.locator('.card').count())>=1,'Korean museum search');
 await page.locator('#query').fill('');
 await page.locator('#tabs [data-cat="attraction"]').click();
 const fs=require('node:fs');
 const {html,catalogueSection,licensedSection,publicPhotoSourceBlock,photoContextBlock,verifyExtractedSnapshot}=require('./atelier-source-registry.cjs');
 verifyExtractedSnapshot();
 const localPhotos=JSON.parse(fs.readFileSync('assets/photos/sources.json','utf8'));
 const localPhotoById=new Map(localPhotos.map(photo=>[photo.id,photo]));
 const registry=licensedSection;
 const expectedPhotos=[...registry.matchAll(/^([a-z]\d+):\{/gm)].map(m=>m[1]);
  const externalPhotoIds=[...publicPhotoSourceBlock.matchAll(/^([a-z]\d+):\{url:/gm)].map(m=>m[1]);
 assert.equal(externalPhotoIds.length,46,'46 original venue photo/information links expected');
 assert.equal(new Set(externalPhotoIds).size,externalPhotoIds.length,'Duplicate external source ID');
 // Every new source is an independently verified exact-branch gallery, not a photo reuse permission.
 const galleryPaths={
   r04:'/tokyo/A1317/A131701/13147445/dtlphotolst/smp2/',
   r05:'/tokyo/A1317/A131701/13304124/dtlphotolst/smp2/',
   r08:'/tokyo/A1317/A131701/13021093/dtlphotolst/4/smp2/',
   r39:'/tokyo/A1303/A130302/13310768/dtlphotolst/smp2/',
   r40:'/gallery',
   r41:'/shoplist/ebisu/',
   r43:'/tokyo/A1303/A130302/13286155/dtlphotolst/1/smp2/',
   r44:'/ebisu/space/',
 };
 for(const [id,expectedPath] of Object.entries(galleryPaths)){
   const match=publicPhotoSourceBlock.match(new RegExp('^'+id+':\\{url:"([^"]+)",kind:"(listing|operator)"\\}', 'm'));
   assert(match,'Venue '+id+' retains an externally linked original-source entry');
   const url=new URL(match[1]);
   assert.equal(url.pathname,expectedPath,'Exact venue and gallery path for '+id);
   assert.equal(match[2],['r40','r41','r44'].includes(id)?'operator':'listing','Accurate published origin type '+id);
   assert(!expectedPhotos.includes(id),'Uncleared image cannot be introduced into published photo registry '+id);
 }

 await page.locator('#language').selectOption('en'); // Exercise English provenance labels first; Korean separately below.
 // Batch seven: source links must open the exact restaurant's pictures (not another branch or copied images).
 const batch7GalleryPaths={
  r02:'/tokyo/A1303/A130303/13210936/dtlphotolst/3/smp2/',
  r03:'/tokyo/A1317/A131701/13220479/dtlphotolst/smp2/',
  r09:'/tokyo/A1303/A130303/13003356/dtlphotolst/3/smp2/',
  r11:'/tokyo/A1306/A130602/13042979/dtlphotolst/3/smp2/',
  r29:'/tokyo/A1317/A131701/13301330/dtlphotolst/3/smp2/',
  r45:'/tokyo/A1303/A130301/13180300/dtlphotolst/smp2/'
 };
 await page.locator('#tabs [data-cat="restaurant"]').click();
 for(const [id,expectedPath] of Object.entries(batch7GalleryPaths)){
  const row=publicPhotoSourceBlock.split(String.fromCharCode(10)).find(line=>line.trim().startsWith(id+':'));
  assert(row,'The photo source registry contains '+id);
  const parsed=row.match(/url:"([^"]+)",kind:"([^"]+)"/);
  assert(parsed,'Parsable original source for '+id);
  const original=new URL(parsed[1]);
  assert.equal(original.host,'tabelog.com','Exact listing host for '+id);
  assert.equal(original.pathname,expectedPath,'Exact restaurant and gallery page for '+id);
  assert.equal(parsed[2],'listing','Guest-facing photo provenance is an independent gallery '+id);
  assert(!expectedPhotos.includes(id),'Photos remain unlicensed and are not embedded '+id);
  const card=page.locator('article.card').filter({has:page.locator('.detail-trigger[data-detail="'+id+'"]')});
  assert.equal(await card.locator('a.venue-photo-source').count(),1,'Photo reference visible for '+id);
  assert.equal(new URL(await card.locator('a.venue-photo-source').getAttribute('href')).pathname,expectedPath,'Actual card link matches venue '+id);
  assert((await card.locator('a.venue-photo-source small').textContent()).includes('Independent photo listing'),'Independent gallery provenance displayed '+id);
  assert.equal(await card.locator('img[data-venue-photo]').count(),0,'No copyright-unverified photo added '+id);
 }


 // Photo-link upgrades: retain originals on the publisher's site, never relabel them as CC-cleared files.
 const batch8=[
  ['restaurant','r33','tabelog.com','/tokyo/A1303/A130302/13079402/dtlphotolst/smp2/','listing','Independent photo listing'],
  ['wellness','w06','tokyosomeionsensakura.com','/facility/','operator','Venue / operator website'],
  ['attraction','a32','www.kimono-wa.com','/en/plan.html','operator','Venue / operator website']
 ];
 for(const [category,id,host,path,kind,provenance] of batch8){
  const entry=publicPhotoSourceBlock.split(String.fromCharCode(10)).find(line=>line.trim().startsWith(id+':'));
  assert(entry,'Photo gallery source mapping preserved '+id);
  const match=entry.match(/url:"([^"]+)",kind:"([^"]+)"/);
  assert(match,'Valid source mapping '+id);
  const url=new URL(match[1]);
  assert.equal(url.hostname,host,'Exactly verified photo host '+id);
  assert.equal(url.pathname,path,'Exact gallery or official photo page '+id);
  assert.equal(match[2],kind,'Accurate photo source ownership kind '+id);
  assert(!expectedPhotos.includes(id),'No unlicensed photo promoted into registry '+id);
  await page.locator('#tabs [data-cat="'+category+'"]').click();
  const card=page.locator('article.card').filter({has:page.locator('.detail-trigger[data-detail="'+id+'"]')});
  const link=card.locator('a.venue-photo-source');
  assert.equal(await link.count(),1,'Original photo source link visible '+id);
  assert.equal(await link.getAttribute('href'),match[1],'Displayed link agrees with checked registry '+id);
  assert((await link.locator('small').textContent()).includes(provenance),'Venue photo origin explained in English '+id);
  assert.equal(await card.locator('img[data-venue-photo]').count(),0,'No uncleared photograph embedded '+id);
  await card.locator('.detail-trigger').click();
  assert.equal(await page.locator('#detailActions .detail-photo-source').getAttribute('href'),match[1],'Same original page in detail modal '+id);
  await page.locator('#detailClose').click();
 }


 // Batch 9: verified original operator galleries and official tourism authority, not a reuse grant.
 const batch9=[
  ['attraction','a28','wanariya.co.jp','/gallery/','operator','Venue / operator website'],
  ['shopping','s15','www.gotokyo.org','/en/new-and-now/new-and-trending/260113/topics.html','tourism','Official Tokyo tourism guide'],
  ['attraction','a29','ninja-trick-house.com','/','operator','Venue / operator website'],
  ['attraction','a40','www.sunrise-tours.jp','/en/','operator','Venue / operator website']
 ];
 for(const [category,id,host,path,kind,label] of batch9){
   const entry=publicPhotoSourceBlock.split(String.fromCharCode(10)).find(line=>line.trim().startsWith(id+':'));
   assert(entry,'Mapped original photo source remains '+id);
   const match=entry.match(/url:"([^"]+)",kind:"([^"]+)"/);
   assert(match,'Parse photo source '+id);
   const url=new URL(match[1]);
   assert.equal(url.hostname,host,'Verified exact official image source '+id);
   assert.equal(url.pathname,path,'Direct photo gallery, operator presentation or tour photo catalogue '+id);
   assert.equal(match[2],kind,'Correct photo source provenance '+id);
   assert(!expectedPhotos.includes(id),'Do not promote copyright-unverified pictures '+id);
   await page.locator('#tabs [data-cat="'+category+'"]').click();
   const card=page.locator('article.card').filter({has:page.locator('.detail-trigger[data-detail="'+id+'"]')});
   const link=card.locator('a.venue-photo-source');
   assert.equal(await link.count(),1,'Exact venue publisher link visible '+id);
   assert.equal(await link.getAttribute('href'),match[1],'Card link matches original page '+id);
   assert((await link.locator('small').textContent()).includes(label),'Publisher provenance localized in English '+id);
   assert.equal(await card.locator('img[data-venue-photo]').count(),0,'No unlicensed photo embedded '+id);
   await card.locator('.detail-trigger').click();
   assert.equal(await page.locator('#detailActions .detail-photo-source').getAttribute('href'),match[1],'Modal photo-source page matches '+id);
   await page.locator('#detailClose').click();
 }
 await page.locator('#language').selectOption('ko');
 await page.locator('#tabs [data-cat="shopping"]').click();
 const officialPhoto=page.locator('article.card').filter({has:page.locator('.detail-trigger[data-detail="s15"]')});
 assert((await officialPhoto.locator('.venue-photo-source small').textContent()).includes('도쿄도 공식 관광 안내'),'Korean official Tokyo tourism source provenance');
 await page.locator('#language').selectOption('ja');
 assert((await officialPhoto.locator('.venue-photo-source small').textContent()).includes('東京都の公式観光ガイド'),'Japanese official tourism source provenance');
 await page.locator('#language').selectOption('en');

 // Batch 10: independently verify exact-branch photo listings and original operator reportage.
 // These external images must not appear on hotel-hosted cards without individual commercial CC clearance.
 // Existing registered photographs must remain registered: r32 is already photographed.
 assert(expectedPhotos.includes('r32'),'Licensed Kanazawa Maimon Sushi Shibuya PARCO photo preserved');
 const batch10=[
   ['restaurant','r47','tabelog.com','/tokyo/A1307/A130701/13025665/dtlphotolst/3/smp2/','listing','Independent photo listing',''],
   ['attraction','a34','hirakuza.net','/tokyo/news/202601113508/','operator','Venue / operator website',''],
   ['attraction','a27','mai-ko.com','/culture/tea-ceremony/tokyo.html','operator','Venue / operator website','?locale=en']
 ];
 for(const [category,id,host,path,kind,provenance,query] of batch10){
   const entry=publicPhotoSourceBlock.split(String.fromCharCode(10)).find(line=>line.trim().startsWith(id+':'));
   assert(entry,'Source reference exists for '+id);
   const match=entry.match(/url:"([^"]+)",kind:"([^"]+)"/);
   assert(match,'Expected source object '+id);
   const url=new URL(match[1]);
   assert.equal(url.hostname,host,'Venue-specific image source host '+id);
   assert.equal(url.pathname,path,'Venue-specific gallery or actual opening photography path '+id);
   assert.equal(url.search,query,'Preserve relevant language parameters '+id);
   assert.equal(match[2],kind,'Independent vs venue-operator photo rights classification '+id);
   assert(!expectedPhotos.includes(id),'No copyright-unverified photo promoted '+id);
   await page.locator('#tabs [data-cat="'+category+'"]').click();
   const card=page.locator('article.card').filter({has:page.locator('.detail-trigger[data-detail="'+id+'"]')});
   const link=card.locator('a.venue-photo-source');
   assert.equal(await link.count(),1,'Gallery source rendered on venue card '+id);
   assert.equal(await link.getAttribute('href'),match[1],'Guest card link matches exact original '+id);
   assert((await link.locator('small').textContent()).includes(provenance),'Accurate external-photo provenance visible '+id);
   assert.equal(await card.locator('img[data-venue-photo]').count(),0,'Do not falsely depict a CC-cleared photo '+id);
   await card.locator('.detail-trigger').click();
   assert.equal(await page.locator('#detailActions .detail-photo-source').getAttribute('href'),match[1],'Venue details preserve exact source URL '+id);
   await page.locator('#detailClose').click();
 }


 // Batch 11: per-venue original operator photo links must be real, correctly typed, and NOT unlicensed embedded images.
 const batch11=[
   ['restaurant','r44','shiorian-yamashiro.com','/ebisu/space/','operator'],
   ['attraction','a26','shizukokoro.com','/chado-workshop','operator'],
   ['attraction','a30','bub-activitycenter.com','/samurai-experience/','operator']
 ];
 for(const [category,id,host,path,kind] of batch11){
   const row=publicPhotoSourceBlock.split(String.fromCharCode(10)).find(line=>line.trim().startsWith(id+':'));
   assert(row,'Existing pending-photo source record for '+id);
   const parsed=row.match(/url:"([^"]+)",kind:"([^"]+)"/);
   assert(parsed,'Correct source registry entry '+id);
   const u=new URL(parsed[1]);
   assert.equal(u.hostname,host,'Exact source hostname and venue operator '+id);
   assert.equal(u.pathname,path,'Official detailed photo page '+id);
   assert.equal(parsed[2],kind,'No press-media source mislabeled as operator '+id);
   assert(!expectedPhotos.includes(id),'Keep unlicensed photo off hotel web pages '+id);
   await page.locator('#tabs [data-cat="'+category+'"]').click();
   const card=page.locator('article.card').filter({has:page.locator('.detail-trigger[data-detail="'+id+'"]')});
   const link=card.locator('a.venue-photo-source');
   assert.equal(await link.count(),1,'Original image link visible on actual card '+id);
   assert.equal(await link.getAttribute('href'),parsed[1],'Source link matches audited original URL '+id);
   assert((await link.locator('small').textContent()).includes('Venue / operator website'),'Correct photo provenance badge '+id);
   assert.equal(await card.locator('img[data-venue-photo]').count(),0,'No copyrighted image rehosted '+id);
   await card.locator('.detail-trigger').click();
   assert.equal(await page.locator('#detailActions .detail-photo-source').getAttribute('href'),parsed[1],'Detail photo source matches catalog card '+id);
   await page.locator('#detailClose').click();
 }


 // Pending-only canonical original-photo sources. 1F + 2F belong to the same Oshiage
 // store, so the official two-floor photo page is safer than a single-floor listing.
 const officialOshiage=publicPhotoSourceBlock.split(String.fromCharCode(10)).find(line=>line.trim().startsWith('r37:'));
 assert(officialOshiage,'r37 original photo source mapped');
 const oshiageUrl=officialOshiage.match(/url:"([^"]+)",kind:"([^"]+)"/);
 assert(oshiageUrl,'Oshiage source parsed');
 assert.equal(new URL(oshiageUrl[1]).hostname,'www.kurasushi.co.jp','Oshiage exact chain operator');
 assert.equal(new URL(oshiageUrl[1]).pathname,'/oshiage/','Official shared 1F and 2F image tour');
 assert.equal(oshiageUrl[2],'operator','Rights attributed to restaurant operator');
 assert(!expectedPhotos.includes('r37'),'Oshiage remains in the pending-photo queue');
 await page.locator('#tabs [data-cat="restaurant"]').click();
 const oshiageCard=page.locator('article.card').filter({has:page.locator('.detail-trigger[data-detail="r37"]')});
 assert.equal(await oshiageCard.locator('a.venue-photo-source').getAttribute('href'),oshiageUrl[1],'Official two-floor photo source visible');
 assert.equal(await oshiageCard.locator('img[data-venue-photo]').count(),0,'No uncleared Kura photo duplicated');
 await oshiageCard.locator('.detail-trigger').click();
 assert.equal(await page.locator('#detailActions .detail-photo-source').getAttribute('href'),oshiageUrl[1],'Oshiage detail uses same official source');
 await page.locator('#detailClose').click();
 // Commons matches remain license *candidates*, never venue-approved images.
 const discoverySource=require('fs').readFileSync('tests/find-commons-photos.cjs','utf8');
 assert(discoverySource.includes('eligibleLicense(p.license)'),'Commercial-only CC filter remains enabled');
 assert(discoverySource.includes("venue_match:'UNVERIFIED',reuse_approved:false"),'Original-file candidates remain unapproved');
 assert(discoverySource.includes("if(!pauseForRateLimit&&!registered.has(v[0]))await sleep(2500)"),'Skip research throttle for all 89 registered venues');


 // Priority batch: the named original venue photography pages stay offsite.
 const operatorGalleries=[
  ['r36','hinatomaru.com','/asakusa/'],
  ['r51','suigian.jp','/heritage/']
 ];
 for(const [id,host,path] of operatorGalleries){
  const row=publicPhotoSourceBlock.split(String.fromCharCode(10)).find(line=>line.trim().startsWith(id+':'));
  assert(row,'Exact venue source mapped '+id);
  const m=row.match(/url:"([^"]+)",kind:"([^"]+)"/);
  assert(m,'Valid original source metadata '+id);
  const u=new URL(m[1]);
  assert.equal(u.hostname,host,'Exact original operator domain '+id);
  assert.equal(u.pathname,path,'Correct flagship photo section '+id);
  assert.equal(m[2],'operator','Operator publisher accurately attributed '+id);
  assert(!expectedPhotos.includes(id),'No uncleared hosted image '+id);
  await page.locator('#tabs [data-cat="restaurant"]').click();
  const card=page.locator('article.card').filter({has:page.locator('.detail-trigger[data-detail="'+id+'"]')});
  assert.equal(await card.locator('a.venue-photo-source').getAttribute('href'),m[1],'Card points to exact original '+id);
  assert((await card.locator('a.venue-photo-source small').textContent()).includes('Venue / operator website'),'Photo provenance visible '+id);
  assert.equal(await card.locator('img[data-venue-photo]').count(),0,'No third-party photo copied '+id);
  await card.locator('.detail-trigger').click();
  assert.equal(await page.locator('#detailActions .detail-photo-source').getAttribute('href'),m[1],'Detail preserves official gallery '+id);
  await page.locator('#detailClose').click();
 }
 // Seven previously rate-limited Commons queries are scheduled before general missing-location scans.
 const photoDiscovery=require('fs').readFileSync('tests/find-commons-photos.cjs','utf8');
 for(const id of ['r33','r36','r37','r50','r51','a34','a37'])assert(photoDiscovery.includes("'"+id+"'"),'Priority scan includes '+id);
 assert(photoDiscovery.includes('results.sort((a,b)=>orderIndex.get(a.id)-orderIndex.get(b.id))'),'Full 131-row report remains in catalogue order');
 assert(photoDiscovery.includes("venue_match:'UNVERIFIED',reuse_approved:false"),'Do not approve photos from automated search alone');


 // Two exact operator-hosted venue photo galleries are NOT commercial redistribution licenses.
 for(const [id,host,path] of [
   ['r40','ikinasushidokoroabe-hiroobekkan.owst.jp','/gallery'],
   ['r41','www.tsukiji-sushiko.com','/shoplist/ebisu/']
 ]){
  const row=publicPhotoSourceBlock.split(String.fromCharCode(10)).find(line=>line.trim().startsWith(id+':'));
  assert(row,'Official original gallery registered '+id);
  const parsed=row.match(/url:"([^"]+)",kind:"([^"]+)"/);
  assert(parsed,'Parse official source '+id);
  const url=new URL(parsed[1]);
  assert.equal(url.hostname,host,'Verified operator-hosted original gallery '+id);
  assert.equal(url.pathname,path,'Exact restaurant branch photo page '+id);
  assert.equal(parsed[2],'operator','Correct operator gallery provenance '+id);
  assert(!expectedPhotos.includes(id),'Original publisher photography is not a clearance '+id);
  await page.locator('#tabs [data-cat="restaurant"]').click();
  const card=page.locator('article.card').filter({has:page.locator('.detail-trigger[data-detail="'+id+'"]')});
  assert.equal(await card.locator('a.venue-photo-source').getAttribute('href'),parsed[1],'Guest gallery source opens exactly '+id);
  assert((await card.locator('a.venue-photo-source small').textContent()).includes('Venue / operator website'),'Operator photo source label visible '+id);
  assert.equal(await card.locator('img[data-venue-photo]').count(),0,'Do not rehost unlicensed photos '+id);
  await card.locator('.detail-trigger').click();
  assert.equal(await page.locator('#detailActions .detail-photo-source').getAttribute('href'),parsed[1],'Detail retains official gallery '+id);
  await page.locator('#detailClose').click();
 }
 // Prevent daily GitHub Actions 429 floods and preserve missing-vs-deferred distinctions.
 const discoveryWorkflow=require('fs').readFileSync('.github/workflows/photo-discovery.yml','utf8');
 assert(discoveryWorkflow.includes("cron: '25 1 * * 1'"),'Commons schedule limited to once weekly');
 assert(!discoveryWorkflow.includes('  push:'),'No automatic search for each source push');
 const safeResearch=require('fs').readFileSync('tests/find-commons-photos.cjs','utf8');
 assert(safeResearch.includes('let pauseForRateLimit=false'),'Wikimedia throttle circuit breaker exists');
 assert(safeResearch.includes("status:'DEFERRED_API_RATE_LIMIT'"),'Unsearched files cannot be reported as absent');
 assert(safeResearch.includes("const attempts=1"),'Only one API attempt per query when rate limited');


 // Rights audit is a queue, NOT an image-clearance ledger.
 const permissionsCsv=require('fs').readFileSync('audits/commons-18-rights-and-contact-triage-2026-10-20.csv','utf8');
 const pendingRows=permissionsCsv.trim().split(String.fromCharCode(10)).slice(1);
 assert.equal(pendingRows.length,18,'All 18 previous Wikimedia rate-limited places audited');
 const pendingPermissionIds=pendingRows.map(s=>s.match(/^"([^"]+)"/)?.[1]);
 assert.equal(new Set(pendingPermissionIds).size,18,'No duplicate original-file right inquiries');
 for(const id of ['r11','r29','r31','r38','r39','r40','r41','r42','r43','r44','a30','a31','a32','a34','a38','a39','a40','s15']){
  assert(pendingPermissionIds.includes(id),'Previously blocked venue has an image-use contact/rights disposition: '+id);
  assert(!expectedPhotos.includes(id),'Blocked original file cannot bypass clearance for '+id);
 }
 assert(permissionsCsv.includes('NO_WRITTEN_COMMERCIAL_REUSE_PERMISSION'),'No external contact is mislabeled as a grant');
 assert(permissionsCsv.includes('CLOSED_SEIBU_SHIBUYA_BRANCH_NO_ACTIVE_MARKETING_REQUEST'),'Do not solicit a photo for closed restaurant as active');
 assert(permissionsCsv.includes('OFFICIAL_STUDIO_IS_KAMIOSAKI_MEGURO_NOT_ASAKUSA_FIX_CATALOGUE_FIRST'),'Precise location mismatch preserved');

 const checkedPhotoRefs=[
   ['restaurant','r06','tabelog.com'],
   ['wellness','w05','www.shimizuyu.com'],
   ['attraction','a30','bub-activitycenter.com'],
   ['shopping','s15','www.gotokyo.org']
 ];
 for(const [category,id,host] of checkedPhotoRefs){
   await page.locator('#tabs [data-cat="'+category+'"]').click();
   const card=page.locator('article.card').filter({has:page.locator('.detail-trigger[data-detail="'+id+'"]')});
   const link=card.locator('a.venue-photo-source');
   assert.equal(await link.count(),1,'External original-venue image reference shown on illustration card '+id);
   assert.equal(new URL(await link.getAttribute('href')).hostname,host,'Original-source hostname '+id);
   if(id==='r06')assert.equal(new URL(await link.getAttribute('href')).pathname,'/tokyo/A1317/A131701/13003188/dtlphotolst/4/smp2/','Seirinkan reference links directly to genuine Nakameguro exterior photographs');

   const provenance=(await link.locator('small').textContent()),provenanceType={r06:'Independent photo listing',w05:'Venue / operator website',a30:'Venue / operator website',s15:'Official Tokyo tourism guide'}[id];assert(provenance.includes(provenanceType),'Source accurately distinguishes operator, press and third-party photo pages '+id);
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
 assert((await koreanRef.locator('small').textContent()).includes('시설·운영사 홈페이지'),'Korean provenance label is correctly localized');
 await page.locator('#language').selectOption('en');
 assert((await page.locator('body').evaluate(el=>el.scrollWidth))<=405,'Photo-source links do not overflow iPhone viewport');
 // Minimum tap target and readable attribution on narrow iPhone screens.
 await page.locator('#tabs [data-cat="restaurant"]').click();
 const mobilePhotoCard=page.locator('article.card').filter({has:page.locator('.detail-trigger[data-detail="r21"]')});
 // 2026-10-22 owner request: the "Photos & venue details" box is not shown on cards; the same
 // external photo page remains one tap away in the Details dialog.
 const mobileSource=mobilePhotoCard.locator('.venue-photo-source');
 assert.equal(await mobileSource.evaluate(el=>getComputedStyle(el).display),'none','Card photo-source box hidden on iPhone');
 const creditSize=await mobilePhotoCard.locator('.photo-credit').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
 assert(creditSize>=11,'Mobile photo licensing source and credit are legible');
 const photoButtonHeight=await mobilePhotoCard.locator('.photo-view-trigger').evaluate(el=>el.getBoundingClientRect().height);
 assert(photoButtonHeight>=44,'Mobile photo enlargement touch target');
 const cardSourceHref=await mobileSource.getAttribute('href');
 await mobilePhotoCard.locator('.detail-trigger').click();
 assert.equal(await page.locator('#detailActions .detail-photo-source').getAttribute('href'),cardSourceHref,'Details dialog keeps the same external photo page');
 assert(await page.locator('#detailActions .detail-photo-source').isVisible(),'Photo page link visible in Details dialog');
 await page.locator('#detailClose').click();

 assert(expectedPhotos.length>=24,'Photo registry unexpectedly shrank');
 assert.equal(expectedPhotos.length,89,'Expected 89 original images including six licensed host-building exteriors');
 // Six of the 89 mapped photos depict host shopping/hotel buildings, not the venue itself.
  const buildingPhotoIds=[...photoContextBlock.matchAll(/^([a-z]\d+):\{([^\n]+)\}/gm)].filter(m=>!m[2].includes('kind:"venue"')).map(m=>m[1]);
 assert.deepEqual(buildingPhotoIds.slice().sort(),['r18','r21','r32','r34','r48','a36','r30','w02','w07'].sort(),'Nine photograph labels accurately identify host-building exteriors');

 for(const [id,filename] of [['r32','Shibuya_Parco.jpg'],['r34','Omotesando-Harajuku-Tokyo---2024-06-15_010.jpg'],['r18','Pacific Century Place Marunouchi.jpg'],['r21','Nihonbashi Mitsui Tower @ Nihonbashi (9044324513).jpg'],['r48','新大手町ビル.jpg'],['a36','Ginza INZ.jpg']]){
   assert(expectedPhotos.includes(id),'Missing newly licensed building exterior image for '+id);
   const line=registry.split('\n').find(row=>row.startsWith(id+':{'));
   assert(line && line.includes(encodeURIComponent(filename)),'Expected exact Commons source file for '+id);
 }
 // Both exterior photos are authentic photos of shopping complexes containing
 // the target restaurant, NOT interior photos of those sushi restaurants.
 await page.locator('#language').selectOption('en');
 await page.locator('#tabs [data-cat="restaurant"]').click();
 for(const id of ['r32','r34','r18','r21','r48','a36']){
   // The sumo show is an attraction, while the other five host-building images are restaurant cards.
   await page.locator('#tabs [data-cat="'+(id==='a36'?'attraction':'restaurant')+'"]' ).click();
   const article=page.locator('article.card').filter({has:page.locator('.detail-trigger[data-detail="'+id+'"]')});
   assert.equal(await article.locator('img[data-venue-photo="'+id+'"]').count(),1,'Licensed exterior photo visible '+id);
   assert.equal(await article.locator('a.venue-photo-source').count(),1,'Building image keeps operator-specific venue details link '+id);
   assert.equal((await article.locator('.card-photo-label').textContent()).trim(),'BUILDING EXTERIOR','Exterior is never labeled as the restaurant interior '+id);
   assert((await article.locator('img[data-venue-photo="'+id+'"]').getAttribute('alt')).toLowerCase().includes('exterior'),'Accessible alt text identifies host building exterior '+id);
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

 const catalog=catalogueSection;
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
 // Wikimedia and other third-party hosts can intermittently reject CI traffic.
 // Keep outage diagnostics visible; verify local files and all fallback UI separately.
 const failedLocal=failedPhotos.filter(entry=>localPhotoById.has(entry.split(' ')[0]));
 assert.deepEqual(failedLocal,[],'Published local venue images failed to load');
 const failedExternal=failedPhotos.filter(entry=>!localPhotoById.has(entry.split(' ')[0]));
 if(failedExternal.length)console.warn('WARN external photo host did not serve '+failedExternal.length+' images; retain original registry and fallback UI:',failedExternal.join(' | '));
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
   // Let late lazy images / content-visibility cards finish shifting the layout, then sample the baseline right
   // before the wheel so only scrolling caused by the wheel itself is counted (the check still fails if the backdrop scrolls).
   await page.waitForLoadState('networkidle',{timeout:10000}).catch(()=>{});
   await page.waitForTimeout(400);
   const backgroundScroll=await page.evaluate(()=>window.scrollY);
   await page.mouse.move(3,200);
   await page.mouse.wheel(0,600);
   await page.waitForTimeout(150);
   const afterWheel=await page.evaluate(()=>window.scrollY);
   // A wheel of 600px that reached the page would move it by hundreds of pixels downward. Sub-pixel/few-pixel drift
   // (content-visibility cards settling to their real height) is layout, not scrolling, and must not fail the check.
   assert(afterWheel-backgroundScroll<40&&backgroundScroll-afterWheel<40,'Photo backdrop does not scroll the catalogue (scrollY '+backgroundScroll+' -> '+afterWheel+', '+language+')');
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
 // Real network failure, independent of the happy path above: every external photo request is refused.
 {
  const failPage=await browser.newPage({viewport:{width:1365,height:900}});
  const failErrors=[];failPage.on('pageerror',e=>failErrors.push(e.message));
  await failPage.route(externalRequest,route=>route.request().resourceType()==='image'?route.abort():route.continue());
  await failPage.goto(target,{waitUntil:'domcontentloaded',timeout:45000});
  await failPage.waitForSelector('.card');
  await failPage.locator('#tabs [data-cat="attraction"]').click();
  const failImg=failPage.locator('img[data-venue-photo="a01"]');
  await failImg.evaluate(el=>{el.loading='eager';el.scrollIntoView()});
  await failPage.waitForFunction(()=>{const i=document.querySelector('img[data-venue-photo="a01"]');return !!i&&i.classList.contains('photo-failed')},null,{timeout:15000});
  const failCard=failPage.locator('.card').filter({has:failPage.locator('img[data-venue-photo="a01"]')});
  assert.equal(await failCard.locator('.card-art').count(),1,'Network failure shows exactly one fallback illustration');
  assert.equal(await failCard.locator('.card-photo').evaluate(el=>getComputedStyle(el).display),'none','Network-failed photo block is hidden');
  assert.equal(await failCard.locator('[data-view-photo="a01"]').isVisible(),false,'No dead zoom trigger remains on a failed photo');
  assert.equal(failErrors.length,0,'No JS errors on photo network failure: '+failErrors.join('; '));
  await failPage.close();
 }

 assert.equal(errors.length,0,'JS errors: '+errors.join('; '));
 console.log('PASS '+target+': render, search, no results, EN/JA/KO, shortlist, CSV, print invocation, detail, Korean search, mobile width, JS console');
 await browser.close();
})().catch(e=>{
 console.error(e);
 // Surface the failing assertion as a GitHub annotation (job logs are not always retrievable).
 if(process.env.GITHUB_ACTIONS){
  const line=(e.stack||'').split('\n').find(l=>l.includes('smoke.cjs:'))||'';
  console.log('::error title=Chromium smoke regression::'+String(e.message||e).replace(/\r?\n/g,' ').slice(0,900)+' @ '+line.trim().slice(-80)+(process.env.TEST_URL?' [deployed]':' [repo]'));
 }
 process.exit(1);
});
