const assert = require('node:assert/strict');
const { test } = require('node:test');
const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');

async function fixture() {
  const module = await import('../scripts/ai-trinity-router.mjs');
  return { ...module, policy: module.loadRoutingConfig(), task: module.syntheticTask() };
}

test('Phase 2 policy is frozen to three mock labels and zero cost / side effects', async () => {
  const { policy, validateRoutingConfig } = await fixture();
  assert.deepEqual(validateRoutingConfig(policy), []);
  assert.deepEqual(policy.providers, ['chatgpt', 'claude', 'gemini']);
  assert.equal(policy.allow_external_ai, false);
  assert.equal(policy.allow_repository_writes, false);
  assert.equal(policy.allow_deployments, false);
  assert.equal(policy.max_api_cost_usd, 0);
});

for (const kind of ['code', 'review', 'research', 'general']) {
  test(`routes ${kind} to exactly three deterministic mock roles`, async () => {
    const { simulateCooperation, task, policy } = await fixture();
    const result = simulateCooperation({ ...task, kind }, policy);
    assert.equal(result.status, 'SIMULATED_PASS');
    assert.deepEqual(result.responses.map(x => x.provider), ['chatgpt', 'claude', 'gemini']);
    assert.deepEqual(result.responses.map(x => x.simulated_role),
      policy.providers.map(provider => policy.routes[kind][provider]));
    assert.equal(result.external_ai_calls, 0);
    assert.equal(result.repository_writes, 0);
    assert.equal(result.api_cost_usd, 0);
  });
}

test('consensus produces an offline-only synthetic pass without changing input', async () => {
  const { task, simulateCooperation, policy } = await fixture();
  const before = structuredClone(task);
  const result = simulateCooperation(task, policy);
  assert.equal(result.status, 'SIMULATED_PASS');
  assert.deepEqual(result.responses.map(x => x.simulated_verdict), ['accept', 'accept', 'accept']);
  assert.deepEqual(task, before);
});

for (const mock of ['conflict', 'abstain']) {
  test(`${mock} cannot be automatically accepted`, async () => {
    const { task, simulateCooperation, policy } = await fixture();
    const result = simulateCooperation({ ...task, fixture: mock }, policy);
    assert.equal(result.status, 'REVIEW_REQUIRED');
    assert.ok(result.responses.some(x => x.simulated_verdict !== 'accept'));
    assert.equal(result.repository_writes, 0);
  });
}

const blockedCases = [
  ['wrong repository', { repository: 'someone/private-repo' }, 'wrong_repository'],
  ['unapproved kind', { kind: 'transfer-booking' }, 'unknown_task_type'],
  ['sensitive data', { data_class: 'private-guest' }, 'restricted_data'],
  ['invalid task id', { task_id: 'John Smith: guest' }, 'invalid_task_id'],
  ['invalid fixture', { fixture: 'live' }, 'unknown_fixture'],
  ['nonzero cost', { api_cost_usd: 0.01 }, 'nonzero_api_cost'],
  ['external AI transmission', { external_ai: true }, 'external_ai_forbidden'],
  ['not offline', { offline: false }, 'offline_required'],
  ['empty actions', { actions: [] }, 'invalid_actions'],
  ['duplicate actions', { actions: ['simulate', 'simulate'] }, 'invalid_actions'],
  ['unknown action', { actions: ['terraform'] }, 'unknown_action'],
  ['edit requires approval', { actions: ['edit'] }, 'approval_required:edit'],
  ['commit requires approval', { actions: ['commit'] }, 'approval_required:commit'],
  ['push requires approval', { actions: ['push'] }, 'approval_required:push'],
  ['draft PR requires approval', { actions: ['draft_pr'] }, 'approval_required:draft_pr'],
  ['merge is forbidden', { actions: ['merge'] }, 'forbidden:merge'],
  ['deploy is forbidden', { actions: ['deploy'] }, 'forbidden:deploy'],
  ['delete is forbidden', { actions: ['delete'] }, 'forbidden:delete'],
  ['paid API is forbidden', { actions: ['paid_api'] }, 'forbidden:paid_api'],
  ['external AI action is forbidden', { actions: ['external_ai'] }, 'forbidden:external_ai'],
];

for (const [name, override, expectedReason] of blockedCases) {
  test(`blocks ${name}`, async () => {
    const { task, policy, simulateCooperation } = await fixture();
    const result = simulateCooperation({ ...task, ...override }, policy);
    assert.equal(result.status, 'BLOCKED');
    assert.ok(result.reasons.includes(expectedReason));
    assert.equal(result.external_ai_calls, 0);
    assert.equal(result.repository_writes, 0);
    assert.equal(result.api_cost_usd, 0);
  });
}

test('untrusted prompt fields cannot enter the simulator or its output', async () => {
  const { task, policy, simulateCooperation } = await fixture();
  const result = simulateCooperation({ ...task, prompt: 'PRIVATE EXAMPLE GUEST DETAILS' }, policy);
  assert.equal(result.status, 'BLOCKED');
  assert.ok(result.reasons.includes('unexpected_fields'));
  assert.ok(!JSON.stringify(result).includes('PRIVATE EXAMPLE'));
});

test('self-declared approval never overrides the non-writing gate', async () => {
  const { task, policy, simulateCooperation } = await fixture();
  const result = simulateCooperation({ ...task, actions: ['commit'], approved: true }, policy);
  assert.equal(result.status, 'BLOCKED');
  assert.ok(result.reasons.includes('approval_required:commit'));
  assert.ok(result.reasons.includes('unexpected_fields'));
});

test('routing policy edits fail closed, including provider or cost tampering', async () => {
  const { task, policy, simulateCooperation } = await fixture();
  const cases = [
    { ...policy, allow_external_ai: true },
    { ...policy, max_api_cost_usd: 1 },
    { ...policy, providers: ['chatgpt'] },
    { ...policy, routes: { ...policy.routes, code: { chatgpt: 'live-api' } } },
  ];
  for (const changed of cases) {
    const result = simulateCooperation(task, changed);
    assert.equal(result.status, 'BLOCKED');
    assert.ok(result.reasons.includes('routing_policy_changed'));
  }
});

test('CLI demo runs only with explicit offline flag', () => {
  const script = resolve(__dirname, '../scripts/ai-trinity-router.mjs');
  const positive = spawnSync(process.execPath, [script, '--demo'], {
    encoding: 'utf8', env: { ...process.env, AI_TRINITY_PHASE2_OFFLINE: 'true' },
  });
  assert.equal(positive.status, 0, positive.stderr);
  assert.equal(JSON.parse(positive.stdout).status, 'SIMULATED_PASS');
  const negative = spawnSync(process.execPath, [script, '--demo'], {
    encoding: 'utf8', env: { ...process.env, AI_TRINITY_PHASE2_OFFLINE: 'false' },
  });
  assert.equal(negative.status, 1);
  assert.match(negative.stderr, /BLOCKED/);
});
