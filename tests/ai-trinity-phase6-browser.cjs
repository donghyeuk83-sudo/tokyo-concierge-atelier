'use strict';
// Offline file:// Chromium and iPhone WebKit regression; no AI service requests.
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium, webkit } = require('playwright');

const engine = process.env.AI_TRINITY_TEST_BROWSER;
if (!['chromium', 'webkit'].includes(engine)) throw new Error('AI_TRINITY_TEST_BROWSER must be chromium or webkit');
const root = path.resolve(__dirname, '..');
const site = pathToFileURL(path.join(root, 'index.html')).href;
const review = pathToFileURL(path.join(root, 'docs', 'ai-trinity-manual-preview.html')).href;

async function check(browser, title, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const pageErrors = [];
  const previewNetwork = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('request', request => {
    if (page.url().includes('ai-trinity-manual-preview.html') && /^https?:\/\//i.test(request.url())) {
      previewNetwork.push(request.url());
    }
  });
  try {
    await page.goto(review, { waitUntil: 'load' });
    assert.equal(await page.locator('#ai-trinity-language').count(), 1);
    assert.equal(await page.locator('html').getAttribute('lang'), 'ko');
    await page.locator('#ai-trinity-language').selectOption('en');
    assert.equal(await page.title(), 'AI Trinity — Free Manual Review Preview');
    assert.match(await page.locator('.notice').innerText(), /public tourism information/i);
    await page.locator('#public-prompt').fill('Indoor attractions near Ebisu');
    await page.locator('#response-chatgpt').fill('Ebisu Garden Place');
    await page.locator('#response-claude').fill('Ebisu Garden Place');
    await page.locator('#compare-responses').click();
    assert.match(await page.locator('#manual-status').innerText(), /2\/3/);
    await page.locator('#ai-trinity-language').selectOption('ja');
    assert.match(await page.locator('#manual-status').innerText(), /2\/3/);
    assert.equal(await page.locator('#response-chatgpt').inputValue(), 'Ebisu Garden Place');
    await page.locator('#response-gemini').fill('Ebisu Garden Place');
    await page.locator('#compare-responses').click();
    assert.match(await page.locator('#manual-status').innerText(), /一致/);
    await page.locator('#public-prompt').fill('guest_name: Secret');
    await page.locator('#compare-responses').click();
    assert.match(await page.locator('#manual-status').innerText(), /ブロック/);
    await page.locator('#ai-trinity-language').selectOption('ko');
    await page.locator('button.reset').click();
    assert.match(await page.locator('#manual-status').innerText(), /저장·전송/);
    assert.deepEqual(previewNetwork, [], title + ' must have no automatic HTTP requests');
    assert.deepEqual(pageErrors, [], title + ' preview JS errors');

    // The optional link must resolve from the real site, with no root-relative dependency.
    await page.route(/^https?:\/\//i, route => route.abort());
    await page.goto(site, { waitUntil: 'domcontentloaded' });
    const link = page.locator('.site-footer-links a[href="docs/ai-trinity-manual-preview.html"]');
    assert.equal(await link.count(), 1);
    await link.click();
    await page.waitForURL(/ai-trinity-manual-preview\.html/);
    assert.equal(await page.locator('#manual-trinity-form').count(), 1);
    assert.equal(await page.locator('#ai-trinity-language').count(), 1);
    const width = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    assert.ok(width.scroll <= width.viewport + 1, title + ' horizontal overflow: ' + JSON.stringify(width));
  } finally {
    await context.close();
  }
}

(async () => {
  const browser = await (engine === 'chromium' ? chromium : webkit).launch({ headless: true });
  try {
    await check(browser, engine + ' desktop', { width: 1280, height: 800 });
    await check(browser, engine + ' iPhone', { width: 390, height: 844 });
    console.log('Phase 6 ' + engine + ' EN/JA/KO, privacy, footer link and responsive QA PASS');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
