'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'scripts/ai-trinity-manual.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'docs/ai-trinity-manual-preview.html'), 'utf8');
const policy = JSON.parse(fs.readFileSync(path.join(root, 'config/ai-trinity-manual-policy.json'), 'utf8'));
const api = require('../scripts/ai-trinity-manual.js');
const providers = ['chatgpt', 'claude', 'gemini'];
const prompt = '에비스에서 비 오는 날 방문할 수 있는 관광지 3곳은?';
const answers = { chatgpt: '에비스 가든 플레이스', claude: '에비스 가든 플레이스', gemini: '에비스 가든 플레이스' };

test('policy freezes no-network zero-cost manual-only mode', () => {
  assert.deepEqual(policy.providers, providers);
  assert.deepEqual(api.providers, providers);
  for (const key of [
    'allow_network', 'allow_real_api', 'allow_secret_loading',
    'allow_auto_provider_navigation', 'allow_clipboard_read', 'allow_storage',
    'allow_guest_data', 'allow_repository_writes', 'allow_deployments', 'allow_auto_approval'
  ]) assert.equal(policy[key], false, key);
  assert.equal(policy.max_api_cost_usd, 0);
  assert.equal(policy.max_prompt_characters, 500);
  assert.equal(policy.max_response_characters, 12000);
});

test('three pasted texts only: never authorize or transmit', () => {
  const result = api.evaluate(prompt, answers);
  assert.equal(result.status, 'TEXT_IDENTICAL');
  assert.equal(result.exact_text_match, true);
  assert.equal(result.provided, 3);
  assert.equal(result.execution_authorized, false);
  assert.equal(result.api_calls, 0);
  assert.equal(result.transmitted_bytes, 0);
  assert.equal(result.api_cost_usd, 0);
  assert.equal(Object.isFrozen(result), true);
});

test('exact match is formatting-normalized only; disagreement needs human check', () => {
  const similar = api.evaluate(prompt, {
    chatgpt: ' 추천 A', claude: '추천  A', gemini: '추천 a '
  });
  assert.equal(similar.status, 'TEXT_IDENTICAL');
  const different = api.evaluate(prompt, { ...answers, gemini: '다른 답변' });
  assert.equal(different.status, 'TEXT_DIFFERENT');
  assert.equal(different.reason, 'HUMAN_FACT_CHECK_REQUIRED');
  assert.equal(different.execution_authorized, false);
});

test('partial and empty pasted responses remain in manual waiting state', () => {
  for (const candidate of [
    {}, { chatgpt: 'A' }, { chatgpt: 'A', claude: 'B' }
  ]) {
    assert.equal(api.evaluate(prompt, candidate).status, 'WAITING_FOR_MANUAL_PASTE');
  }
});

for (const [name, value] of Object.entries({
  email: 'test@example.com', reservation: '예약번호 12345', phone: '090-1234-5678',
  guest: 'guest_name: Taro', flight: 'flight number JL123',
  card: 'カード番号 1234', passport: '여권번호 A12',
  apiKey: 'api_key = private', token: 'sk-prohibited-key-example',
  multiDigit: '12345678'
})) {
  test('blocks private signal: ' + name, () => {
    assert.equal(api.evaluate(value, answers).status, 'BLOCKED');
    assert.equal(api.evaluate(prompt, { ...answers, claude: value }).status, 'BLOCKED');
  });
}

test('blocked: empty prompt, oversized prompt/response, unknown provider, malformed response', () => {
  const blocked = [
    api.evaluate('', answers),
    api.evaluate('x'.repeat(501), answers),
    api.evaluate(prompt, { ...answers, unknown: 'A' }),
    api.evaluate(prompt, { ...answers, claude: 'x'.repeat(12001) }),
    api.evaluate(prompt, { ...answers, gemini: { text: 'A' } }),
    api.evaluate(prompt, null)
  ];
  for (const item of blocked) {
    assert.equal(item.status, 'BLOCKED');
    assert.equal(item.execution_authorized, false);
  }
});

test('preview embeds no inline JS or automatic network/persistence mechanisms', () => {
  assert.match(html, /<script src="\.\.\/scripts\/ai-trinity-manual\.js" defer><\/script>/);
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i);
  assert.doesNotMatch(html, /\bon(?:click|load|submit|change|input)\s*=/i);
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /referrerpolicy="no-referrer"/);
  for (const expected of ['https://chatgpt.com/', 'https://claude.ai/', 'https://gemini.google.com/']) {
    assert.ok(html.includes(expected));
  }
  assert.doesNotMatch(code, /\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB|eval)\s*\(/);
  assert.doesNotMatch(code, /\binnerHTML\b|\bouterHTML\b|document\.write|\bnavigator\.clipboard\.read/);
});

test('UI uses textContent and keeps review explicitly human-only', () => {
  const ids = ['manual-trinity-form', 'manual-status', 'public-prompt', 'select-prompt',
    'compare-responses', 'response-chatgpt', 'response-claude', 'response-gemini'];
  const elements = {};
  ids.forEach(id => {
    elements[id] = {
      value: '', textContent: '', handlers: {},
      addEventListener(type, cb) { this.handlers[type] = cb; },
      focus() {}, select() {}
    };
    assert.ok(html.includes('id="' + id + '"'));
  });
  const oldDocument = global.document;
  global.document = { getElementById(id) { return elements[id]; } };
  try {
    assert.equal(api.mount(), true);
    elements['public-prompt'].value = prompt;
    for (const provider of providers) elements['response-' + provider].value = answers[provider];
    elements['compare-responses'].handlers.click();
    assert.match(elements['manual-status'].textContent, /사실 여부는 직접 검증/);
    elements['public-prompt'].value = 'customer_db test';
    elements['compare-responses'].handlers.click();
    assert.match(elements['manual-status'].textContent, /차단됨/);
    elements['manual-trinity-form'].handlers.reset();
    assert.match(elements['manual-status'].textContent, /저장·전송된 내용은 없습니다/);
  } finally {
    if (oldDocument === undefined) delete global.document;
    else global.document = oldDocument;
  }
});
