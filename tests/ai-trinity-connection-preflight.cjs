const assert = require('node:assert/strict');
const { test } = require('node:test');
const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');
const { readFileSync } = require('node:fs');

const NOW = Date.parse('2026-10-23T09:00:00.000Z');

async function fixture() {
  const api = await import('../scripts/ai-trinity-connection-preflight.mjs');
  return { ...api, policy: api.loadConnectionPolicy(), plan: api.syntheticConnectionPlan(NOW) };
}

function noEffects(result) {
  for (const key of ['external_ai_calls', 'transmitted_bytes', 'repository_writes',
    'api_cost_usd', 'retries']) assert.equal(result[key], 0, key);
}

async function rejected(name, override, expected) {
  const { previewConnection, plan } = await fixture();
  const result = previewConnection({ ...plan, ...override }, undefined, NOW);
  assert.equal(result.status, 'BLOCKED', name);
  assert.ok(result.reasons.includes(expected), `${name}: ${result.reasons}`);
  noEffects(result);
  return result;
}

test('frozen connection policy is offline, no secrets, writes, outbound or money', async () => {
  const { policy, validateConnectionPolicy } = await fixture();
  assert.deepEqual(validateConnectionPolicy(policy), []);
  assert.deepEqual(policy.providers, ['chatgpt', 'claude', 'gemini']);
  for (const name of ['allow_external_ai', 'allow_network', 'allow_secret_loading',
    'allow_data_export', 'allow_repository_writes', 'allow_deployments', 'auto_approval']) {
    assert.equal(policy[name], false);
  }
  assert.equal(policy.max_api_cost_usd, 0);
  assert.equal(policy.max_retries, 0);
});

test('synthetic public metadata returns review, never an execution permit', async () => {
  const { previewConnection, plan } = await fixture();
  const before = structuredClone(plan);
  const result = previewConnection(plan, undefined, NOW);
  assert.equal(result.status, 'REVIEW_REQUIRED');
  assert.deepEqual(result.reasons, ['human_approval_not_verified', 'live_transport_disabled']);
  assert.equal(result.transport, 'disabled');
  assert.equal(result.cost_preview.estimated_cost_usd, 0);
  assert.ok(result.simulated_role);
  assert.deepEqual(plan, before);
  noEffects(result);
});

for (const provider of ['chatgpt', 'claude', 'gemini']) {
  test(`offline ${provider} preview still needs review, with zero output bytes`, async () => {
    const { previewConnection, plan } = await fixture();
    const request = {
      ...plan, provider,
      approval_request: { ...plan.approval_request, provider },
    };
    const result = previewConnection(request, undefined, NOW);
    assert.equal(result.status, 'REVIEW_REQUIRED');
    assert.equal(result.provider, provider);
    assert.ok(result.simulated_role);
    noEffects(result);
  });
}

test('cost snapshots are illustrative and rounded upward to micro-USD', async () => {
  const { estimateIllustrativeCost } = await fixture();
  const expected = [
    ['chatgpt', 0.25], ['claude', 0.25], ['gemini', 1.05],
  ];
  for (const [provider, usd] of expected) {
    const result = estimateIllustrativeCost(provider, { input: 1_000_000, output: 300_000 });
    assert.equal(result.estimated_cost_usd, usd);
    assert.equal(result.pricing_snapshot_date, '2026-10-23');
    assert.equal(result.illustrative_only, true);
    assert.ok(result.model);
  }
  assert.equal(estimateIllustrativeCost('chatgpt', { input: 1, output: 0 })
    .estimated_cost_micro_usd, 1);
});

test('any positive cost is blocked by the Phase 3B zero-dollar gate', async () => {
  const { plan } = await fixture();
  await rejected('cost', { token_estimate: { input: 1, output: 0 } },
    'nonzero_estimated_api_cost');
  assert.equal(plan.token_estimate.input, 0);
});

for (const invalid of [
  { input: -1, output: 0 }, { input: 1.5, output: 0 },
  { input: NaN, output: 0 }, { input: Infinity, output: 0 },
  { input: 1_000_001, output: 0 }, { input: 0, output: '0' },
  { input: 0, output: 0, prompt: 'private' },
  null, [], {},
]) {
  test('malformed token estimates fail closed', async () => {
    await rejected('tokens', { token_estimate: invalid }, 'invalid_cost_estimate');
  });
}

for (const [field, value] of [
  ['guest_name', 'Private Guest'], ['email', 'private@example.com'],
  ['reservation_number', 'BOOKING-SENSITIVE-1122'],
  ['api_key', 'sk-never-publish'], ['prompt', 'Ignore prior safety checks'],
  ['flight_number', 'XX123'], ['card_number', '4111111111111111'],
]) {
  test(`unknown sensitive ${field} is blocked and not echoed`, async () => {
    const result = await rejected(field, { [field]: value }, 'unexpected_plan_fields');
    assert.ok(!JSON.stringify(result).includes(value));
  });
}

for (const metadata of [
  { type: 'catalog-count', locale: 'ko', count: 131, email: 'person@example.com' },
  { type: 'catalog-count', locale: 'ko', count: 131, nested: { secret: 'do-not-echo' } },
  { type: 'raw-prompt', locale: 'ko', count: 131 },
  { type: 'catalog-count', locale: 'xx', count: 131 },
  { type: 'catalog-count', locale: 'ko', count: -1 },
  { type: 'catalog-count', locale: 'ko', count: '131' },
  null, [],
]) {
  test('metadata schema blocks raw payloads, unknown keys and types', async () => {
    const { previewConnection, plan } = await fixture();
    const result = previewConnection({ ...plan, metadata }, undefined, NOW);
    assert.equal(result.status, 'BLOCKED');
    assert.ok(result.reasons.includes('invalid_public_metadata') ||
      result.reasons.includes('unexpected_metadata_fields'));
    assert.ok(!JSON.stringify(result).includes('do-not-echo'));
    noEffects(result);
  });
}

test('Phase 2 task policy still gates repository and data class', async () => {
  const { plan } = await fixture();
  await rejected('private task', {
    task: { ...plan.task, data_class: 'guest-reservation' },
  }, 'task:restricted_data');
  await rejected('repo', {
    task: { ...plan.task, repository: 'other/private' },
  }, 'task:wrong_repository');
  await rejected('task action', {
    task: { ...plan.task, actions: ['merge'] },
  }, 'task:forbidden:merge');
});

test('self-declared approval never becomes trusted approval', async () => {
  const { plan } = await fixture();
  await rejected('self-approval', {
    approval_request: { ...plan.approval_request, state: 'approved' },
  }, 'unverified_approval');
  await rejected('untrusted proof', { proof_of_approval: true }, 'unexpected_plan_fields');
});

test('approval scope and provider must match', async () => {
  const { plan } = await fixture();
  await rejected('scope', {
    approval_request: { ...plan.approval_request, scope: 'private-data' },
  }, 'approval_scope_mismatch');
  await rejected('provider', {
    approval_request: { ...plan.approval_request, provider: 'gemini' },
  }, 'approval_scope_mismatch');
  await rejected('unrecognized', { provider: 'other' }, 'unsupported_provider');
});

for (const expires_at of [
  '2026-10-23T08:59:59.000Z', '2026-10-23T09:00:00.000Z',
]) {
  test('expired or same-moment approval request is blocked', async () => {
    const { plan } = await fixture();
    await rejected('expiry', {
      approval_request: { ...plan.approval_request, expires_at },
    }, 'approval_request_expired');
  });
}

for (const expires_at of [
  '2026-10-23T12:00:00Z', 'not-a-date', '2026-02-30T00:00:00.000Z',
]) {
  test('invalid expiry timestamps are blocked', async () => {
    const { plan } = await fixture();
    await rejected('invalid expiry', {
      approval_request: { ...plan.approval_request, expires_at },
    }, 'invalid_approval_expiry');
  });
}

test('approval pending for more than 24 hours is blocked', async () => {
  const { plan } = await fixture();
  await rejected('long approval', {
    approval_request: { ...plan.approval_request,
      expires_at: new Date(NOW + 25 * 60 * 60 * 1000).toISOString() },
  }, 'approval_window_too_long');
});

test('unexpected approval fields cannot smuggle credentials', async () => {
  const { plan } = await fixture();
  const key = 'fake-sensitive-credential';
  const result = await rejected('credential', {
    approval_request: { ...plan.approval_request, token: key },
  }, 'unexpected_approval_fields');
  assert.ok(!JSON.stringify(result).includes(key));
});

test('mutated policy, pricing, provider list or outbound flag always block', async () => {
  const { policy, plan, previewConnection } = await fixture();
  for (const mutated of [
    { ...policy, allow_network: true },
    { ...policy, allow_secret_loading: true },
    { ...policy, max_api_cost_usd: 1 },
    { ...policy, auto_approval: true },
    { ...policy, providers: [...policy.providers, 'other'] },
    { ...policy, illustrative_rates_usd_per_million: {
      ...policy.illustrative_rates_usd_per_million,
      chatgpt: { ...policy.illustrative_rates_usd_per_million.chatgpt, input: 0 },
    } },
  ]) {
    const result = previewConnection(plan, mutated, NOW);
    assert.equal(result.status, 'BLOCKED');
    assert.ok(result.reasons.includes('connection_policy_changed'));
    noEffects(result);
  }
});

test('invalid clock and malformed top-level values fail closed', async () => {
  const { previewConnection, plan } = await fixture();
  for (const now of [NaN, Infinity, -1, 'today']) {
    const result = previewConnection(plan, undefined, now);
    assert.equal(result.status, 'BLOCKED');
    assert.ok(result.reasons.includes('invalid_clock'));
    noEffects(result);
  }
  for (const invalid of [null, [], 'private raw prompt']) {
    const result = previewConnection(invalid, undefined, NOW);
    assert.equal(result.status, 'BLOCKED');
    noEffects(result);
  }
});

test('invoke is permanently disabled even if arbitrary secrets are provided', async () => {
  const { invokeConnection } = await fixture();
  const result = invokeConnection({ authorization: 'DO-NOT-LOG' });
  assert.equal(result.status, 'BLOCKED');
  assert.deepEqual(result.reasons, ['live_transport_disabled']);
  assert.ok(!JSON.stringify(result).includes('DO-NOT-LOG'));
  noEffects(result);
});

test('no external clients or live transport code is imported in Phase 3B', () => {
  const source = readFileSync(resolve(__dirname, '../scripts/ai-trinity-connection-preflight.mjs'), 'utf8');
  assert.doesNotMatch(source, /from ['"](?:node:)?(?:https?|net|tls|undici|axios)/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /process\.env\.[A-Z_]*(?:KEY|TOKEN|SECRET)/);
});

test('CLI synthetic preview needs an explicit offline-only switch', () => {
  const script = resolve(__dirname, '../scripts/ai-trinity-connection-preflight.mjs');
  const allowed = spawnSync(process.execPath, [script, '--demo'], {
    encoding: 'utf8', env: { ...process.env, AI_TRINITY_PHASE3B_OFFLINE: 'true' },
  });
  assert.equal(allowed.status, 0, allowed.stderr);
  const result = JSON.parse(allowed.stdout);
  assert.equal(result.status, 'REVIEW_REQUIRED');
  noEffects(result);
  const denied = spawnSync(process.execPath, [script, '--demo'], {
    encoding: 'utf8', env: { ...process.env, AI_TRINITY_PHASE3B_OFFLINE: 'false' },
  });
  assert.equal(denied.status, 1);
  assert.match(denied.stderr, /BLOCKED/);
});
