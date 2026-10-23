# AI Trinity — Phase 7: GitHub Actions connection readiness (Draft)

This phase prepares a **read-only, offline** compatibility checkpoint for a possible
three-provider connection. No real ChatGPT, Claude or Gemini request is made.
It must remain a separate Draft PR and is **not an authorization to activate** any
external provider, install credentials, enable billing, merge, deploy or delete
branches. All 141 runtime venue cards, media policies and site features stay untouched.

## Verified candidate authentication paths (not yet configured)

| Provider | Candidate route | Remaining requirement |
| --- | --- | --- |
| ChatGPT | Open-source client with user-authorized ChatGPT-plan OAuth | OSS eligibility and ephemeral GitHub-runner compatibility have **not** been verified. A remotely hosted app may require separate approval. |
| Claude | Official Claude Code Action with a Pro/Max subscription OAuth token | Account consent, secure token handling and read-only custom workflow design; no token is used in this phase. |
| Gemini | Gemini Developer API unpaid quota on an eligible model | Confirm project is genuinely on unpaid tier, selected model's available quota, and privacy conditions. |

Official sources reviewed on 2026-10-24:

- OpenAI OSS usage: https://developers.openai.com/siwc/token-sharing-open-source
- OpenAI remote VM security: https://developers.openai.com/siwc/token-sharing-open-source/self-hosted-vms
- Anthropic GitHub Actions: https://code.claude.com/docs/en/github-actions
- Google API pricing and data usage: https://ai.google.dev/gemini-api/docs/pricing
- Google unpaid services terms: https://ai.google.dev/gemini-api/terms
- GitHub hosted runners: https://docs.github.com/en/actions/reference/runners/github-hosted-runners

**Important distinction:** Free GitHub Actions compute does not make a paid AI API
free. ChatGPT Plus API-key billing is separate from subscription usage; the
ChatGPT-plan OAuth route is conditional. Claude Pro OAuth requires subscription
eligibility and usage limits. Gemini's unpaid service may use requests and
responses for service improvement: never send guest, reservation, credentials,
payment, sensitive, proprietary or other confidential data to it.

## Implemented safety boundary

- Only a typed synthetic `{type:'catalog-count', locale:'ko'|'en'|'ja',
  count:141}` metadata record is accepted for a dry-run inspection.
- Live calls, network transport, OAuth, API keys and secret reads are absent.
- All paths always emit `external_ai_calls:0`, `transmitted_bytes:0`,
  `repository_writes:0`, `api_cost_usd:0`, `retries:0`.
- Any policy modification, unknown data field, forged approval or private payload
  fails closed without returning the suspicious input.
- Existing Phase 1–6 offline tests, catalogue/image protection tests and
  Chromium/WebKit iPhone/browser regression run on standard free public runners.
- Workflow uses only `pull_request`, `contents:read`, pinned setup actions,
  no secrets, no `pull_request_target`, no write-capable bot and no deploy.
- The workflow's standard package setup may use GitHub/npm infrastructure,
  **never an AI inference endpoint**.

## Exit criteria before any real connection (requires separate approval)

1. Confirm each provider's authorization method and plan/region eligibility.
2. Verify official ChatGPT OSS/remote execution permission and stable host ID.
3. Confirm Claude OAuth scope and separate token security review; never use the
   write-enabled default GitHub Action without an explicit permissions audit.
4. Confirm Google unpaid project, specific free model and quota, without
   turning on Cloud Billing; block on quota exhaustion, no automatic retries.
5. Choose a trusted, owner-initiated live workflow separate from PR CI; store
   any credentials in protected secrets only after explicit user approval.
6. Keep guest data entirely out of Actions logs, prompts, artifacts and vendors.
7. Obtain explicit authorization to send a public test request. A policy gate
   or a self-declared `approved` field is never authorization.

Until those gates are separately approved and verified, overall **live AI
connection = BLOCKED** while **Phase 7 offline readiness = PASS** when CI passes.

## Local verification

```sh
node --test tests/ai-trinity-preflight.cjs tests/ai-trinity-router.cjs tests/ai-trinity-offline-adapters.cjs tests/ai-trinity-connection-preflight.cjs tests/ai-trinity-orchestrator.cjs tests/ai-trinity-manual.cjs tests/ai-trinity-phase6.cjs tests/ai-trinity-phase7-readiness.cjs
node scripts/ai-trinity-phase7-readiness.mjs --offline-demo
```
