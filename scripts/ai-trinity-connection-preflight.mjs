import { readFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';
import { createOfflineAdapter, loadAdapterPolicy, syntheticAdapterEnvelope,
  validateAdapterPolicy } from './ai-trinity-offline-adapters.mjs';
import { loadRoutingConfig, syntheticTask, validateTask } from './ai-trinity-router.mjs';

const CONFIG_PATH = fileURLToPath(new URL('../config/ai-trinity-connection-policy.json', import.meta.url));
const PROVIDERS = Object.freeze(['chatgpt', 'claude', 'gemini']);
const RATES = Object.freeze({
  chatgpt: { model: 'gpt-6-luna', input: 0.10, output: 0.50 },
  claude: { model: 'claude-haiku-5.5', input: 0.10, output: 0.50 },
  gemini: { model: 'gemini-3.5-flash-lite', input: 0.30, output: 2.50 },
});
const EXPECTED_POLICY = Object.freeze({
  schema_version: 4,
  mode: 'offline-preflight-only',
  repository: 'donghyeuk83-sudo/tokyo-concierge-atelier',
  providers: PROVIDERS,
  accepted_data_class: 'public-metadata',
  allowed_metadata_type: 'catalog-count',
  pricing_snapshot_date: '2026-10-23',
  illustrative_rates_usd_per_million: RATES,
  allow_external_ai: false,
  allow_network: false,
  allow_secret_loading: false,
  allow_data_export: false,
  allow_repository_writes: false,
  allow_deployments: false,
  auto_approval: false,
  max_api_cost_usd: 0,
  max_retries: 0,
});
const PLAN_FIELDS = ['task', 'provider', 'metadata', 'token_estimate', 'approval_request'];
const META_FIELDS = ['type', 'locale', 'count'];
const TOKENS_FIELDS = ['input', 'output'];
const APPROVAL_FIELDS = ['state', 'provider', 'scope', 'expires_at'];
const ZERO_EFFECTS = Object.freeze({
  external_ai_calls: 0, transmitted_bytes: 0, repository_writes: 0,
  api_cost_usd: 0, retries: 0,
});
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function plain(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function exactKeys(value, expected) {
  return plain(value) && isDeepStrictEqual(Object.keys(value).sort(), [...expected].sort());
}

function block(reasons) {
  return { status: 'BLOCKED', reasons: [...new Set(reasons)], ...ZERO_EFFECTS };
}

export function loadConnectionPolicy() {
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));
}

export function validateConnectionPolicy(policy) {
  return isDeepStrictEqual(policy, EXPECTED_POLICY) ? [] : ['connection_policy_changed'];
}

export function estimateIllustrativeCost(provider, tokenEstimate) {
  if (!PROVIDERS.includes(provider)) throw new TypeError('unsupported_provider');
  if (!exactKeys(tokenEstimate, TOKENS_FIELDS) ||
      !TOKENS_FIELDS.every(key => Number.isSafeInteger(tokenEstimate[key]) &&
        tokenEstimate[key] >= 0 && tokenEstimate[key] <= 1_000_000)) {
    throw new TypeError('invalid_token_estimate');
  }
  // USD per million tokens becomes micro-USD per token. Round UP, never understate.
  const rate = RATES[provider];
  const microUSD = Math.ceil(tokenEstimate.input * rate.input +
    tokenEstimate.output * rate.output);
  return Object.freeze({
    model: rate.model,
    pricing_snapshot_date: EXPECTED_POLICY.pricing_snapshot_date,
    estimated_cost_micro_usd: microUSD,
    estimated_cost_usd: microUSD / 1_000_000,
    illustrative_only: true,
  });
}

export function previewConnection(plan, policy = loadConnectionPolicy(), nowMs = Date.now()) {
  const reasons = [
    ...validateConnectionPolicy(policy),
    ...validateAdapterPolicy(loadAdapterPolicy()),
  ];
  if (!Number.isSafeInteger(nowMs) || nowMs < 0) reasons.push('invalid_clock');
  if (!exactKeys(plan, PLAN_FIELDS)) reasons.push('unexpected_plan_fields');
  if (!plain(plan)) return block(reasons);

  const routing = loadRoutingConfig();
  const taskResult = validateTask(plan.task, routing);
  reasons.push(...taskResult.reasons.map(reason => `task:${reason}`));

  if (!PROVIDERS.includes(plan.provider)) reasons.push('unsupported_provider');
  if (!exactKeys(plan.metadata, META_FIELDS)) reasons.push('unexpected_metadata_fields');
  if (!plain(plan.metadata) || plan.metadata.type !== 'catalog-count' ||
      !['en', 'ja', 'ko'].includes(plan.metadata.locale) ||
      !Number.isSafeInteger(plan.metadata.count) ||
      plan.metadata.count < 0 || plan.metadata.count > 10_000) {
    reasons.push('invalid_public_metadata');
  }

  let estimate;
  try {
    estimate = estimateIllustrativeCost(plan.provider, plan.token_estimate);
    if (estimate.estimated_cost_micro_usd > 0) reasons.push('nonzero_estimated_api_cost');
  } catch {
    reasons.push('invalid_cost_estimate');
  }

  if (!exactKeys(plan.approval_request, APPROVAL_FIELDS)) {
    reasons.push('unexpected_approval_fields');
  }
  if (!plain(plan.approval_request) || plan.approval_request.state !== 'pending') {
    reasons.push('unverified_approval');
  }
  if (!plain(plan.approval_request) ||
      plan.approval_request.provider !== plan.provider ||
      plan.approval_request.scope !== 'public-metadata') {
    reasons.push('approval_scope_mismatch');
  }
  const expiry = plain(plan.approval_request) ? plan.approval_request.expires_at : null;
  const expiryMs = typeof expiry === 'string' && ISO_UTC.test(expiry) ? Date.parse(expiry) : NaN;
  if (!Number.isFinite(expiryMs) || new Date(expiryMs).toISOString() !== expiry) {
    reasons.push('invalid_approval_expiry');
  } else if (Number.isSafeInteger(nowMs) && expiryMs <= nowMs) {
    reasons.push('approval_request_expired');
  } else if (Number.isSafeInteger(nowMs) && expiryMs - nowMs > 24 * 60 * 60 * 1000) {
    reasons.push('approval_window_too_long');
  }

  if (reasons.length) return block(reasons);

  // Only the already-reviewed Phase 3A mock prepare interface is reachable.
  const prepared = createOfflineAdapter(plan.provider).prepare(
    syntheticAdapterEnvelope({ task: plan.task }));
  if (prepared.status !== 'METADATA_ONLY' || prepared.transport !== 'disabled' ||
      prepared.transmitted_bytes !== 0) return block(['offline_adapter_not_ready']);

  // A pending request is never a grant. Even this successful preview is not
  // authorized to invoke a provider, spend money, or transfer a byte.
  return {
    status: 'REVIEW_REQUIRED',
    reasons: ['human_approval_not_verified', 'live_transport_disabled'],
    provider: plan.provider,
    simulated_role: prepared.simulated_role,
    cost_preview: estimate,
    transport: 'disabled',
    ...ZERO_EFFECTS,
  };
}

export function invokeConnection() {
  return block(['live_transport_disabled']);
}

export function syntheticConnectionPlan(nowMs = Date.now(), overrides = {}) {
  return {
    task: syntheticTask(),
    provider: 'chatgpt',
    metadata: { type: 'catalog-count', locale: 'ko', count: 131 },
    token_estimate: { input: 0, output: 0 },
    approval_request: {
      state: 'pending', provider: 'chatgpt', scope: 'public-metadata',
      expires_at: new Date(nowMs + 60 * 60 * 1000).toISOString(),
    },
    ...overrides,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.length !== 3 || process.argv[2] !== '--demo' ||
      process.env.AI_TRINITY_PHASE3B_OFFLINE !== 'true') {
    process.stderr.write('BLOCKED: Phase 3B offline flag required\n');
    process.exitCode = 1;
  } else {
    const result = previewConnection(syntheticConnectionPlan());
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (result.status !== 'REVIEW_REQUIRED') process.exitCode = 1;
  }
}
