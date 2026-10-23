import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';
import {
  previewConnection, loadConnectionPolicy,
} from './ai-trinity-connection-preflight.mjs';
import {
  runOfflineAdapterTrial, syntheticAdapterEnvelope,
  validateAdapterEnvelope, loadAdapterPolicy,
} from './ai-trinity-offline-adapters.mjs';
import {
  syntheticTask, validateTask, loadRoutingConfig,
} from './ai-trinity-router.mjs';

const POLICY_PATH = fileURLToPath(new URL('../config/ai-trinity-orchestration-policy.json', import.meta.url));
const PROVIDERS = Object.freeze(['chatgpt', 'claude', 'gemini']);
const EXPECTED_POLICY = Object.freeze({
  schema_version: 5,
  mode: 'offline-orchestration-only',
  repository: 'donghyeuk83-sudo/tokyo-concierge-atelier',
  providers: PROVIDERS,
  accepted_data_class: 'public-metadata',
  required_mock_votes: 3,
  min_accept_votes: 3,
  allow_network: false,
  allow_real_ai: false,
  allow_secret_loading: false,
  allow_data_export: false,
  allow_repository_writes: false,
  allow_deployments: false,
  allow_auto_approval: false,
  allow_fallback: false,
  max_api_cost_usd: 0,
  max_retries: 0,
});
const PLAN_FIELDS = Object.freeze([
  'task', 'metadata', 'token_estimate', 'approval_requests',
  'intent', 'cost_limit_usd', 'send_externally', 'claimed_approval',
  'error_fixture',
]);
const VOTES = new Set(['accept', 'reject', 'abstain']);
const ZERO_EFFECTS = Object.freeze({
  external_ai_calls: 0,
  transmitted_bytes: 0,
  repository_writes: 0,
  api_cost_usd: 0,
  retries: 0,
});

function plain(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null);
}

function exactKeys(value, keys) {
  return plain(value) && isDeepStrictEqual(Object.keys(value).sort(), [...keys].sort());
}

function verdict(status, reasons, detail = {}) {
  return {
    status,
    reasons: [...new Set(reasons)],
    transport: 'disabled',
    human_review_required: true,
    execution_authorized: false,
    final_action: 'none',
    ...ZERO_EFFECTS,
    ...detail,
  };
}

export function loadOrchestrationPolicy() {
  return JSON.parse(readFileSync(POLICY_PATH, 'utf8'));
}

export function validateOrchestrationPolicy(policy) {
  return isDeepStrictEqual(policy, EXPECTED_POLICY) ? [] : ['orchestration_policy_changed'];
}

export function runOfflineOrchestration(plan, options = {}) {
  // Fail closed before touching any task/provider input. Results expose fixed
  // reason codes only: no raw prompt, nested data, credentials, or guest fields.
  try {
    if (!plain(options)) return verdict('BLOCKED', ['invalid_options']);
    const {
      policy = loadOrchestrationPolicy(),
      connectionPolicy = loadConnectionPolicy(),
      adapterPolicy = loadAdapterPolicy(),
      routingPolicy = loadRoutingConfig(),
      nowMs = Date.now(),
    } = options;
    const reasons = validateOrchestrationPolicy(policy);
    if (!Number.isSafeInteger(nowMs) || nowMs < 0) reasons.push('invalid_clock');
    if (!exactKeys(plan, PLAN_FIELDS)) reasons.push('unexpected_plan_fields');
    if (!plain(plan)) return verdict('BLOCKED', reasons);
    if (!exactKeys(plan.approval_requests, PROVIDERS)) {
      reasons.push('unexpected_approval_request_fields');
    }
    const taskGate = validateTask(plan.task, routingPolicy);
    reasons.push(...taskGate.reasons.map(reason => `task:${reason}`));

    const envelope = {
      task: plan.task,
      intent: plan.intent,
      cost_limit_usd: plan.cost_limit_usd,
      send_externally: plan.send_externally,
      claimed_approval: plan.claimed_approval,
      error_fixture: plan.error_fixture,
    };
    const adapterGate = validateAdapterEnvelope(envelope, adapterPolicy, routingPolicy);
    reasons.push(...adapterGate.reasons.map(reason => `adapter:${reason}`));
    if (reasons.length) return verdict('BLOCKED', reasons);

    // REVIEW_REQUIRED is *not* permission for a live call. It only permits
    // advancing to Phase 3A's deterministic in-process mock.
    for (const provider of PROVIDERS) {
      const preflight = previewConnection({
        task: plan.task,
        provider,
        metadata: plan.metadata,
        token_estimate: plan.token_estimate,
        approval_request: plan.approval_requests[provider],
      }, connectionPolicy, nowMs);
      if (preflight.status !== 'REVIEW_REQUIRED' ||
          preflight.transport !== 'disabled' ||
          preflight.external_ai_calls !== 0 ||
          preflight.transmitted_bytes !== 0 ||
          preflight.api_cost_usd !== 0) {
        reasons.push('connection_preflight_blocked');
      }
    }
    if (reasons.length) return verdict('BLOCKED', reasons);

    const trial = runOfflineAdapterTrial(envelope, adapterPolicy, routingPolicy);
    if (trial.status === 'SIMULATED_FAILURE') {
      return verdict('SIMULATED_FAILURE', ['mock_provider_failure'], {
        failed_mock_provider: trial.failed_mock_provider,
        error_code: trial.error_code,
        fallback: 'disabled',
      });
    }
    if (!['SIMULATED_SUCCESS', 'REVIEW_REQUIRED'].includes(trial.status) ||
        !Array.isArray(trial.mock_responses) ||
        trial.mock_responses.length !== PROVIDERS.length) {
      return verdict('BLOCKED', ['invalid_mock_trial']);
    }

    // Verify the exact three labelled mock votes and their fixed route roles.
    // Never accept a free-text or unrecognized mock response.
    const responses = trial.mock_responses.map((response, index) => {
      const provider = PROVIDERS[index];
      if (!exactKeys(response, ['provider', 'simulated_role', 'simulated_verdict']) ||
          response.provider !== provider ||
          response.simulated_role !== routingPolicy.routes[plan.task.kind][provider] ||
          !VOTES.has(response.simulated_verdict)) {
        throw new TypeError('unexpected_mock_response');
      }
      return {
        provider,
        simulated_role: response.simulated_role,
        simulated_verdict: response.simulated_verdict,
      };
    });

    const tally = {
      accept: responses.filter(response => response.simulated_verdict === 'accept').length,
      reject: responses.filter(response => response.simulated_verdict === 'reject').length,
      abstain: responses.filter(response => response.simulated_verdict === 'abstain').length,
    };
    const unanimous = tally.accept === policy.min_accept_votes &&
      tally.accept + tally.reject + tally.abstain === policy.required_mock_votes;
    if (unanimous && trial.status !== 'SIMULATED_SUCCESS') {
      return verdict('BLOCKED', ['mock_status_mismatch']);
    }
    if (!unanimous && trial.status !== 'REVIEW_REQUIRED') {
      return verdict('BLOCKED', ['mock_status_mismatch']);
    }
    return verdict(unanimous ? 'SIMULATED_CONSENSUS' : 'REVIEW_REQUIRED',
      unanimous ? ['offline_consensus_only', 'human_approval_not_verified'] :
        ['mock_disagreement', 'human_review_required'],
      {
        simulation_only: true,
        mock_responses: responses,
        mock_tally: tally,
        providers_prepared: PROVIDERS.length,
      });
  } catch {
    return verdict('BLOCKED', ['offline_orchestration_error']);
  }
}

export function syntheticOrchestrationPlan(nowMs = Date.now(), overrides = {}) {
  const expires_at = new Date(nowMs + 60 * 60 * 1000).toISOString();
  return {
    task: syntheticTask(),
    metadata: { type: 'catalog-count', locale: 'ko', count: 131 },
    token_estimate: { input: 0, output: 0 },
    approval_requests: Object.fromEntries(PROVIDERS.map(provider => [
      provider, { state: 'pending', provider, scope: 'public-metadata', expires_at },
    ])),
    ...syntheticAdapterEnvelope(),
    // envelope.task is the same fixture; explicitly retain one exact task key.
    ...overrides,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.length !== 3 || process.argv[2] !== '--demo' ||
      process.env.AI_TRINITY_PHASE4_OFFLINE !== 'true') {
    process.stderr.write('BLOCKED: Phase 4 offline-only flag required\n');
    process.exitCode = 1;
  } else {
    const result = runOfflineOrchestration(syntheticOrchestrationPlan());
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (result.status !== 'SIMULATED_CONSENSUS') process.exitCode = 1;
  }
}
