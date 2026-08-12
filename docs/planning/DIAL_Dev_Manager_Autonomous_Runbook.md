# DIAL Dev Manager — Autonomous Runbook (no manual gates)

**Authority:** Blueprint §8 / §8.0 · Dev Manager paste prompt · Pack §0 / §2.2 / §4 / §15 · D-52 / D-56 / D-61  
**Status:** Active — 2026-08-12  
**Purpose:** Operate Build **without waiting for human input** wherever docs already encode a default. Escalate only true OPENs.

---

## 0. Decision policy (autonomy)

| Situation | Action (no wait) |
| --- | --- |
| Prefer rule exists (e.g. **E2a** unless money-spine first) | Apply prefer; do **not** ask founder |
| Lock / `[FOUNDER]` already decided | Honour; never reopen |
| Phase 0 commercial (Meta templates, live PSP, ZIMRA creds) | Track in `ENHANCEMENTS.md` ENH-020…; **scaffold stubs**; do not block eng |
| Product OPEN parked in grill | Leave parked; continue scaffoldable work |
| Ambiguity with **no** prefer/lock | Choose smallest reversible option aligned with Pack stub-now; log in ticket + `ENHANCEMENTS.md`; continue |
| Secrets / force-push to main / lock reopen | **Hard stop** — only these require human |

**Human is optional observer, not a step in the loop.**

---

## 1. Continuous loop (every session)

```text
PRIORITY 0  →  env green + auto-push path OK
TICKET      →  exactly one active thin-vertical (or expand in-ticket)
BUILD       →  dial-tracer-slice: thin green path → expand DoD
GATES       →  typecheck/test; money-path / grill / AI review when in scope
LAND        →  commit + living docs same PR + auto-push
NEXT        →  if DoD 100%+evidence → open next ticket from queue; else continue expand
```

Never: parallel T1+ product trains before active thin-vertical ticket exists.  
Never: close ticket as “tracer done” with blank matrix cells.

---

## 2. Active ticket (locked default)

| Field | Value |
| --- | --- |
| Ticket | **E2a** — [Vanguduza/dial#1](https://github.com/Vanguduza/dial/issues/1) |
| Why | Prompt / Pack / DoD backlog **prefer E2a**; founder directed **no manual input** → treat prefer as confirmed |
| Owner | Dev Manager (this agent) + delegated implementer subagents |
| Done when | Matrix B (+ A2 checkout cells) all `Y` + evidence; DoD checklist 100% |

### E2a build order (thin → expand)

1. Money/FX types + in-memory `fx_daily_rates` / `fx_rate_id`
2. Stub catalogue offers + USD-only cart
3. `payment_intents` + COD order path (`amountMinor`)
4. PspAdapter stubs: EcoCash (ZiG from daily rate) + COD (+ optional Paynow URL)
5. `adapters/whatsapp` + webhook signature/idempotency shape (no Baileys)
6. Flow handlers: `FLOW_SPARE_SEARCH` → cart → `FLOW_SPARE_CHECKOUT` with **required EcoCash \| COD** buttons
7. Green-path tests (simulated Flow → intent / COD order)
8. **Expand in-ticket:** remaining Matrix B rows (disclosure, intake, Chatwoot ids, §10 catalog, …) until 100%

Phase 0 stays stub: live Meta send, live EcoCash keys, approved template IDs (ENH-021).

---

## 3. After E2a Done — automatic next queue

Do **not** ask. Open the next owned ticket and continue:

| Order | Ticket | Notes |
| ---: | --- | --- |
| 1 | **E1a** money spine | OfferSnapshot → one PSP webhook stub → ledger → `FiscalReceiptQueued` (D-59) |
| 2 | **E1b** | Daily ZiG rate admin + EcoCash ZiG payable (closes A2) |
| 3 | **T1 Identity** | Auth home Shop\|Services; RLS profiles (Pack §15) |
| 4 | **T2/T3** catalogue + payments hardening | Expand beyond E2a stubs toward Pack ACs |
| 5 | **E3a** delivery | `delivery_job` → offer → accept → POD |
| 6 | Remaining E4–E6 / T4–T9 | Per Pack trains; grill before in-scope scaffolds (D-56) |

Customer-open still **Appendix C / Blueprint §8.1** — eng Done ≠ launch.

---

## 4. PR / commit protocol (unattended)

1. Feature branch per ticket: `build/e2a-spare-wa-checkout` (etc.)
2. Small commits; message explains **why**
3. Same PR: code + `CHANGELOG` / `README` / `ENHANCEMENTS` / `BUGS` as applicable
4. Lefthook pre-commit: typecheck + test must pass
5. Post-commit: `scripts/git-auto-push.ps1` → `origin` (`Vanguduza/dial`)
6. Never `--force` to `main`/`master`
7. Issue comment when thin path green and when DoD rows flip to Y

---

## 5. Escalation-only list (true human)

- Force-push / rewrite published history
- Reopen a lock (C-5, D-38…D-61)
- Commit or print secrets / `.env*`
- Spend real money / hit production data (none in Dev Prime path)
- Customer-open declaration (Appendix C)

Everything else: **decide via this runbook and continue.**

---

## 6. Session checklist (copy)

- [ ] PRIORITY 0 still green
- [ ] Active issue linked; DoD/matrix in issue body
- [ ] Working only on active ticket expand (or opening next after Done)
- [ ] No Baileys; USD browse; EcoCash\|COD buttons; `amountMinor`
- [ ] Living docs in landing PR
- [ ] Pushed to `Vanguduza/dial`

*End of autonomous runbook.*
