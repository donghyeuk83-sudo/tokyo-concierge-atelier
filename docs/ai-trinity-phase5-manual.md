# AI Trinity Phase 5 — zero-cost manual review preview (Draft)

This is an **isolated opt-in preview** within the existing Tokyo Concierge Atelier repository. It does **not** change the production site, existing index, approved venue data, photos, translations, CSV, storage, or Phases 1–4.

## What this is

- A standalone local HTML page: docs/ai-trinity-manual-preview.html.
- It works with ordinary classic script loading (../scripts/ai-trinity-manual.js) and needs no build server, bundle, SDK, login, API key, or API request.
- The user **manually** copies a public tourism question to ChatGPT, Claude and Gemini by following links that have no query text or referrer, then **manually** pastes the responses into three fields.
- Only whitespace-normalized, case-insensitive **exact text equality** is tested. This is not semantic consensus, factual validation, a recommendation engine, or provider authentication.
- No automatic navigation, sending, clipboard reading, localStorage, IndexedDB, cookies, analytics, repository writes or deployment.
- Local UI buttons can select text, compare responses, or clear unsaved inputs. All decisions stay execution_authorized:false, api_calls:0, transmitted_bytes:0, api_cost_usd:0.

## Privacy and human review

- The preview warns against guest names, reservation/flight/room numbers, phone numbers, emails, payment details and credentials.
- A defensive text filter rejects common sensitive patterns in the question and all pasted answers. **Filtering is not a guarantee** that all private information can be detected. Hotel guest data must never be entered.
- Navigating to a provider website is an explicit user action. Pasting a question there is a separate **user-directed external transfer governed by that provider**, never a transfer by this preview.
- The user must check official venue sources, permission, location, operating information and topical relevance independently before using a response for a guest.
- No preview output is saved, shared or added to the venue catalog.

## How to preview locally

1. Open docs/ai-trinity-manual-preview.html from the repository clone.
2. Enter a public tourism question only.
3. Select and manually copy the question; manually open the three provider websites.
4. Manually paste each external answer into its corresponding field.
5. Click **텍스트 비교하기** and review all three answers. No response is automatically accepted.
6. Click **모든 입력 지우기** when finished.

If a browser blocks locally loaded scripts under file://, serve the clone through a local static server and repeat the browser test. Do not enable an external deployment to work around a local test limitation.

## CI and release gates

- Run six Node test suites for Phases 1, 2, 3A, 3B, 4 and 5.
- Independent read-only Phase 5 GitHub Actions workflow; public standard runner, pinned checkout/setup-node, no secrets, API services, or external AI.
- Browser UX QA in Chromium and iPhone WebKit is required before any integration into the site; the standalone preview does not certify its own browser compatibility.
- A Phase 5 Draft PR is based on the Phase 4 Draft branch. Do not merge, mark Ready, deploy, auto-merge, remove branches or change PR #79–#81 without a separate owner instruction.
- **No production launch and no real three-provider API integration are claimed.**
