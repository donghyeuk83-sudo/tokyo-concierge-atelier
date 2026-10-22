# AI Trinity — Phase 3A Offline Adapter Contract

## Stacked review and immutable parent

- **Parent:** Draft PR #78, HEAD `e0553a33429f4cd39fb07594011b2e656cdb7cea`.
- **Pilot branch:** `feat/ai-trinity-offline-adapters-20261023`.
- **PR base:** `feat/ai-trinity-offline-router-20261023`, not `main`.
- The five **new** Phase 3A files are `config/ai-trinity-adapter-policy.json`,
  `scripts/ai-trinity-offline-adapters.mjs`, `tests/ai-trinity-offline-adapters.cjs`,
  `.github/workflows/ai-trinity-phase3.yml`, and `docs/ai-trinity-phase3.md`.

Do not modify PRs #76, #77, #78, their files, main, the application, catalog,
photos, styles, languages, or live Pages. No merge, deployment, auto-merge,
branch deletion, paid API use, or external AI transfer is approved.

## What is actually connected

The adapter factory exposes a small common interface for the **labels**
`chatgpt`, `claude`, and `gemini`:

- `prepare`: validates a structured metadata-only simulation envelope, then
  describes the disabled transport and assigned mock role.
- `invoke`: **always returns `BLOCKED`**; no network client exists.
- `runOfflineAdapterTrial`: exercises the three adapters against synthetic
  consensus, conflict, abstention, and mock error fixtures.

**No real AI provider is connected.** A simulated vote is not a model response.
There are no credentials, package installs, HTTPS calls, outbound messages,
private data reads, or write executors in these files.

## Privacy and approval gates

The strict contract accepts no prompt or free-text payload fields. Only the
public Tokyo Concierge Atelier repository and the Phase 2 `public-metadata`
task classification are permitted. Extra fields (including guest details,
emails, reservation numbers, API keys, or approval claims) are blocked and
never echoed back in outputs.

| Request | Result |
| --- | --- |
| `simulate` / `review` with public metadata and $0 | Local simulation only |
| `edit`, `commit`, `push`, `draft_pr` | `BLOCKED`, requires separate human approval |
| `merge`, `deploy`, `delete`, `external_ai`, `paid_api` | `BLOCKED` in Phase 3A |
| Sensitive fields, altered policy, nonzero cost, claimed approval | `BLOCKED` |
| Mock conflict or abstention | `REVIEW_REQUIRED`; no auto-execution |
| Mock timeout, rate limit, unavailable or malformed response | `SIMULATED_FAILURE`; zero retries and no fallback |

Every result reports zero external AI calls, transmitted bytes, repository
writes, API cost, and retries. These controls protect the **Phase 3A code path**;
they do not claim that all possible future AI integrations are safe.

## Local and PR verification

Run with Node.js 22 from the repository root:

```sh
node --test tests/ai-trinity-preflight.cjs tests/ai-trinity-router.cjs tests/ai-trinity-offline-adapters.cjs
AI_TRINITY_PHASE3_OFFLINE=true node scripts/ai-trinity-offline-adapters.mjs --demo
```

The Draft PR workflow uses pinned standard `ubuntu-latest` actions and
`permissions: contents: read`, and only runs on the exact stacked PR branch.
It has no secrets, upload steps, network/API commands, or mutation tasks.

Before any live integration, obtain **separate** authorization for exact
provider accounts, billing limits, allowed data, privacy terms, API secrets,
deployment environment, and approval and rollback procedures.
