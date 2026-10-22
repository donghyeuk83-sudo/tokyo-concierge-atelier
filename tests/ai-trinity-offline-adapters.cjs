const assert = require('node:assert/strict');
const { test } = require('node:test');
const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');

async function fixture() {
  const module = await import('../scripts/ai-trinity-offline-adapters.mjs');
  return { ...module, policy: module.loadAdapterPolicy(), envelope: module.syntheticAdapterEnvelope() };
}

function expectZeroEffects(result) {
  assert.equal(result.external_ai_calls, 0);
  assert.equal(result.transmitted_bytes, 0);
  assert.equal(result.repository_writes, 0);
  assert.equal(result.api_cost_usd, 0);
  assert.equal(result.retries, 0);
}

test('adapter policy forbids networking, secret loading, exporting, writes and cost', async () => {
  const { policy, validateAdapterPolicy } = await fixture();
  assert.deepEqual(validateAdapterPolicy(policy), []);
  assert.deepEqual(policy.providers, ['chatgpt', 'claude', 'gemini']);
  for (const key of ['network_enabled', 'allow_real_ai', 'allow_secret_loading',
    'allow_data_export', 'allow_repository_writes', 'allow_deployments']) {
    assert.equal(policy[key], false);
  }
  assert.equal(policy.max_cost_usd, 0);
  assert.equal(policy.max_retries, 0);
});

for (const provider of ['chatgpt', 'claude', 'gemini']) {
  test(`${provider} prepares metadata only with disabled transport`, async () => {
    const { envelope, createOfflineAdapter } = await fixture();
    const adapter = createOfflineAdapter(provider);
    assert.equal(adapter.provider, provider);
    const prepared = adapter.prepare(envelope);
    assert.equal(prepared.status, 'METADATA_ONLY');
    assert.equal(prepared.provider, provider);
    assert.equal(prepared.transport, 'disabled');
    assert.deepEqual(prepared.outbound_fields, []);
    assert.ok(prepared.simulated_role);
    expectZeroEffects(prepared);
  });

  test(`${provider} live invocation is impossible`, async () => {
    const { createOfflineAdapter } = await fixture();
    const result = createOfflineAdapter(provider).invoke({ api_key: 'DO-NOT-USE' });
    assert.equal(result.status, 'BLOCKED');
    assert.deepEqual(result.reasons, ['live_transport_disabled']);
    assert.ok(!JSON.stringify(result).includes('DO-NOT-USE'));
    expectZeroEffects(result);
  });
}

test('rejects unknown provider labels instead of routing elsewhere', async () => {
  const { createOfflineAdapter } = await fixture();
  assert.throws(() => createOfflineAdapter('other'), /unsupported_mock_provider/);
});

test('three mock adapters reach consensus with zero outbound bytes', async () => {
  const { envelope, runOfflineAdapterTrial } = await fixture();
  const before = structuredClone(envelope);
  const result = runOfflineAdapterTrial(envelope);
  assert.equal(result.status, 'SIMULATED_SUCCESS');
  assert.deepEqual(result.mock_responses.map(x => x.provider), ['chatgpt', 'claude', 'gemini']);
  assert.equal(result.transport, 'disabled');
  assert.deepEqual(envelope, before);
  expectZeroEffects(result);
});

for (const scenario of ['conflict', 'abstain']) {
  test(`${scenario} requires human review and does not auto-execute`, async () => {
    const { envelope, runOfflineAdapterTrial } = await fixture();
    const result = runOfflineAdapterTrial({ ...envelope, task: { ...envelope.task, fixture: scenario } });
    assert.equal(result.status, 'REVIEW_REQUIRED');
    assert.ok(result.mock_responses.some(x => x.simulated_verdict !== 'accept'));
    expectZeroEffects(result);
  });
}

for (const error of ['timeout', 'rate_limit', 'unavailable', 'invalid_response']) {
  test(`simulated ${error} has no retry, fallback or actual request`, async () => {
    const { envelope, runOfflineAdapterTrial } = await fixture();
    const result = runOfflineAdapterTrial({ ...envelope, error_fixture: error });
    assert.equal(result.status, 'SIMULATED_FAILURE');
    assert.equal(result.error_code, `mock_${error}`);
    assert.equal(result.failed_mock_provider, 'claude');
    assert.equal(result.fallback, 'disabled');
    expectZeroEffects(result);
  });
}

const blockedCases = [
  ['private classification', { task: { data_class: 'guest-reservation' } }, 'task:restricted_data'],
  ['wrong repository', { task: { repository: 'private/westin' } }, 'task:wrong_repository'],
  ['personal name as ID', { task: { task_id: 'Guest Name' } }, 'task:invalid_task_id'],
  ['nonzero nested API cost', { task: { api_cost_usd: 0.01 } }, 'task:nonzero_api_cost'],
  ['Phase 2 write action', { task: { actions: ['push'] } }, 'task:approval_required:push'],
  ['Phase 2 external transmission', { task: { external_ai: true } }, 'task:external_ai_forbidden'],
  ['adapter cost limit', { cost_limit_usd: 1 }, 'cost_limit_must_be_zero'],
  ['outbound flag', { send_externally: true }, 'outbound_transfer_forbidden'],
  ['self-asserted approval', { claimed_approval: true }, 'claimed_approval_untrusted'],
  ['invalid failure scenario', { error_fixture: 'real-network-error' }, 'unknown_error_fixture'],
  ['unknown intent', { intent: 'production_write' }, 'unknown_intent'],
];

for (const action of ['edit', 'commit', 'push', 'draft_pr']) {
  blockedCases.push([`approval required for ${action}`, { intent: action }, `approval_required:${action}`]);
}
for (const action of ['merge', 'deploy', 'delete', 'external_ai', 'paid_api']) {
  blockedCases.push([`forbidden ${action}`, { intent: action }, `forbidden:${action}`]);
}

for (const [name, overrides, expected] of blockedCases) {
  test(`blocks ${name}`, async () => {
    const { envelope, runOfflineAdapterTrial } = await fixture();
    const task = overrides.task ? { ...envelope.task, ...overrides.task } : envelope.task;
    const result = runOfflineAdapterTrial({ ...envelope, ...overrides, task });
    assert.equal(result.status, 'BLOCKED');
    assert.ok(result.reasons.includes(expected));
    expectZeroEffects(result);
  });
}

for (const [field, privateValue] of [
  ['prompt', 'Guest: Jane Example'],
  ['email', 'guest@example.com'],
  ['reservation_number', 'BOOKING-123456'],
  ['api_key', 'sk-PRIVATE-EXAMPLE'],
]) {
  test(`rejects ${field} and does not echo raw private content`, async () => {
    const { envelope, runOfflineAdapterTrial } = await fixture();
    const result = runOfflineAdapterTrial({ ...envelope, [field]: privateValue });
    assert.equal(result.status, 'BLOCKED');
    assert.ok(result.reasons.includes('unexpected_fields'));
    assert.ok(!JSON.stringify(result).includes(privateValue));
    expectZeroEffects(result);
  });
}

test('rejects nested unapproved raw guest data', async () => {
  const { envelope, runOfflineAdapterTrial } = await fixture();
  const result = runOfflineAdapterTrial({
    ...envelope,
    task: { ...envelope.task, guest_message: 'PERSONAL-DO-NOT-EXPORT' },
  });
  assert.equal(result.status, 'BLOCKED');
  assert.ok(result.reasons.includes('task:unexpected_fields'));
  assert.ok(!JSON.stringify(result).includes('PERSONAL-DO-NOT-EXPORT'));
  expectZeroEffects(result);
});

test('policy mutation and provider expansion fail closed', async () => {
  const { policy, envelope, runOfflineAdapterTrial } = await fixture();
  for (const altered of [
    { ...policy, network_enabled: true },
    { ...policy, allow_secret_loading: true },
    { ...policy, max_cost_usd: 1 },
    { ...policy, max_retries: 1 },
    { ...policy, providers: [...policy.providers, 'third-party'] },
  ]) {
    const result = runOfflineAdapterTrial(envelope, altered);
    assert.equal(result.status, 'BLOCKED');
    assert.ok(result.reasons.includes('adapter_policy_changed'));
    expectZeroEffects(result);
  }
});

test('CLI demo requires explicit offline environment switch', () => {
  const script = resolve(__dirname, '../scripts/ai-trinity-offline-adapters.mjs');
  const valid = spawnSync(process.execPath, [script, '--demo'], {
    encoding: 'utf8', env: { ...process.env, AI_TRINITY_PHASE3_OFFLINE: 'true' },
  });
  assert.equal(valid.status, 0, valid.stderr);
  const result = JSON.parse(valid.stdout);
  assert.equal(result.status, 'SIMULATED_SUCCESS');
  expectZeroEffects(result);
  const blocked = spawnSync(process.execPath, [script, '--demo'], {
    encoding: 'utf8', env: { ...process.env, AI_TRINITY_PHASE3_OFFLINE: 'false' },
  });
  assert.equal(blocked.status, 1);
  assert.match(blocked.stderr, /BLOCKED/);
});
