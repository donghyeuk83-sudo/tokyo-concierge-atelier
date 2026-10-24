'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { spawnSync } = require('node:child_process');

const root = resolve(__dirname, '..');
const entry = resolve(root, 'scripts/ai-trinity-phase8-gate.mjs');
const api = () => import('../scripts/ai-trinity-phase8-gate.mjs');

function noEffects(out) {
  assert.equal(out.transport, 'disabled');
  assert.equal(out.execution_authorized, false);
  for (const field of ['external_ai_calls', 'transmitted_bytes', 'repository_writes',
    'api_cost_usd', 'retries']) assert.equal(out[field], 0, field);
}

test('frozen Phase 8 policy preserves offline and dollar-zero boundary', async () => {
  const { loadPhase8Policy, validatePhase8Policy } = await api();
  const policy = loadPhase8Policy();
  assert.deepEqual(validatePhase8Policy(policy), []);
  assert.equal(policy.parent_phase, 7);
  assert.equal(policy.execution_target, 'github-actions-public-standard-runner');
  assert.deepEqual(Object.keys(policy.providers), ['chatgpt', 'claude', 'gemini']);
  for (const field of ['allow_network', 'allow_external_ai', 'allow_secret_loading',
    'allow_browser_auth', 'allow_guest_data', 'allow_repository_writes',
    'allow_deployments', 'allow_auto_approval']) assert.equal(policy[field], false, field);
  assert.equal(policy.max_api_cost_usd, 0);
  assert.equal(policy.max_retries, 0);
});

for (const [provider, requirement] of [
  ['chatgpt', 'stable_host_identity_unverified'],
  ['claude', 'token_handling_review_missing'],
  ['gemini', 'unpaid_data_terms_review_missing'],
]) {
  test(provider + ' identifies authentic prerequisites without connecting', async () => {
    const { inspectPhase8Gate, syntheticPhase8Request } = await api();
    const out = inspectPhase8Gate(syntheticPhase8Request(provider));
    assert.equal(out.status, 'REVIEW_REQUIRED');
    assert.equal(out.provider, provider);
    assert.ok(out.reasons.includes(requirement));
    assert.ok(out.reasons.includes('verified_provider_evidence_missing'));
    noEffects(out);
  });
}

test('policy tampering always blocks approval, transfer and charges', async () => {
  const { loadPhase8Policy, inspectPhase8Gate, syntheticPhase8Request } = await api();
  const original = loadPhase8Policy();
  for (const change of [
    { allow_network: true }, { allow_external_ai: true }, { allow_secret_loading: true },
    { allow_guest_data: true }, { allow_repository_writes: true },
    { allow_deployments: true }, { allow_auto_approval: true },
    { max_api_cost_usd: 0.01 }, { max_retries: 1 },
    { providers: { ...original.providers,
      chatgpt: { ...original.providers.chatgpt, requirements: [] } } },
  ]) {
    const out = inspectPhase8Gate(syntheticPhase8Request(), { ...original, ...change });
    assert.equal(out.status, 'BLOCKED');
    assert.ok(out.reasons.includes('phase8_policy_changed'));
    noEffects(out);
  }
});

for (const change of [
  { full_name: 'Synthetic Guest' },
  { reservation_number: 'FAKE-RES-000' },
  { oauth_token: 'DO-NOT-ECHO-TOKEN' },
  { api_key: 'DO-NOT-ECHO-KEY' },
  { approval_state: 'approved' },
  { intent: 'live' },
  { provider: 'unknown' },
  { metadata: { type: 'guest-record', locale: 'ko', count: 141 } },
  { metadata: { type: 'catalog-count', locale: 'ko', count: 141, email: 'x@example.test' } },
  { metadata: { type: 'catalog-count', locale: 'ko', count: 140 } },
  { metadata: null },
]) {
  test('unexpected, private or self-approved input fails closed', async () => {
    const { inspectPhase8Gate, syntheticPhase8Request } = await api();
    const out = inspectPhase8Gate({ ...syntheticPhase8Request(), ...change });
    assert.equal(out.status, 'BLOCKED');
    noEffects(out);
    for (const marker of ['Synthetic Guest', 'FAKE-RES-', 'DO-NOT-ECHO']) {
      assert.ok(!JSON.stringify(out).includes(marker));
    }
  });
}

test('non-object input and attempted live invocation remain blocked', async () => {
  const { inspectPhase8Gate, invokePhase8Provider } = await api();
  for (const value of [null, undefined, [], 'private data', 0]) {
    const out = inspectPhase8Gate(value);
    assert.equal(out.status, 'BLOCKED');
    noEffects(out);
  }
  const out = invokePhase8Provider({ token: 'DO-NOT-ECHO' });
  assert.equal(out.status, 'BLOCKED');
  noEffects(out);
  assert.ok(!JSON.stringify(out).includes('DO-NOT-ECHO'));
});

test('source has no network transport, secret reads or file writes', () => {
  const source = readFileSync(entry, 'utf8');
  assert.doesNotMatch(source, /from ['"](?:node:)?(?:https?|net|tls|undici|axios)/);
  assert.doesNotMatch(source, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/);
  assert.doesNotMatch(source, /\bprocess\.env\b|\bwriteFile\b|\bchild_process\b/);
});

test('CI uses Draft-only read access, no secrets, no provider calls or merge', () => {
  const source = readFileSync(resolve(root, '.github/workflows/ai-trinity-phase8-gate.yml'), 'utf8');
  assert.match(source, /pull_request:/);
  assert.match(source, /contents: read/);
  assert.match(source, /persist-credentials: false/);
  assert.match(source, /engine: \[chromium, webkit\]/);
  assert.match(source, /github\.event\.pull_request\.draft == true/);
  assert.doesNotMatch(source, /secrets\./);
  assert.doesNotMatch(source, /(?:contents|pull-requests|issues): write/);
  assert.doesNotMatch(source, /(?:gh pr merge|git push|wrangler publish)/i);
});

test('CLI accepts only offline demonstration', () => {
  const safe = spawnSync(process.execPath, [entry, '--offline-demo'], { encoding: 'utf8' });
  assert.equal(safe.status, 0, safe.stderr);
  const data = JSON.parse(safe.stdout);
  assert.equal(data.length, 3);
  for (const out of data) {
    assert.equal(out.status, 'REVIEW_REQUIRED');
    noEffects(out);
  }
  const denied = spawnSync(process.execPath, [entry, '--live'], { encoding: 'utf8' });
  assert.notEqual(denied.status, 0);
  assert.equal(denied.stdout, '');
});
