# Known bugs

Living register of **known bugs** affecting DIAL builds, tooling, or product surfaces. Prefer linking a ticket/PR when one exists.

**Maintenance:** add or update rows in the **same PR** that discovers or fixes the issue (Blueprint §8.0.2). Move fixed items to **Resolved** with date + PR. Dev Manager rejects “file a bug later” when the bug is already evidenced in the change under review.

**Severity:** `blocker` · `major` · `minor` · `nit`  
**Status:** `open` · `investigating` · `fixed` · `wontfix` · `duplicate`

---

## Template (copy a row)

| Field | Value |
| --- | --- |
| ID | BUG-NNN |
| Title | Short description |
| Severity | |
| Status | open |
| Surface | e.g. `apps/gateway-web`, CI, docs |
| Repro | Steps / command |
| Expected | |
| Actual | |
| Owner | |
| Opened | YYYY-MM-DD |
| Links | PR / issue / commit |

---

## Open

| ID | BUG-041 |
| Title | Supabase CLI via npx has no win32-x64 binary — blocks local GoTrue for G1 Auth without hosted sandbox keys |
| Severity | major |
| Status | open |
| Surface | Phase 1 Auth / tooling |
| Repro | `npx supabase --version` on Windows |
| Expected | Local Auth stack or documented binary path |
| Actual | `No matching Supabase CLI binary package found for win32-x64` |
| Owner | eng + founder (hosted sandbox keys unblock) |
| Opened | 2026-08-16 |
| Links | `docs/ops/phase1-sandbox-dogfood.md` |



<!-- Example row (remove when unused):

| ID | Title | Severity | Status | Surface | Repro | Owner | Opened |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BUG-001 | … | minor | open | apps/gateway-web | … | unassigned | 2026-08-11 |

-->

---

## Investigating

_None._

---

## Resolved

| ID | BUG-051 |
| --- | --- |
| Title | Sign-in 303s then `/home` bounces to `/` — in-memory DialSession lost across Vercel isolates |
| Severity | blocker |
| Status | fixed |
| Surface | `apps/gateway-web` auth session cookie + `/home` |
| Repro | Form POST `/api/auth/sign-in` on Vercel preview → 303 `/home` + `dial_session` → GET `/home` with cookie → 307 `/` |
| Expected | Stay on `/home` with Shop\|Services after successful sign-in |
| Actual | Looks like “sign-in does nothing” (land back on sign-in, no error) |
| Owner | eng |
| Opened | 2026-08-16 |
| Fixed | 2026-08-16 — HMAC-signed `ds1.*` DialSession cookies + Secure cookie attrs |

| ID | BUG-050 |
| --- | --- |
| Title | Form sign-up returned raw JSON instead of redirecting to `/home` |
| Severity | major |
| Status | fixed |
| Surface | `apps/gateway-web` `/sign-up` → `POST /api/auth/sign-up` |
| Repro | Submit Create account on `/sign-up` |
| Expected | 303 to `/home` (or safe `next`) with DialSession cookie |
| Actual | Browser showed `{"ok":true,"userId":…,"next":"/home"}` |
| Owner | eng |
| Opened | 2026-08-16 |
| Fixed | 2026-08-16 — form posts redirect like sign-in; JSON API shape preserved |

| ID | BUG-048 |
| --- | --- |
| Title | `next build` fails — gateway imports `@dial/worker-temporal`, and route/page files export non-route symbols |
| Severity | blocker |
| Status | fixed |
| Surface | `apps/gateway-web` production build / any hosted deploy |
| Repro | `pnpm --filter @dial/gateway-web build` |
| Expected | Production build succeeds |
| Actual | webpack cannot parse `@temporalio/worker` native bindings; then Next rejects `__testMoneyOutbox`, `__testPaynowPayments`, `GROCERY_CART_COOKIE`, `sessionFromCookieHeader` and optional `GET(req?)` params |
| Owner | eng |
| Opened | 2026-08-16 |
| Links | Temporal config moved to `@dial/shared`; test handles in `src/lib/testHandles.ts`; report split into `src/lib/integrationsHealth.ts` |

| ID | BUG-049 |
| --- | --- |
| Title | CSP `connect-src` blocks MapLibre tiles on any deployed origin |
| Severity | major |
| Status | fixed |
| Surface | `apps/gateway-web/src/middleware.ts` |
| Repro | Load `/delivery/track` on a non-localhost origin |
| Expected | Vector style, glyphs and tiles load |
| Actual | `connect-src 'self' … localhost` blocked every https tile fetch |
| Owner | eng |
| Opened | 2026-08-16 |
| Links | `connect-src` now allows https; localhost entries are dev-only |

| ID | BUG-042 |
| Title | G2 Spare checkout Auth return URL + NEXT_REDIRECT swallow on pay success |
| Severity | minor |
| Status | fixed |
| Surface | `apps/gateway-web` `/spare/checkout` |
| Opened | 2026-08-16 |
| Fixed | 2026-08-16 — `/?next=` sign-in return; rethrow NEXT_REDIRECT; signed-in COD web done |

| ID | BUG-043 |
| Title | Gateway Spare cart empty after Add to cart — module-scoped Map not shared across Next RSC vs server-action bundles |
| Severity | major |
| Status | fixed |
| Surface | `packages/catalogue` carts |
| Opened | 2026-08-16 |
| Fixed | 2026-08-16 — `globalThis` cart/ingest/review stores |

| ID | BUG-044 |
| Title | CSP `script-src` without `unsafe-eval` blocked Next webpack client hydration (disclosure checkbox / pay CTAs inert in `next dev`) |
| Severity | major |
| Status | fixed |
| Surface | `apps/gateway-web` middleware |
| Opened | 2026-08-16 |
| Fixed | 2026-08-16 — allow `'unsafe-eval'` when `NODE_ENV !== "production"` |

| ID | BUG-045 |
| Title | UTF-8 BOM in `packages/identity/package.json` broke Next resolve of `@dial/identity` |
| Severity | major |
| Status | fixed |
| Surface | `packages/identity` (+ `apps/worker-queues` package.json) |
| Opened | 2026-08-16 |
| Fixed | 2026-08-16 — strip BOM |

| ID | BUG-047 |
| Title | `/api/spare/orders` listed/tracked any `orderId`/`customerId` without session object-level AuthZ |
| Severity | major |
| Status | fixed |
| Surface | `apps/gateway-web` `/api/spare/orders` |
| Opened | 2026-08-16 |
| Fixed | 2026-08-16 — session + `assertResourceAccess`; reject body/query `customerId` (D-47) |

| ID | BUG-046 |
| Title | Admin delivery track was a CSS gradient with projected pins, not MapLibre GL — G5/G7 map recon was stub evidence |
| Severity | major |
| Status | fixed |
| Surface | `apps/gateway-web` `/admin/delivery/track` |
| Opened | 2026-08-16 |
| Fixed | 2026-08-16 — `DialMap` (maplibre-gl) with raster fallback + 10s watchdog; retract prior stub screenshots |

| ID | Title | Severity | Status | Surface | Repro | Owner | Opened |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BUG-001 | Prime 0.7.2 Windows daemon never completes worker hello/`worker_auth` (PowerShell `getProcessStartId` livelock) | blocker | fixed | Prime harness / D-61 | `prime-agent -p --provider cursor --model auto --no-session -- "PONG"` timed out 30s | DIAL | 2026-08-13 |

Fix: `scripts/patch-prime-agent-windows-handshake.mjs` (WMIC + TTL cache); applied by `scripts/start-dial-dev-manager-prime.ps1`. Verified 2026-08-13: print `PONG` and `/dev-manager` template load. Upstream: [prime-agent#1077](https://github.com/PrimeIntellect-ai/prime-agent/issues/1077) / [#748](https://github.com/PrimeIntellect-ai/prime-agent/issues/748).

---

## Wontfix / duplicate

_None._

