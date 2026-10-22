const assert = require('node:assert/strict');
const { test } = require('node:test');

const SHA = '110565aece830fe30fd039b627006aac21611f18';

async function fixture() {
  const { loadPolicy, validatePolicy, validateRun, EXPECTED_PATHS } =
    await import('../scripts/ai-trinity-preflight.mjs');
  const policy = loadPolicy();
  const safe = {
    repository: 'donghyeuk83-sudo/tokyo-concierge-atelier',
    event: 'workflow_dispatch',
    ref: 'refs/heads/main',
    sha: SHA,
    expectedSha: SHA,
    dryRun: true,
    repositoryWrites: false,
    externalAI: false,
    deploy: false,
    apiCostUSD: 0,
    plannedPaths: [],
  };
  return { policy, safe, validatePolicy, validateRun, EXPECTED_PATHS };
}

test('the frozen policy allows only five Phase 1 paths', async () => {
  const { policy, validatePolicy, EXPECTED_PATHS } = await fixture();
  assert.deepEqual(validatePolicy(policy), []);
  assert.equal(EXPECTED_PATHS.length, 5);
  assert.deepEqual(new Set(policy.allowed_change_paths), new Set(EXPECTED_PATHS));
});

test('a valid manual, no-cost, read-only main run passes', async () => {
  const { policy, safe, validateRun } = await fixture();
  assert.deepEqual(validateRun(safe, policy), { status: 'PASS', reasons: [] });
});

const cases = [
  ['wrong repository', { repository: 'other/repo' }, 'repository'],
  ['automatic PR event', { event: 'pull_request' }, 'event'],
  ['wrong branch', { ref: 'refs/heads/feature' }, 'ref'],
  ['changed SHA', { sha: 'a'.repeat(40) }, 'sha_mismatch'],
  ['invalid expected SHA', { expectedSha: 'wrong' }, 'sha_mismatch'],
  ['not dry-run', { dryRun: false }, 'dry_run_required'],
  ['repository write', { repositoryWrites: true }, 'repository_write_forbidden'],
  ['external AI', { externalAI: true }, 'external_ai_forbidden'],
  ['deployment', { deploy: true }, 'deployment_forbidden'],
  ['nonzero API cost', { apiCostUSD: 0.01 }, 'api_cost_forbidden'],
  ['protected source path', { plannedPaths: ['atelier-catalog.js'] }, 'unapproved_path'],
  ['private data path', { plannedPaths: ['assets/manual-photos/inbox/private.jpg'] }, 'unapproved_path'],
];

for (const [name, overrides, reason] of cases) {
  test(`blocks ${name}`, async () => {
    const { policy, safe, validateRun } = await fixture();
    const result = validateRun({ ...safe, ...overrides }, policy);
    assert.equal(result.status, 'BLOCKED');
    assert.ok(result.reasons.includes(reason));
  });
}

test('tampering with the policy blocks execution', async () => {
  const { policy, safe, validateRun } = await fixture();
  assert.ok(validateRun(safe, { ...policy, allow_external_ai: true }).reasons.includes('policy_safety'));
  assert.ok(validateRun(safe, { ...policy, allowed_change_paths: ['index.html'] }).reasons.includes('policy_paths'));
});
