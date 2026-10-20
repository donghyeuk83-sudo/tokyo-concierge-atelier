# Tokyo Concierge Atelier · Hands-off production health, 2026-10-20

## Baseline that is actually verified
Starting main `fc6697760319611cabbe757e278d5b3d2d74c719`.
Recent GitHub Actions [browser + WebKit run #39372211238](https://github.com/donghyeuk83-sudo/tokyo-concierge-atelier/actions/runs/39372211238) passed local and **public Pages** Chromium, WebKit mobile, mobile storage persistence, share/CSV, all photo filters and 131 venue audit. The deployed GitHub Pages HTML matches main and all 89 licensed image records loaded in **both local and published browsers (178/178)**. Pages [deployment #39372211385](https://github.com/donghyeuk83-sudo/tokyo-concierge-atelier/actions/runs/39372211385) succeeded. Existing URLs r06/r11/r38/r39: automated 403/bot restriction; w02: upstream 503, no proof of broken user links.

GitHub is not the source of the former false failure: a Playwright WebKit test reused another tab's storage; repaired in PR #36 and successfully retested. This is a **public** repository using standard GitHub-hosted runners; no need to migrate working public Pages or incur an alternate hosting/service dependency. GitHub Actions public standard runner minutes remain free per current GitHub Docs, although artifact storage may still have quotas.

## Automated reliability measures installed

1. `.github/workflows/browser-smoke.yml` now runs the actual existing production QA **every day** with `schedule cron: '23 0 * * *'` (UTC, around 09:23 Tokyo, subject to GitHub scheduler delay), in addition to on-main-push, pull-request and manual runs. The scheduled run executes:
   - verify missing photo queue and rights-holder ledger
   - audit all 131 venue records and licensed photo provenance, and 131 outbound reference links
   - full Chromium original/public-site smoke and 89×2 photograph loads
   - original/public-site iPhone-sized **WebKit** device simulation: storage, multiple tabs, photos, locale, CSV, dialogs
   - AI generator/Commons researcher safety checks and scripts compilation
   - exact public Pages-main SHA match before declaring success
2. `tests/health-issue.cjs` automatically **deduplicates** production regressions into one `[Atelier Health]` GitHub Issue (not one notification per failing job). It links the run and tells maintainers to reproduce, preserve catalog/rights, create reviewed PRs and rerun both engines. When a later production run fully succeeds, the same auto-generated issue is closed with verification. This runs only on main push, manual dispatch and schedule, not PRs.
3. Permissions: `contents:read`, `issues:write` for the production QA job. Failures in GitHub issue API are logged but do not block the actual browser diagnostics. This is **not** unreviewed code self-publishing.
4. Safety invariants unchanged: 131 venue entries, 89 previously approved photographs, 42 rights-pending photos, 50 existing AI illustrative images, original 46 outbound sources, original UI and EN/JA/KO. The issue monitor has no authorization to publish copyrighted photos or modify hotel/guest data.

## Operational limits and recovery
- Scheduled GitHub Actions workflows run on the **default branch only** and can start after the cron wall-clock time. Public-repo schedules can be disabled by GitHub after 60 days of repository inactivity. This must be accounted for in longer-term monitoring; do not promise an exact minute or perpetual availability.
- Automated QA detects failures and creates a trackable incident; it does **not** blindly roll back main, change external business URLs because of transient 403/503, self-approve rights, or guarantee all vendors remain online.
- Fixes still require reproducible evidence and a **green Chromium + WebKit PR**. Browser automation cannot replace physical iPhone Safari hardware tests.
- If GitHub itself becomes unavailable later, consider redundant static Pages hosting only after verifying an independent deployment platform account, authorization and domain/guest traffic migration. There is no present need for credentials, migration, or breaking the verified public URL.
