# AI Trinity — Phase 3B Offline Connection Preflight

## Scope and stacked review

- Parent: Draft PR #79, HEAD `9290533159f86446d00ab3f9ff2133e93710d88f`.
- Branch: `feat/ai-trinity-preflight-gates-20261023`.
- PR base: `feat/ai-trinity-offline-adapters-20261023` (not `main`).
- New files only: connection policy, connection preflight module, preflight tests,
  this document and the Phase 3B read-only Actions workflow.
- PRs #76-#79, main, catalog, image inventory, UI, EN/JA/KO content,
  Pages deployment and other application behavior must remain unchanged.

## No live connection exists

This is a **local design-time preflight**. `previewConnection()` accepts a tiny,
strictly typed public-metadata fixture and prepares the **Phase 3A mock**
adapter only. It returns `REVIEW_REQUIRED` after validation, never an execution
permit. `invokeConnection()` always returns `BLOCKED`.

There are no real provider SDKs, API keys, HTTPS/network requests, paid tokens,
data uploads, customer records, repository mutations, or deployments. Mock
providers have names `chatgpt`, `claude` and `gemini`; those labels do not mean
their AI models actually participated in a simulation.

## Fail-closed safety gates

1. **Privacy:** Only an exact `metadata` record shaped `{type:'catalog-count',
   locale:'en'|'ja'|'ko', count: integer 0..10000}` is accepted. Free-text
   prompts, names, emails, reservations, flights, credentials and extra/nested
   fields are refused with *reason codes only*. Phase 2 task gates are reused.
   Pattern detection alone does not prove that text is anonymous; this Phase
   accepts **no** arbitrary text or files.
2. **Cost:** `estimateIllustrativeCost()` uses fixed, dated pricing snapshots
   (USD per million tokens), with upward micro-dollar rounding. These quotes are
   **examples only**, not guaranteed current billing rates or eligibility for
   real model access. Any positive cost fails the Phase 3B `$0` spending gate.
3. **Approval:** The only accepted record is an *untrusted pending request* for
   public metadata and the chosen provider. Expired, malformed, mismatched or
   longer-than-24-hour requests fail. A self-declared `approved` value is
   rejected; no identity/authentication or externally verified grant exists.
   A valid pending request still yields `REVIEW_REQUIRED`.
4. **Error containment:** Unknown/missing fields, altered policies, invalid
   token estimates, unsupported providers, expired requests and invalid clocks
   fail closed without echoing the offending content.
5. **Zero effects:** All results advertise zero external AI calls, transmitted
   bytes, repository writes, API spend and retries. No fallbacks are possible.

Pricing snapshot (2026-10-23, indicative base input/output rates per 1M tokens):

| Provider label | Example model | Input USD | Output USD |
| --- | --- | ---: | ---: |
| chatgpt | gpt-6-luna | 0.10 | 0.50 |
| claude | claude-haiku-5.5 | 0.10 | 0.50 |
| gemini | gemini-3.5-flash-lite | 0.30 | 2.50 |

Before any **real** integration, re-check model IDs and prices using the
providers' documentation, assess data-processing terms, approve the exact
payload and provider, set verified billing caps and an authenticated approval
authority, and design a separately secured server-side transport. This Phase
does not implement a cryptographic approval system or secure live transport.

## Verification

Run from repository root using Node.js 22:

```sh
node --test tests/ai-trinity-preflight.cjs tests/ai-trinity-router.cjs tests/ai-trinity-offline-adapters.cjs tests/ai-trinity-connection-preflight.cjs
AI_TRINITY_PHASE3B_OFFLINE=true node scripts/ai-trinity-connection-preflight.mjs --demo
```

The new GitHub Actions workflow uses a read-only `GITHUB_TOKEN`, pinned
`actions/checkout` and `actions/setup-node`, exact stacked branch conditions,
no secrets, no uploads, no paid AI calls and no mutation steps. The normal
checkout/setup networking is GitHub runner infrastructure, **not** an AI data
transfer. Never copy guest details or private project files to Actions logs.
