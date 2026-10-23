import { appendFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const EXPECTED_REPOSITORY = 'donghyeuk83-sudo/tokyo-concierge-atelier';
export const EXPECTED_PATHS = Object.freeze([
  '.github/workflows/ai-trinity-dry-run.yml',
  'scripts/ai-trinity-preflight.mjs',
  'config/ai-trinity-policy.json',
  'tests/ai-trinity-preflight.cjs',
  'docs/ai-trinity-operations.md',
]);

const SHA_40 = /^[0-9a-f]{40}$/;

export function loadPolicy(path = 'config/ai-trinity-policy.json') {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function validatePolicy(policy) {
  const problems = [];
  if (!policy || typeof policy !== 'object' || Array.isArray(policy)) return ['invalid_policy'];
  if (policy.schema_version !== 1 || policy.mode !== 'phase1-dry-run') problems.push('policy_version');
  if (policy.repository !== EXPECTED_REPOSITORY) problems.push('policy_repository');
  if (policy.manual_event !== 'workflow_dispatch' || policy.manual_ref !== 'refs/heads/main') {
    problems.push('policy_trigger');
  }
  if (policy.allow_external_ai !== false || policy.allow_repository_writes !== false ||
      policy.allow_deployments !== false || policy.max_api_cost_usd !== 0) {
    problems.push('policy_safety');
  }
  const actual = policy.allowed_change_paths;
  if (!Array.isArray(actual) || actual.length !== EXPECTED_PATHS.length ||
      new Set(actual).size !== EXPECTED_PATHS.length ||
      !EXPECTED_PATHS.every(path => actual.includes(path))) {
    problems.push('policy_paths');
  }
  return problems;
}

export function validateRun(run, policy) {
  const problems = validatePolicy(policy);
  if (!run || typeof run !== 'object') return { status: 'BLOCKED', reasons: [...problems, 'invalid_run'] };
  if (run.repository !== EXPECTED_REPOSITORY) problems.push('repository');
  if (run.event !== 'workflow_dispatch') problems.push('event');
  if (run.ref !== 'refs/heads/main') problems.push('ref');
  if (typeof run.sha !== 'string' || !SHA_40.test(run.sha) || run.sha !== run.expectedSha) {
    problems.push('sha_mismatch');
  }
  if (run.dryRun !== true) problems.push('dry_run_required');
  if (run.repositoryWrites !== false) problems.push('repository_write_forbidden');
  if (run.externalAI !== false) problems.push('external_ai_forbidden');
  if (run.deploy !== false) problems.push('deployment_forbidden');
  if (run.apiCostUSD !== 0) problems.push('api_cost_forbidden');
  if (!Array.isArray(run.plannedPaths) ||
      run.plannedPaths.some(path => typeof path !== 'string' || !EXPECTED_PATHS.includes(path))) {
    problems.push('unapproved_path');
  }
  return { status: problems.length === 0 ? 'PASS' : 'BLOCKED', reasons: problems };
}

function main() {
  const policy = loadPolicy();
  const run = {
    repository: process.env.GITHUB_REPOSITORY,
    event: process.env.GITHUB_EVENT_NAME,
    ref: process.env.GITHUB_REF,
    sha: process.env.GITHUB_SHA,
    expectedSha: process.env.AI_TRINITY_EXPECTED_SHA,
    dryRun: process.env.AI_TRINITY_DRY_RUN === 'true',
    repositoryWrites: false,
    externalAI: false,
    deploy: false,
    apiCostUSD: 0,
    plannedPaths: [],
  };
  const result = validateRun(run, policy);
  const safeOutput = JSON.stringify({ phase: 'Phase 1 dry-run', status: result.status, reasons: result.reasons });
  process.stdout.write(`${safeOutput}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      `### AI Trinity Phase 1\n\nStatus: **${result.status}**\n\n` +
      `Reasons: ${result.reasons.length ? result.reasons.join(', ') : 'none'}\n\n` +
      'No AI API calls, repository writes, or deployments were performed.\n');
  }
  if (result.status !== 'PASS') process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
