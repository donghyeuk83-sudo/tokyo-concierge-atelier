import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

// Phase 7 is a design-time, offline compatibility gate. It never authenticates.
const POLICY_PATH = fileURLToPath(new URL('../config/ai-trinity-phase7-policy.json', import.meta.url));
const PROVIDERS = Object.freeze(['chatgpt', 'claude', 'gemini']);
const POLICY = Object.freeze({
  schema_version: 7,
  mode: 'offline-connection-readiness-only',
  repository: 'donghyeuk83-sudo/tokyo-concierge-atelier',
  execution_target: 'github-actions-public-standard-runner',
  providers: {
    chatgpt: { auth_method: 'chatgpt-plan-oss-oauth', eligibility: 'unverified',
      github_runner_compatibility: 'unverified' },
    claude: { auth_method: 'claude-code-subscription-oauth',
      eligibility: 'subscription-and-consent-required', github_runner_compatibility: 'documented' },
    gemini: { auth_method: 'gemini-api-unpaid-tier',
      eligibility: 'free-model-and-quota-unverified', github_runner_compatibility: 'documented' },
  },
  accepted_data_class: 'public-metadata',
  allowed_metadata_type: 'catalog-count',
  allow_network: false,
  allow_external_ai: false,
  allow_secret_loading: false,
  allow_browser_auth: false,
  allow_guest_data: false,
  allow_repository_writes: false,
  allow_deployments: false,
  allow_auto_approval: false,
  require_manual_provider_activation: true,
  max_api_cost_usd: 0,
  max_retries: 0,
});
const REQUEST_FIELDS = Object.freeze(['provider', 'metadata', 'review_state']);
const METADATA_FIELDS = Object.freeze(['type', 'locale', 'count']);
const ZERO_EFFECTS = Object.freeze({ external_ai_calls: 0, transmitted_bytes: 0,
  repository_writes: 0, api_cost_usd: 0, retries: 0 });

function plainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function exactFields(value, fields) {
  return plainObject(value) && isDeepStrictEqual(Object.keys(value).sort(), [...fields].sort());
}

function result(status, reasons, provider) {
  const value = { status, reasons: [...new Set(reasons)], transport: 'disabled', ...ZERO_EFFECTS };
  if (PROVIDERS.includes(provider)) value.provider = provider;
  return value;
}

export function loadPhase7Policy() {
  return JSON.parse(readFileSync(POLICY_PATH, 'utf8'));
}

export function validatePhase7Policy(policy) {
  return isDeepStrictEqual(policy, POLICY) ? [] : ['phase7_policy_changed'];
}

export function syntheticReadinessRequest(provider = 'chatgpt') {
  return { provider, metadata: { type: 'catalog-count', locale: 'ko', count: 141 },
    review_state: 'pending' };
}

export function inspectReadiness(request, policy = loadPhase7Policy()) {
  const reasons = validatePhase7Policy(policy);
  if (!exactFields(request, REQUEST_FIELDS)) reasons.push('unexpected_request_fields');
  if (!plainObject(request)) return result('BLOCKED', reasons);
  if (!PROVIDERS.includes(request.provider)) reasons.push('unknown_provider');
  if (!exactFields(request.metadata, METADATA_FIELDS) ||
      request.metadata.type !== 'catalog-count' ||
      !['ko', 'en', 'ja'].includes(request.metadata.locale) ||
      request.metadata.count !== 141) reasons.push('non_public_or_invalid_metadata');
  if (request.review_state !== 'pending') reasons.push('self_approval_forbidden');
  if (reasons.length) return result('BLOCKED', reasons, request.provider);

  // An accepted public *count* is not consent to connect. No payload is echoed.
  return result('REVIEW_REQUIRED', [
    'live_transport_disabled', 'credentials_not_inspected',
    'provider_eligibility_unverified', 'explicit_activation_required',
  ], request.provider);
}

export function invokePhase7Connection() {
  return result('BLOCKED', ['live_transport_disabled', 'explicit_activation_required']);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.length !== 3 || process.argv[2] !== '--offline-demo') {
    process.stderr.write('BLOCKED: Phase 7 offline demo only\n');
    process.exitCode = 1;
  } else {
    const summary = PROVIDERS.map(provider => inspectReadiness(syntheticReadinessRequest(provider)));
    process.stdout.write(`${JSON.stringify(summary)}\n`);
    if (summary.some(item => item.status !== 'REVIEW_REQUIRED' || item.external_ai_calls !== 0)) {
      process.exitCode = 1;
    }
  }
}
