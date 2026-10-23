'use strict';

// No AI requests or credentials: local file:// browser regression only.
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium, webkit } = require('playwright');

const browserName = process.env.AI_TRINITY_TEST_BROWSER;
if (!['chromium', 'webkit'].includes(browserName)) {
  throw new Error('Set AI_TRINITY_TEST_BROWSER=chromium or webkit');
}

const targetUrl = pathToFileURL(path.join(__dirname, '..', 'docs', 'ai-trinity-manual-preview.html')).href;
const prompt = '에비스의 비 오는 날 실내 관광지 3곳을 알려주세요.';

async function testViewport(browser, viewportName, viewport) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: viewportName === 'iPhone' ? 2 : 1 });
  const page = await context.newPage();
  const errors = [];
  const outbound = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => {
    if (/^https?:\/\//i.test(request.url())) outbound.push(request.url());
  });

  try {
    await page.goto(targetUrl, { waitUntil: 'load' });
    assert.equal(await page.title(), 'AI Trinity — 무료 수동 검토 미리보기');
    assert.equal(await page.locator('#response-chatgpt').count(), 1);
    await page.waitForFunction(() => !!window.AITrinityManual);
    assert.equal(await page.evaluate(() => window.AITrinityManual.evaluate(
      '공개 관광 질문', { chatgpt: 'A', claude: 'A', gemini: 'A' }
    ).api_cost_usd), 0);

    const pageWidth = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth
    }));
    assert.ok(pageWidth.scroll <= pageWidth.client + 1,
      viewportName + ': horizontal overflow ' + JSON.stringify(pageWidth));
    const gridColumns = await page.locator('.grid').evaluate(element =>
      getComputedStyle(element).gridTemplateColumns.split(' ').length
    );
    assert.equal(gridColumns, viewportName === 'iPhone' ? 1 : 3);

    await page.locator('#public-prompt').fill(prompt);
    await page.locator('#select-prompt').click();
    assert.equal(await page.locator('#public-prompt').evaluate(element =>
      element.selectionEnd - element.selectionStart
    ), prompt.length);

    await page.locator('#response-chatgpt').fill('에비스 가든 플레이스');
    await page.locator('#response-claude').fill('에비스 가든 플레이스');
    await page.locator('#compare-responses').click();
    assert.match(await page.locator('#manual-status').innerText(), /2\/3개/);

    await page.locator('#response-gemini').fill('에비스 가든 플레이스');
    await page.locator('#compare-responses').click();
    assert.match(await page.locator('#manual-status').innerText(), /정규화 후 동일/);

    await page.locator('#response-gemini').fill('다른 관광지');
    await page.locator('#compare-responses').click();
    assert.match(await page.locator('#manual-status').innerText(), /텍스트가 다릅니다/);

    await page.locator('#response-gemini').fill('예약번호 12345');
    await page.locator('#compare-responses').click();
    assert.match(await page.locator('#manual-status').innerText(), /차단됨/);

    await page.locator('button[type="reset"]').click();
    assert.equal(await page.locator('#public-prompt').inputValue(), '');
    assert.equal(await page.locator('#response-chatgpt').inputValue(), '');
    assert.match(await page.locator('#manual-status').innerText(), /입력 초기화됨/);

    for (const [provider, host] of [['ChatGPT', 'chatgpt.com'], ['Claude', 'claude.ai'], ['Gemini', 'gemini.google.com']]) {
      const link = page.getByRole('link', { name: new RegExp(provider) });
      assert.equal(new URL(await link.getAttribute('href')).hostname, host);
      assert.match(await link.getAttribute('rel'), /noopener/);
      assert.equal(await link.getAttribute('referrerpolicy'), 'no-referrer');
    }
    assert.deepEqual(outbound, [], 'Unexpected outbound requests');
    assert.deepEqual(errors, [], 'Browser errors');
    console.log('PASS', browserName, viewportName, 'file:// preview, UI, privacy, 0 network');
  } finally {
    await context.close();
  }
}

(async () => {
  const engine = browserName === 'chromium' ? chromium : webkit;
  const options = browserName === 'chromium' ? { channel: 'chrome', headless: true } : { headless: true };
  const browser = await engine.launch(options);
  try {
    await testViewport(browser, 'desktop', { width: 1440, height: 900 });
    await testViewport(browser, 'iPhone', { width: 390, height: 844 });
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
