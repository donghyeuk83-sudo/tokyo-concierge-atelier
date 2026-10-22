# AI Trinity — Phase 2 Offline Cooperation Simulator

## Review topology

- **Parent:** Draft PR #77, branch `feat/ai-trinity-dry-run-20261023`.
- **Pilot branch:** `feat/ai-trinity-offline-router-20261023`.
- **Pull request base:** the Phase 1 feature branch, **not** `main`.
- Only these five Phase 2 files are added on top of the Phase 1 commit:
  `config/ai-trinity-routing.json`, `scripts/ai-trinity-router.mjs`,
  `tests/ai-trinity-router.cjs`, `.github/workflows/ai-trinity-phase2.yml`,
  and `docs/ai-trinity-phase2.md`.

The parent PR and its existing five files are unchanged. Neither PR may be
merged, deployed, marked ready, automatically merged, or deleted during this
phase. The site's HTML/CSS/JS application, venue records, images, and i18n
remain unchanged.

## What this does

The simulator labels **three fictional responses** as ChatGPT, Claude and
Gemini, assigns deterministic roles for `code`, `review`, `research`, or
`general` tasks, and reports one of three outcomes:

- `SIMULATED_PASS`: all three synthetic votes are `accept`.
- `REVIEW_REQUIRED`: a synthetic vote conflicts or abstains; human review is
  necessary, and no decision is executed.
- `BLOCKED`: the request fails the safety policy or requires an approval.

These labels **are not real provider responses**. No provider accounts, API
keys, user prompts, images, private guest information, or tokens are used.
Input is a strict, structured simulation object with no free-text prompt field.
Only `public-metadata` tasks for the Tokyo Concierge Atelier repository are
accepted. Unknown input fields and changes to the routing policy fail closed.

## Human approval boundaries

| Action | Phase 2 handling |
| --- | --- |
| `simulate`, `review` | Allowed as local, effect-free simulation only |
| `edit`, `commit`, `push`, `draft_pr` | `BLOCKED`: approval required for any future real action |
| `merge`, `deploy`, `delete`, `external_ai`, `paid_api` | `BLOCKED`: forbidden in this phase |
| Unknown action, sensitive input, extra fields | `BLOCKED`: fail closed |

No approval token or claimed permission provided to the simulator can
authorize a real write. Phase 2 intentionally has **no mutation executor**.

## Run and verify

From the repository root with Node.js 22:

```sh
node --test tests/ai-trinity-preflight.cjs tests/ai-trinity-router.cjs
AI_TRINITY_PHASE2_OFFLINE=true node scripts/ai-trinity-router.mjs --demo
```

The Draft PR triggers a **read-only** GitHub Actions job only when targeting
the parent Phase 1 branch. It uses the public repository's standard
`ubuntu-latest` runner with `contents: read`, pinned actions, no secrets,
no package install, no uploaded artifacts, no GitHub writes, and no outside
AI data transmission.

This is an incremental offline test, **not** an operational AI router.
Real providers, actual repositories beyond this public pilot, credential
handling, spending, and any external transfer each require a separate
owner-approved future phase.
