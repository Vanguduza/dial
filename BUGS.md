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

_None known at seed time (2026-08-11). T0 typecheck/test green locally per Plan handoff; re-verify after each train._

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

| ID | Title | Severity | Status | Surface | Repro | Owner | Opened |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BUG-001 | Prime 0.7.2 Windows daemon never completes worker hello/`worker_auth` (PowerShell `getProcessStartId` livelock) | blocker | fixed | Prime harness / D-61 | `prime-agent -p --provider cursor --model auto --no-session -- "PONG"` timed out 30s | DIAL | 2026-08-13 |

Fix: `scripts/patch-prime-agent-windows-handshake.mjs` (WMIC + TTL cache); applied by `scripts/start-dial-dev-manager-prime.ps1`. Verified 2026-08-13: print `PONG` and `/dev-manager` template load. Upstream: [prime-agent#1077](https://github.com/PrimeIntellect-ai/prime-agent/issues/1077) / [#748](https://github.com/PrimeIntellect-ai/prime-agent/issues/748).

---

## Wontfix / duplicate

_None._
