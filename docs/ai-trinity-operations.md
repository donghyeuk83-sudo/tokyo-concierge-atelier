# AI Trinity — Phase 1 Dry-run

## Scope

This is a **no-cost, read-only preflight**, not a working three-provider AI router.
It does not call OpenAI, Anthropic, Gemini, GitHub write APIs, deployment services,
or any private data endpoints. It installs no packages, uses no API credentials,
and does not modify the application, venue catalog, media mapping, i18n, or Pages.

The only allowed repository is `donghyeuk83-sudo/tokyo-concierge-atelier`.
The only allowed files are the five paths in `config/ai-trinity-policy.json`.
The `main` branch, PR #76, existing workflows, and production remain untouched.

## Checks

Run `node --test tests/ai-trinity-preflight.cjs` locally with Node.js 22.
The preflight fails closed (`BLOCKED`) unless the event is manual, the source
is the repository's `main`, and a supplied full SHA exactly equals `GITHUB_SHA`.
Any request to write, deploy, call an external AI, incur API cost, or operate
outside the approved five paths is blocked.

## GitHub Actions

The PR event runs **unit tests only**, and only for the exact pilot branch
`feat/ai-trinity-dry-run-20261023`. It does not run the manual preflight, use
secrets, or post changes. The existing Browser smoke QA may independently run
because it already triggers on pull requests.

GitHub requires manually dispatched workflows to be registered on the default
branch. Because this Phase 1 PR must remain Draft and must not be merged, the
`manual-preflight` job is intentionally **not expected to be runnable on GitHub
until a separately approved future change**. This is not a test failure;
the PR unit-test job is the Phase 1 CI verification gate.

## Approval and stop rules

No merge, deployment, image changes, deletions, external data transfers, or
paid AI/API/runners are approved. If repository SHA changes, permission to
write is requested, a test fails, or a runner cannot be confirmed within the
free standard public-repository quota, stop and report `BLOCKED`.

Before any future multi-AI connection, obtain separate approval for provider
accounts, API costs, exact data sent to each provider, and secrets management.
Keep all private Westin and Character Studio content out of this workflow.
