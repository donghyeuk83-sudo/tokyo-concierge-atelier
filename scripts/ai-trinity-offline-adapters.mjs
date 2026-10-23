import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';
import {
  syntheticTask, loadRoutingConfig, validateRoutingConfig,
  validateTask, simulateCooperation,
} from './ai-trinity-router.mjs';

const CONFIG_PATH = fileURLToPath(new URL('../config/ai-trinity-adapter-policy.json', import.meta.url));
const REPOSITORY = 'donghyeuk83-sudo/tokyo-concierge-atelier';
const PROVIDERS = Object.freeze(['chatgpt', 'claude', 'gemini']);
const EXPECTED_POLICY = Object.freeze({
  schema_version: 3,
  mode: 'offline-adapters-only',
  repository: REPOSITORY,
  providers: PROVIDERS,
  accepted_data_class: 'public-metadata',
  network_enabled: false,
  allow_real_ai: false,
  allow_secret_loading: false,
  allow_data_export: false,
  allow_repository_writes: false,
  allow_deployments: false,
  max_cost_usd: 0,
  max_retries: 0,
});
const FIELDS = Object.freeze([
  'task', 'intent', 'cost_limit_usd', 'send_externally',
  'claimed_approval', 'error_fixture',
]);
const SAFE_INTENTS = new Set(['simulate', 'review']);
const APPROVAL_INTENTS = new Set(['edit', 'commit', 'push', 'draft_pr']);
const FORBIDDEN_INTENTS = new Set(['merge', 'deploy', 'delete', 'external_ai', 'paid_api']);
const ERROR_FIXTURES = new Set(['none', 'timeout', 'rate_limit', 'unavailable', 'invalid_response']);

const ZERO_EFFECTS = Object.freeze({
  external_ai_calls: 0, transmitted_bytes: 0, repository_writes: 0,
  api_cost_usd: 0, retries: 0,
});

export function loadAdapterPolicy() {
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
}

export function validateAdapterPolicy(policy) {
  return isDeepStrictEqual(policy, EXPECTED_POLICY) ? [] : ['adapter_policy_changed'];
}

export function validateAdapterEnvelope(envelope, adapterPolicy = loadAdapterPolicy(),
                                        routingPolicy = loadRoutingConfig()) {
  const reasons = [...validateAdapterPolicy(adapterPolicy), ...validateRoutingConfig(routingPolicy)];
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
    return { status: 'BLOCKED', reasons: [...reasons, 'invalid_envelope'] };
  }
  if (!isDeepStrictEqual(Object.keys(envelope).sort(), [...FIELDS].sort())) {
    reasons.push('unexpected_fields');
  }
  const taskGate = validateTask(envelope.task, routingPolicy);
  reasons.push(...taskGate.reasons.map(reason => `task:${reason}`));
  if (SAFE_INTENTS.has(envelope.intent)) {
    // Metadata-only simulation, never a provider call.
  } else if (APPROVAL_INTENTS.has(envelope.intent)) {
    reasons.push(`approval_required:${envelope.intent}`);
  } else if (FORBIDDEN_INTENTS.has(envelope.intent)) {
    reasons.push(`forbidden:${envelope.intent}`);
  } else {
    reasons.push('unknown_intent');
  }
  if (envelope.cost_limit_usd !== 0) reasons.push('cost_limit_must_be_zero');
  if (envelope.send_externally !== false) reasons.push('outbound_transfer_forbidden');
  if (envelope.claimed_approval !== false) reasons.push('claimed_approval_untrusted');
  if (!ERROR_FIXTURES.has(envelope.error_fixture)) reasons.push('unknown_error_fixture');
  return { status: reasons.length ? 'BLOCKED' : 'PASS', reasons };
}

export function createOfflineAdapter(provider) {
  if (!PROVIDERS.includes(provider)) throw new TypeError('unsupported_mock_provider');
  return Object.freeze({
    provider,
    prepare(envelope, adapterPolicy = loadAdapterPolicy(), routingPolicy = loadRoutingConfig()) {
      const gate = validateAdapterEnvelope(envelope, adapterPolicy, routingPolicy);
      if (gate.status !== 'PASS') {
        return { status: 'BLOCKED', reasons: gate.reasons, ...ZERO_EFFECTS };
      }
      return {
        status: 'METADATA_ONLY', provider,
        simulated_role: routingPolicy.routes[envelope.task.kind][provider],
        outbound_fields: [], transport: 'disabled', ...ZERO_EFFECTS,
      };
    },
    invoke() {
      return { status: 'BLOCKED', reasons: ['live_transport_disabled'], ...ZERO_EFFECTS };
    },
  });
}

export function runOfflineAdapterTrial(envelope, adapterPolicy = loadAdapterPolicy(),
                                       routingPolicy = loadRoutingConfig()) {
  const gate = validateAdapterEnvelope(envelope, adapterPolicy, routingPolicy);
  if (gate.status !== 'PASS') return { status: 'BLOCKED', reasons: gate.reasons, ...ZERO_EFFECTS };
  const prepared = PROVIDERS.map(provider =>
    createOfflineAdapter(provider).prepare(envelope, adapterPolicy, routingPolicy));
  if (prepared.some(result => result.status !== 'METADATA_ONLY')) {
    return { status: 'BLOCKED', reasons: ['adapter_preparation_failed'], ...ZERO_EFFECTS };
  }
  if (envelope.error_fixture !== 'none') {
    return {
      status: 'SIMULATED_FAILURE', failed_mock_provider: 'claude',
      error_code: `mock_${envelope.error_fixture}`, fallback: 'disabled', ...ZERO_EFFECTS,
    };
  }
  const mock = simulateCooperation(envelope.task, routingPolicy);
  if (mock.status !== 'SIMULATED_PASS' && mock.status !== 'REVIEW_REQUIRED') {
    return { status: 'BLOCKED', reasons: ['phase2_simulation_failed'], ...ZERO_EFFECTS };
  }
  return {
    status: mock.status === 'SIMULATED_PASS' ? 'SIMULATED_SUCCESS' : 'REVIEW_REQUIRED',
    mock_responses: mock.responses,
    transport: 'disabled', ...ZERO_EFFECTS,
  };
}

export function syntheticAdapterEnvelope(overrides = {}) {
  return {
    task: syntheticTask(), intent: 'simulate', cost_limit_usd: 0,
    send_externally: false, claimed_approval: false,
    error_fixture: 'none', ...overrides,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.length !== 3 || process.argv[2] !== '--demo' ||
      process.env.AI_TRINITY_PHASE3_OFFLINE !== 'true') {
    process.stderr.write('BLOCKED: offline adapter demo flag required\n');
    process.exitCode = 1;
  } else {
    const result = runOfflineAdapterTrial(syntheticAdapterEnvelope());
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (result.status !== 'SIMULATED_SUCCESS') process.exitCode = 1;
  }
}
