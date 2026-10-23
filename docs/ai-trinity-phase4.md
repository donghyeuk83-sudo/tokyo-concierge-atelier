# AI Trinity — Phase 4 Offline Three-Mock Orchestration

## Scope and review isolation

- Parent: Draft PR #80, immutable HEAD `067c07138b596b1762c5ba0e5f3157590a04c989`.
- New branch: `feat/ai-trinity-offline-orchestration-20261023`.
- Draft PR base: `feat/ai-trinity-preflight-gates-20261023` (not `main`).
- Exactly five new, isolated files: Phase 4 policy, orchestrator, tests,
  documentation and read-only GitHub Actions workflow.
- Existing PRs #76–#80, earlier Phase 1–3B modules, catalog, approved and
  unapproved media inventories, design, EN/JA/KO, Pages and main stay intact.
  Main may move independently; this stacked branch must not silently rebase.

## Crucial limitation

**Three named mock roles do not mean ChatGPT, Claude or Gemini participated.**
Phase 4 executes deterministic local Node.js fixtures only; no model SDKs,
network requests, keys, user conversations, customer records, D1 access,
provider calls, uploads, repository edits, merge, deployment or API charges.
The system **cannot** perform real automated three-AI collaboration yet.

## Offline pipeline

1. Load the frozen Phase 4 policy and reject any policy/config tampering.
2. Validate an exact task with Phase 2 public-metadata-only routing rules.
   Accept only offline simulate/review intents, zero USD, no outbound transfers
   or claimed approval.
3. For each of three labels, run the Phase 3B preflight with exact
   `catalog-count` metadata, a zero-token estimate, and an **unverified,
   pending** provider-scoped approval request. All three must return
   `REVIEW_REQUIRED` and advertise zero side effects.
4. Use the existing Phase 3A in-process mocks for consensus, conflict,
   abstention or injected error conditions.
5. Verify exactly three distinct provider labels and prescribed route roles;
   report *simulated* vote totals without exposing free-text input or a
   credential. A unanimous `accept` yields `SIMULATED_CONSENSUS`;
   two-out-of-three and abstention yield `REVIEW_REQUIRED`.
6. All outcomes keep `execution_authorized: false`,
   `human_review_required: true`, `final_action: none`, and
   `transport: disabled`. A mock failure never falls back or retries.

| Synthetic fixture | Expected status | Auto-action |
| --- | --- | --- |
| Three accept votes | `SIMULATED_CONSENSUS` | None |
| Two accept + reject | `REVIEW_REQUIRED` | None |
| Two accept + abstain | `REVIEW_REQUIRED` | None |
| Mock timeout/rate-limit/unavailable/bad-response | `SIMULATED_FAILURE` | None |
| Private metadata, nonzero cost, forged approval, policy changes | `BLOCKED` | None |

The only accepted external-looking metadata has the exact structure
`{type:'catalog-count', locale:'en'|'ja'|'ko', count:0..10000}`.
This does not authorize accepting guest details, arbitrary prompts, files or
other sensitive data. All errors are static reason codes. The illustrative
pricing and pending approval records of Phase 3B remain **non-authoritative**.

## Verification

From the repository root:

```sh
node --test tests/ai-trinity-preflight.cjs tests/ai-trinity-router.cjs tests/ai-trinity-offline-adapters.cjs tests/ai-trinity-connection-preflight.cjs tests/ai-trinity-orchestrator.cjs
AI_TRINITY_PHASE4_OFFLINE=true node scripts/ai-trinity-orchestrator.mjs --demo
```

The GitHub workflow uses pinned checkout/setup-node actions, a standard
GitHub-hosted runner, five-minute timeout and a read-only token. No API
credentials are passed. Review locally and on GitHub Actions before any
further Phase 4 modifications or PR changes.

**Next permission boundary:** Real provider integration, source exports,
authenticated approval handling, nonzero budgets, merge and deployment each
require separate explicit authorization and security review.
