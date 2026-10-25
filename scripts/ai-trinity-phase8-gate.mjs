import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { inspectReadiness, loadPhase7Policy, validatePhase7Policy } from './ai-trinity-phase7-readiness.mjs';

const POLICY_PATH = fileURLToPath(new URL('../config/ai-trinity-phase8-policy.json', import.meta.url));
const PROVIDERS = Object.freeze(['chatgpt', 'claude', 'gemini']);
const REQUIREMENTS = Object.freeze({
  chatgpt: Object.freeze([
    'oss_eligibility_unverified',
    'stable_host_identity_unverified',
    'runner_session_security_unverified',
    'user_consent_missing',
  ]),
  claude: Object.freeze([
    'subscription_eligibility_unverified',
    'token_handling_review_missing',
    'github_app_permissions_review_missing',
    'user_consent_missing',
  ]),
  gemini: Object.freeze([
    'free_model_quota_unverified',
    'billing_disabled_unverified',
    'unpaid_data_terms_review_missing',
    'user_consent_missing',
  ]),
});
const EXPECTED_POLICY = Object.freeze({
  schema_version: 8,
  mode: 'offline-provider-auth-gate-only',
  repository: 'donghyeuk83-sudo/tokyo-concierge-atelier',
  parent_phase: 7,
  execution_target: 'github-actions-public-standard-runner',
  providers: {
    chatgpt: { candidate_auth: 'chatgpt-plan-oss-oauth', requirements: [...REQUIREMENTS.chatgpt] },
    claude: { candidate_auth: 'claude-code-subscription-oauth', requirements: [...REQUIREMENTS.claude] },
    gemini: { candidate_auth: 'gemini-api-unpaid-tier', requirements: [...REQUIREMENTS.gemini] },
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
  max_api_cost_usd: 0,
  max_retries: 0,
});
const REQUEST_FIELDS = Object.freeze(['provider', 'metadata', 'intent', 'approval_state']);
const META_FIELDS = Object.freeze(['type', 'locale', 'count']);
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

function exactFields(value, fields) {
  return plain(value) && isDeepStrictEqual(Object.keys(value).sort(), [...fields].sort());
}

function verdict(status, reasons, provider) {
  const value = {
    status,
    reasons: [...new Set(reasons)],
    transport: 'disabled',
    execution_authorized: false,
    ...ZERO_EFFECTS,
  };
  if (PROVIDERS.includes(provider)) value.provider = provider;
  return value;
}

export function loadPhase8Policy() {
  return JSON.parse(readFileSync(POLICY_PATH, 'utf8'));
}

export function validatePhase8Policy(policy) {
  return isDeepStrictEqual(policy, EXPECTED_POLICY) ? [] : ['phase8_policy_changed'];
}

export function syntheticPhase8Request(provider = 'chatgpt') {
  return {
    provider,
    metadata: { type: 'catalog-count', locale: 'ko', count: 141 },
    intent: 'readiness-review',
    approval_state: 'pending',
  };
}

export function inspectPhase8Gate(request, policy = loadPhase8Policy()) {
  const reasons = [
    ...validatePhase8Policy(policy),
    ...validatePhase7Policy(loadPhase7Policy()).map(reason => 'phase7:' + reason),
  ];
  if (!exactFields(request, REQUEST_FIELDS)) reasons.push('unexpected_request_fields');
  if (!plain(request)) return verdict('BLOCKED', reasons);
  if (!PROVIDERS.includes(request.provider)) reasons.push('unknown_provider');
  if (!exactFields(request.metadata, META_FIELDS) ||
      request.metadata.type !== 'catalog-count' ||
      !['en', 'ja', 'ko'].includes(request.metadata.locale) ||
      request.metadata.count !== 141) {
    reasons.push('private_or_invalid_metadata');
  }
  if (request.intent !== 'readiness-review') reasons.push('live_intent_forbidden');
  if (request.approval_state !== 'pending') reasons.push('self_approval_forbidden');
  if (reasons.length) return verdict('BLOCKED', reasons, request.provider);

  const phase7 = inspectReadiness({
    provider: request.provider,
    metadata: request.metadata,
    review_state: 'pending',
  });
  if (phase7.status !== 'REVIEW_REQUIRED' || phase7.external_ai_calls !== 0) {
    return verdict('BLOCKED', ['phase7_gate_rejected'], request.provider);
  }

  // Candidate authentication routes are documentation, never authorization.
  return verdict('REVIEW_REQUIRED', [
    'live_transport_disabled',
    'verified_provider_evidence_missing',
    ...REQUIREMENTS[request.provider],
  ], request.provider);
}

export function invokePhase8Provider() {
  return verdict('BLOCKED', ['live_transport_disabled', 'explicit_activation_required']);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.length !== 3 || process.argv[2] !== '--offline-demo') {
    process.stderr.write('BLOCKED: Phase 8 offline review only\n');
    process.exitCode = 1;
  } else {
    const outcomes = PROVIDERS.map(provider => inspectPhase8Gate(syntheticPhase8Request(provider)));
    process.stdout.write(JSON.stringify(outcomes) + '\n');
    if (outcomes.some(item => item.status !== 'REVIEW_REQUIRED' ||
        item.external_ai_calls !== 0 || item.transmitted_bytes !== 0)) {
      process.exitCode = 1;
    }
  }
}
