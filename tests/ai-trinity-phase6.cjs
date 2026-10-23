'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'docs/ai-trinity-manual-preview.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'scripts/ai-trinity-preview-i18n.js'), 'utf8');
const manual = fs.readFileSync(path.join(root, 'scripts/ai-trinity-manual.js'), 'utf8');
const indexPath = path.join(root, 'index.html');

test('Phase 6 keeps the standalone page offline, manually operated and CSP locked', () => {
  assert.match(html, /<script src="\.\.\/scripts\/ai-trinity-preview-i18n\.js" defer><\/script>/);
  assert.match(html, /<script src="\.\.\/scripts\/ai-trinity-manual\.js" defer><\/script>/);
  assert.match(html, /connect-src 'none'/);
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i);
  assert.doesNotMatch(html, /\bon(?:click|change|load|submit)\s*=/i);
  for (const program of [source, manual]) {
    assert.doesNotMatch(program, /\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB|eval)\s*\(/);
    assert.doesNotMatch(program, /\binnerHTML\b|\bouterHTML\b|document\.write/);
  }
  assert.match(html, /<select id="ai-trinity-language"/);
  for (const language of ['ko', 'en', 'ja']) assert.ok(html.includes('value="' + language + '"'));
});

test('all marked labels translate in EN/JA/KO without disturbing typed answers', () => {
  const nodes = [];
  const labels = [...html.matchAll(/data-i18n="([^"]+)"/g)].map(m => m[1]);
  const placeholders = [...html.matchAll(/data-i18n-placeholder="([^"]+)"/g)].map(m => m[1]);
  const aria = [...html.matchAll(/data-i18n-aria-label="([^"]+)"/g)].map(m => m[1]);
  function makeNode(attribute, key) {
    const attrs = { [attribute]: key };
    const node = { textContent: '', value: 'preserve', getAttribute: name => attrs[name], setAttribute: (name, value) => { attrs[name] = value; } };
    nodes.push({ node, attribute });
    return node;
  }
  const labeled = labels.map(key => makeNode('data-i18n', key));
  const placed = placeholders.map(key => makeNode('data-i18n-placeholder', key));
  const arias = aria.map(key => makeNode('data-i18n-aria-label', key));
  const languageSelect = { value: 'ko', addEventListener(type, cb) { this.change = cb; } };
  const status = labeled[labels.indexOf('initialStatus')];
  const document = {
    readyState: 'complete', documentElement: { lang: 'ko' }, title: '',
    getElementById(id) { return id === 'ai-trinity-language' ? languageSelect : id === 'manual-status' ? status : null; },
    querySelectorAll(selector) {
      const attribute = selector.slice(1, -1);
      return nodes.filter(record => record.attribute === attribute).map(record => record.node);
    }
  };
  const window = {};
  vm.runInNewContext(source, { document, window });
  const i18n = window.AITrinityPreviewI18n;
  assert.ok(i18n);
  for (const lang of ['en', 'ja', 'ko']) {
    i18n.render(lang);
    assert.equal(document.documentElement.lang, lang);
    assert.ok(document.title.length);
    for (const label of labeled) assert.ok(label.textContent.length, lang + ': missing label');
    for (const element of placed) assert.ok(element.getAttribute('placeholder').length);
    for (const element of arias) assert.ok(element.getAttribute('aria-label').length);
    for (const record of nodes) assert.equal(record.node.value, 'preserve');
    i18n.setStatus('waiting', 2);
    assert.match(status.textContent, /2[\s/]*3|2\/3/);
  }
  i18n.render('invalid');
  assert.equal(document.documentElement.lang, 'ko');
});

test('site footer includes one direct opt-in link while preserving 17 synchronous site scripts', t => {
  if (!fs.existsSync(indexPath)) return t.skip('Full repository checkout required; GitHub Actions enforces this');
  const index = fs.readFileSync(indexPath, 'utf8');
  const footer = index.match(/<div class="site-footer-links">([\s\S]*?)<\/div>/);
  assert.ok(footer, 'existing site footer preserved');
  assert.match(footer[1], /href="docs\/ai-trinity-manual-preview\.html"/);
  assert.equal((footer[1].match(/ai-trinity-manual-preview\.html/g) || []).length, 1);
  assert.equal((index.match(/<script\s+src=/g) || []).length, 17);
  assert.match(index, /id="catalogPanel"/);
});
