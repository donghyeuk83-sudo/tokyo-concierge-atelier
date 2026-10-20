# Tokyo Concierge Atelier · Five external-link exception triage and iPhone WebKit coverage
Reviewed 2026-10-20 from main `f5123be56f65272721f197eca0dc461167204a0f`.

## Distinguish upstream access from a broken URL

The last main Chromium Actions #39368005079 (job 118449161889) audited 131 venue hyperlinks: 126 HTTP OK, **four HTTP 403 restrictions**, and **one HTTP 503 server response**. A remote HEAD/GET status is not proof that a venue closed, is unreachable to normal browsers, or that the hotel's site is broken.

| ID | Existing exact URL and robot outcome | Independent identity/source corroboration | Decision |
|---|---|---|---|
| r06 Seirinkan, Nakameguro | `https://tabelog.com/tokyo/A1317/A131701/13003188/` 403 automated audit | Same Nakameguro restaurant listed with actual street address **Kamimeguro 2-6-4** and active operator-managed official profile `https://ge4m500.gorp.jp/` (the page explicitly calls itself the restaurant official profile); original Tabelog listing is also visible to independent web browsers `https://tabelog.com/tokyo/A1317/A131701/13003188/` | **Likely bot/access policy**, not confirmed broken link. Keep exact-restaurant URL; alternate staff-confirmation link available. |
| r11 Yoroniku, Minami-Aoyama | `https://selection.tabelog.com/tokyo/A1306/A130602/13042979/party/` 403 automated audit | `https://s.tabelog.com/tokyo/A1306/A130602/13042979/party/` shows the restaurant's reservation menu; operator-facing restaurant listing `https://a388101.gorp.jp/` and `https://restaurant.ikyu.com/119198` confirm **Minami-Aoyama 6-6-22 B1**, not Yoroniku Ebisu/Azabudai branch | **Likely listing access restriction**; do not change the precisely matched restaurant reference on bot-only evidence. |
| r38 Sushi Somei, Ebisu | `https://tabelog.com/tokyo/A1303/A130302/13253712/` 403 automated audit | Independent `https://s.tabelog.com/tokyo/A1303/A130302/13253712/` has current venue details, same exact **Ebisu-nishi 1-4-10 1F** as `https://retty.me/area/PRE13/ARE7/SUB701/100000867814/` | **Likely anti-bot access**; original direct branch listing remains valid for manual users. |
| r39 Sushi Yuji, Ebisu | `https://tabelog.com/tokyo/A1303/A130302/13310768/` 403 automated audit | `https://www.tablecheck.com/ja/sushi-yuji` identifies **Sushi Yuji / 鮨 侑じ**, actual Ebisu **4-11-9 B1F**, original booking source, distinguishing it from similarly named restaurants | **Unconfirmed access restriction**, not proof the target venue is closed. Keep the exact branch listing. |
| w02 Spa LaQua, Korakuen | `https://en.www.laqua.jp/spa/` 503 on an automated audit | Official `https://en.www.laqua.jp/spa/?lang=en`, `https://www.laqua.jp/spa/` and `https://en.www.laqua.jp/spa/information/` all publish current official Spa LaQua facility information; they announce an Aug **20, 2026** domain integration and October reopening. | **Transient upstream HTTP 503** at checker time. Not grounds for arbitrary alternate link. Reclassified in audit as `UPSTREAM_UNAVAILABLE`; report remains actionable and does not falsely mark the venue defunct. |

Official and corroboration links are only **identities/availability evidence**, not permissions to download or embed photos. Do not auto-update published venue URLs when a bot-only 403 or one-time 503 is returned. Staff should verify live bookings, opening hours and policies before guest-facing confirmations.

## Prevent false defect reports

- `tests/check-venue-links.cjs` now distinguishes `ACCESS_RESTRICTED` (403/429) from `UPSTREAM_UNAVAILABLE` (5xx) and `HTTP_ERROR` (other non-2xx). It continues HEAD-then-GET non-destructive remote checks; remaining uncertainty is retained. The five existing venue links and all photo sources are untouched.
- Add `tests/link-exception-regression.cjs` so these five IDs cannot silently change to another branch and the checker cannot mark a 503 as a definite user-site defect. The audit still keeps an explicit review queue.

## WebKit iPhone-like test coverage

- Playwright installs **both Chromium and WebKit** in CI, using the iPhone 13 device emulation with touch, scale and narrow viewport; browser behavior is WebKit, **not actual iPhone hardware**.
- `tests/webkit-mobile.cjs` serves local HTML via HTTP to reproduce Safari storage origin semantics. It checks responsive overflow, search and empty results, venue and source photo filters, quickbar, EN/JA/KO, Korean preference after reload, real two-tab localStorage sync, malformed/blocked storage handling, selected venue CSV download + BOM, Meguro vs Asakusa area correctness, detail/photo dialogs, source attribution and JS errors.
- Run WebKit locally in PR, then against the exact **published GitHub Pages main HTML** when merged; Chromium and all existing 131-venue, 89-photo and rights audits remain.

**Protected baseline:** 131 venue records; 89 registered photo mappings; 42 original photos missing/unapproved; 50 AI visuals; 46 external photo source links, 3 languages and original layout all preserved. No newly created or relicensed photo, no guest data uploaded, no merges before green PR QA.
