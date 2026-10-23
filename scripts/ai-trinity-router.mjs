import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';

const CONFIG_PATH = fileURLToPath(new URL('../config/ai-trinity-routing.json', import.meta.url));
const REPOSITORY = 'donghyeuk83-sudo/tokyo-concierge-atelier';
const PROVIDERS = Object.freeze(['chatgpt', 'claude', 'gemini']);
const ROUTES = Object.freeze({
  code: { chatgpt: 'scope-analysis', claude: 'implementation-review', gemini: 'independent-check' },
  review: { chatgpt: 'risk-analysis', claude: 'code-review', gemini: 'cross-check' },
  research: { chatgpt: 'synthesis', claude: 'source-audit', gemini: 'fact-check' },
  general: { chatgpt: 'coordination', claude: 'alternative-view', gemini: 'consistency-check' },
});
const EXPECTED_CONFIG = Object.freeze({
  schema_version: 2,
  mode: 'offline-simulation-only',
  repository: REPOSITORY,
  providers: PROVIDERS,
  allow_external_ai: false,
  allow_repository_writes: false,
  allow_deployments: false,
  max_api_cost_usd: 0,
  routes: ROUTES,
});
const INPUT_FIELDS = Object.freeze([
  'task_id', 'kind', 'repository', 'data_class', 'actions',
  'api_cost_usd', 'external_ai', 'offline', 'fixture',
]);
const SAFE_ACTIONS = new Set(['simulate', 'review']);
const APPROVAL_ACTIONS = new Set(['edit', 'commit', 'push', 'draft_pr']);
const FORBIDDEN_ACTIONS = new Set(['merge', 'deploy', 'delete', 'external_ai', 'paid_api']);
const FIXTURES = new Set(['consensus', 'conflict', 'abstain']);

export function loadRoutingConfig() {
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
}

export function validateRoutingConfig(config) {
  return isDeepStrictEqual(config, EXPECTED_CONFIG) ? [] : ['routing_policy_changed'];
}

export function validateTask(task, config) {
  const reasons = validateRoutingConfig(config);
  if (!task || typeof task !== 'object' || Array.isArray(task)) {
    return { status: 'BLOCKED', reasons: [...reasons, 'invalid_task'] };
  }
  if (!isDeepStrictEqual(Object.keys(task).sort(), [...INPUT_FIELDS].sort())) {
    reasons.push('unexpected_fields');
  }
  if (typeof task.task_id !== 'string' || !/^[a-z0-9-]{1,32}$/.test(task.task_id)) {
    reasons.push('invalid_task_id');
  }
  if (!Object.hasOwn(ROUTES, task.kind)) reasons.push('unknown_task_type');
  if (task.repository !== REPOSITORY) reasons.push('wrong_repository');
  if (task.data_class !== 'public-metadata') reasons.push('restricted_data');
  if (task.api_cost_usd !== 0) reasons.push('nonzero_api_cost');
  if (task.external_ai !== false) reasons.push('external_ai_forbidden');
  if (task.offline !== true) reasons.push('offline_required');
  if (!FIXTURES.has(task.fixture)) reasons.push('unknown_fixture');
  if (!Array.isArray(task.actions) || task.actions.length === 0 ||
      new Set(task.actions).size !== task.actions.length) {
    reasons.push('invalid_actions');
  } else {
    for (const action of task.actions) {
      if (SAFE_ACTIONS.has(action)) continue;
      if (APPROVAL_ACTIONS.has(action)) reasons.push(`approval_required:${action}`);
      else if (FORBIDDEN_ACTIONS.has(action)) reasons.push(`forbidden:${action}`);
      else reasons.push('unknown_action');
    }
  }
  return { status: reasons.length ? 'BLOCKED' : 'PASS', reasons };
}

export function simulateCooperation(task, config = loadRoutingConfig()) {
  const gate = validateTask(task, config);
  if (gate.status !== 'PASS') {
    return { status: 'BLOCKED', reasons: gate.reasons, external_ai_calls: 0, repository_writes: 0, api_cost_usd: 0 };
  }
  const verdicts = {
    consensus: ['accept', 'accept', 'accept'],
    conflict: ['accept', 'accept', 'reject'],
    abstain: ['accept', 'abstain', 'accept'],
  }[task.fixture];
  const responses = PROVIDERS.map((provider, i) => ({
    provider,
    simulated_role: config.routes[task.kind][provider],
    simulated_verdict: verdicts[i],
  }));
  return {
    status: verdicts.every(v => v === 'accept') ? 'SIMULATED_PASS' : 'REVIEW_REQUIRED',
    task_id: task.task_id,
    kind: task.kind,
    responses,
    external_ai_calls: 0,
    repository_writes: 0,
    api_cost_usd: 0,
  };
}

export function syntheticTask(overrides = {}) {
  return {
    task_id: 'phase2-demo', kind: 'code', repository: REPOSITORY,
    data_class: 'public-metadata', actions: ['simulate'], api_cost_usd: 0,
    external_ai: false, offline: true, fixture: 'consensus', ...overrides,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.length !== 3 || process.argv[2] !== '--demo' ||
      process.env.AI_TRINITY_PHASE2_OFFLINE !== 'true') {
    process.stderr.write('BLOCKED: offline demo flag required\n');
    process.exitCode = 1;
  } else {
    const result = simulateCooperation(syntheticTask());
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (result.status !== 'SIMULATED_PASS') process.exitCode = 1;
  }
}
