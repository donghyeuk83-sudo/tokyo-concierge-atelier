'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { spawnSync } = require('node:child_process');

const root = resolve(__dirname, '..');
const modulePath = resolve(root, 'scripts/ai-trinity-phase7-readiness.mjs');

async function api() {
  return import('../scripts/ai-trinity-phase7-readiness.mjs');
}

function noEffects(result) {
  assert.equal(result.transport, 'disabled');
  for (const key of ['external_ai_calls', 'transmitted_bytes', 'repository_writes',
    'api_cost_usd', 'retries']) assert.equal(result[key], 0, key);
}

test('Phase 7 policy freezes GitHub-only offline readiness and dollar-zero ceiling', async () => {
  const { loadPhase7Policy, validatePhase7Policy } = await api();
  const policy = loadPhase7Policy();
  assert.deepEqual(validatePhase7Policy(policy), []);
  assert.equal(policy.execution_target, 'github-actions-public-standard-runner');
  assert.deepEqual(Object.keys(policy.providers), ['chatgpt', 'claude', 'gemini']);
  for (const key of ['allow_network', 'allow_external_ai', 'allow_secret_loading',
    'allow_browser_auth', 'allow_guest_data', 'allow_repository_writes',
    'allow_deployments', 'allow_auto_approval']) assert.equal(policy[key], false, key);
  assert.equal(policy.require_manual_provider_activation, true);
  assert.equal(policy.max_api_cost_usd, 0);
  assert.equal(policy.max_retries, 0);
});

for (const provider of ['chatgpt', 'claude', 'gemini']) {
  test(`${provider} readiness requires explicit future activation, does not connect`, async () => {
    const { inspectReadiness, syntheticReadinessRequest } = await api();
    const result = inspectReadiness(syntheticReadinessRequest(provider));
    assert.equal(result.status, 'REVIEW_REQUIRED');
    assert.equal(result.provider, provider);
    assert.ok(result.reasons.includes('live_transport_disabled'));
    assert.ok(result.reasons.includes('credentials_not_inspected'));
    noEffects(result);
  });
}

test('tampering with any protective control blocks readiness', async () => {
  const { loadPhase7Policy, inspectReadiness, syntheticReadinessRequest } = await api();
  const policy = loadPhase7Policy();
  for (const change of [
    { allow_network: true }, { allow_external_ai: true }, { allow_secret_loading: true },
    { allow_guest_data: true }, { allow_repository_writes: true },
    { allow_deployments: true }, { allow_auto_approval: true },
    { require_manual_provider_activation: false }, { max_api_cost_usd: 0.01 },
    { max_retries: 1 }, { providers: { ...policy.providers, chatgpt: {
      ...policy.providers.chatgpt, eligibility: 'approved',
    } } },
  ]) {
    const result = inspectReadiness(syntheticReadinessRequest(), { ...policy, ...change });
    assert.equal(result.status, 'BLOCKED');
    assert.ok(result.reasons.includes('phase7_policy_changed'));
    noEffects(result);
  }
});

for (const malicious of [
  { customer_name: 'Private Guest' },
  { reservation: 'SECRET-RESERVATION-781' },
  { api_key: 'DO-NOT-PRINT-KEY' },
  { auth: { token: 'DO-NOT-PRINT-TOKEN' } },
  { review_state: 'approved' },
  { provider: 'unknown' },
  { metadata: { type: 'guest-record', locale: 'ko', count: 141 } },
  { metadata: { type: 'catalog-count', locale: 'ko', count: 141, email: 'x@y.test' } },
  { metadata: { type: 'catalog-count', locale: 'ko', count: 140 } },
  { metadata: null },
]) {
  test('unexpected, guest, forged-approval and non-catalog fields fail closed', async () => {
    const { inspectReadiness, syntheticReadinessRequest } = await api();
    const request = { ...syntheticReadinessRequest(), ...malicious };
    const result = inspectReadiness(request);
    assert.equal(result.status, 'BLOCKED');
    assert.ok(result.reasons.length);
    assert.ok(!JSON.stringify(result).includes('Private Guest'));
    assert.ok(!JSON.stringify(result).includes('DO-NOT-PRINT'));
    noEffects(result);
  });
}

test('malformed top-level payloads and live invocation never leak or execute', async () => {
  const { inspectReadiness, invokePhase7Connection } = await api();
  for (const value of [null, undefined, [], 'PRIVATE', 123]) {
    const result = inspectReadiness(value);
    assert.equal(result.status, 'BLOCKED');
    noEffects(result);
  }
  const attempt = invokePhase7Connection({ oauth_token: 'DO-NOT-PRINT' });
  assert.equal(attempt.status, 'BLOCKED');
  assert.ok(!JSON.stringify(attempt).includes('DO-NOT-PRINT'));
  noEffects(attempt);
});

test('readiness implementation does not import network transports or inspect secrets', () => {
  const source = readFileSync(modulePath, 'utf8');
  assert.doesNotMatch(source, /from ['"](?:node:)?(?:https?|net|tls|undici|axios)/);
  assert.doesNotMatch(source, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/);
  assert.doesNotMatch(source, /\bprocess\.env\b|\bwriteFile\b|\bchild_process\b/);
});

test('workflow contains no credentials, paid provider calls, write token or deploy steps', () => {
  const yaml = readFileSync(resolve(root, '.github/workflows/ai-trinity-phase7-readiness.yml'), 'utf8');
  assert.match(yaml, /pull_request:/);
  assert.match(yaml, /contents: read/);
  assert.match(yaml, /persist-credentials: false/);
  assert.match(yaml, /engine: \[chromium, webkit\]/);
  assert.match(yaml, /node --test.*ai-trinity-phase7-readiness\.cjs/);
  assert.doesNotMatch(yaml, /\$\{\{\s*secrets\./);
  assert.doesNotMatch(yaml, /(?:contents|pull-requests|issues): write/);
  assert.doesNotMatch(yaml, /(?:deploy|gh pr merge|git push|wrangler publish)/i);
});

test('CLI runs offline demo only, and rejects attempts to enable live mode', () => {
  const safe = spawnSync(process.execPath, [modulePath, '--offline-demo'], { encoding: 'utf8' });
  assert.equal(safe.status, 0, safe.stderr);
  const results = JSON.parse(safe.stdout);
  assert.equal(results.length, 3);
  for (const result of results) {
    assert.equal(result.status, 'REVIEW_REQUIRED');
    noEffects(result);
  }
  const denied = spawnSync(process.execPath, [modulePath, '--live'], { encoding: 'utf8' });
  assert.notEqual(denied.status, 0);
  assert.equal(denied.stdout, '');
});
