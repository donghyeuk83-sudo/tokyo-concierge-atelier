# AI Trinity Phase 8 — Offline Secure Connection Gate

This phase is a deliberately non-operational review gate for three *candidate*
provider authentication routes. It does not authorize or implement a live
connection. It is stacked on the Phase 7 Draft PR, not on the deployed site.

## Scope and non-negotiable boundary

- The only accepted payload is a synthetic public metadata record with
  type = catalog-count, locale = en/ja/ko, count = 141.
- Each valid request receives REVIEW_REQUIRED and provider-specific missing
  evidence. No self-declared approval can clear a requirement.
- Guest names, reservation details, tokens, billing data, expanded metadata
  and live-intent requests receive BLOCKED without echoing their contents.
- Network transport, OAuth/token access, environment-secret inspection,
  external inference, automatic fallback, retries, file writes, GitHub writes,
  deployments and approval bypass are all disabled.
- Every result has external_ai_calls = 0, transmitted_bytes = 0,
  repository_writes = 0, api_cost_usd = 0, retries = 0.
- The policy is compared against an exact hardcoded safety snapshot.
  Editing the JSON to enable a prohibited operation fails closed.
- Phase 7 must continue passing. This phase only imports its offline
  readiness functions; there is no AI provider SDK or credential integration.

## Provider-specific review checklist

| Provider | Candidate route | Evidence still missing |
| --- | --- | --- |
| ChatGPT | Eligible open-source Sign in with ChatGPT plan OAuth | OSS eligibility, stable host identity, ephemeral runner/session safety, account consent |
| Claude | Claude Code subscription OAuth | Subscription eligibility, safe token handling, GitHub App permission review, account consent |
| Gemini | Gemini Developer API unpaid tier | Model and quota eligibility, billing-disabled verification, unpaid-service data terms review, account consent |

These are review requirements, not a claim that credentials or free services
have been validated for this user. In particular:

- ChatGPT-plan OAuth eligibility and stable host identity on short-lived CI
  runners must be established before any future connection design.
- Claude's official GitHub Action can authenticate using a subscription
  OAuth token, but this phase does not collect or store any token.
- Gemini's unpaid service may process prompts for product improvement;
  never send guest, reservation, personal, payment or confidential data.
- Standard public GitHub Actions compute is separate from provider billing.
  Passing CI does not prove provider inference is free or permitted.

Official references reviewed for Phase 7 on 2026-10-24:

- https://developers.openai.com/siwc/token-sharing-open-source
- https://developers.openai.com/siwc/token-sharing-open-source/self-hosted-vms
- https://code.claude.com/docs/en/github-actions
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/terms
- https://docs.github.com/en/actions/reference/runners/github-hosted-runners

## CI and review strategy

- Separate Draft PR targeting the Phase 7 feature branch. Do not merge it,
  publish Pages, activate auto-merge or remove branches.
- A contents-read GitHub Actions workflow, triggered only by Draft PR changes,
  checks all Phase 1–8 offline tests, immutable catalogue/photo policy and
  Chromium + WebKit iPhone browser regressions.
- No secrets, pull_request_target event, write-capable workflow, provider SDK,
  background AI request, live billing or deployment step is configured.
- Normal dependency downloads for Node/Playwright are not AI inference calls.

## Exit conditions (separate future authorization required)

1. Independently establish provider-specific eligibility, permissions, account
   consent and no-additional-charge conditions.
2. Review and approve any future credential-storage and network architecture
   before creating a live workflow. This PR performs neither activity.
3. Approve the exact public synthetic test payload and its external recipients.
4. Run a separate, opt-in review for guest-data exclusion, logging, retention,
   rate limits and revocation.

Until these requirements are met, LIVE THREE-PROVIDER CONNECTION = BLOCKED.
OFFLINE SECURE CONNECTION GATE = PASS only when all CI checks pass.

## Offline verification

    node --test tests/ai-trinity-preflight.cjs tests/ai-trinity-router.cjs tests/ai-trinity-offline-adapters.cjs tests/ai-trinity-connection-preflight.cjs tests/ai-trinity-orchestrator.cjs tests/ai-trinity-manual.cjs tests/ai-trinity-phase6.cjs tests/ai-trinity-phase7-readiness.cjs tests/ai-trinity-phase8-gate.cjs
    node scripts/ai-trinity-phase8-gate.mjs --offline-demo
