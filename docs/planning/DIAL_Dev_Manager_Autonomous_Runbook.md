# DIAL Dev Manager — Autonomous Runbook (no manual gates)

**Authority:** Blueprint §8 / §8.0 · Dev Manager paste prompt · Pack §0 / §2.2 / §4 / §15 · D-52 / D-56 / D-61  
**Status:** Active — 2026-08-12  
**Purpose:** Operate Build **without waiting for human input** wherever docs already encode a default. Escalate only true OPENs.  
**Stage order SoR:** [`DIAL_Build_Workplan.md`](./DIAL_Build_Workplan.md) · live pointer [`DIAL_Build_Workplan_STATE.md`](./DIAL_Build_Workplan_STATE.md)

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

**Idle ban:** Do **not** end a Dev Manager turn waiting for founder input while `current_stage` is incomplete or while a stage just went green. Always leave the session either (a) mid-build on the active stage, or (b) having opened+started the next stage. The only allowed pause is the §5 hard-stop list.

**Cursor / chat harness note:** Auto-advance does **not** mean a background process continues after the agent turn ends. Cursor only runs when a message (or loop wake) arrives. Ending a turn with “next is Sxx” and no further tool calls **is idle**. Prefer: continue Build in the same turn, or arm a recurring `/loop` wake that re-reads `DIAL_Build_Workplan_STATE.md` and continues.

---

## 1. Continuous loop (every session)

```text
READ STATE  →  docs/planning/DIAL_Build_Workplan_STATE.md → current_stage
PRIORITY 0  →  env green + auto-push path OK (S00)
TICKET      →  exactly one active thin-vertical (or expand in-ticket)
BUILD       →  dial-tracer-slice: thin green path → expand DoD
GATES       →  typecheck/test; money-path / grill / AI review when in scope
LAND        →  on stage green: **commit + push immediately** (living docs + STATE in same commit) then AUTO-ADVANCE
AUTO-ADVANCE →  if stage green (DoD 100%+evidence) → open next stage ticket
                 AND start Build immediately — NO human confirm, NO idle wait,
                 NO ending the turn after “next is Sxx” without either more Build
                 or a wake loop tick already armed
```

**Stage-green gate (mandatory):** When `current_stage` flips to green, Dev Manager **must** `git add` evidence + living docs + STATE, `git commit`, and `git push` to `origin` **before** narrating completion. Skipping push is an idle-ban violation equal to stopping between stages.
Never: parallel T1+ product trains before active thin-vertical ticket exists.  
Never: close ticket as “tracer done” with blank matrix cells.  
Never: pause between green stage and next stage for founder preference when prefer/lock exists.

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

## 3. End-to-end stage queue (auto-advance)

**Full table + green gates:** `DIAL_Build_Workplan.md` (S00→S90 eng; **PD1→PD4** product depth; S99 customer-open = human only).

When **S10 E2a** goes green, Dev Manager **immediately** opens and starts:

| Stage | Ticket | Notes |
| --- | --- | --- |
| S11 | **E1a** money spine | OfferSnapshot → PSP webhook stub → ledger → `FiscalReceiptQueued` (D-59) |
| S12 | **E1b** | Daily ZiG admin + EcoCash ZiG/`fx_rate_id` |
| S20…S30 | T1 → T3 → T5 → T4 → E3a → T6 → E4a/T7 → E5a → E6a/T8 → T9 | Pack §15 ACs = Done |
| S90 | Eng Build complete | Living docs current |
| **PD1…PD4** | Product depth | Auth → Meili/Factory → Spare → sandbox PSP — **auto within band**; no OpenAPI invent |
| **G1** | Groceries | Plan/code only after PD1–PD4 deps green |
| S99 | Customer-open | **Not auto** — Appendix C / Blueprint §8.1 |

Do **not** ask between stages. Update `DIAL_Build_Workplan_STATE.md` on every transition. Do **not** invent S466+ OpenAPI micro-stages.

---

## 4. PR / commit protocol (unattended)

1. Feature branch per ticket: `build/e2a-spare-wa-checkout` (etc.)
2. Small commits; message explains **why**
3. Same PR: code + `CHANGELOG` / `README` / `ENHANCEMENTS` / `BUGS` as applicable
4. Lefthook pre-commit: typecheck + test must pass
5. **On every stage green:** commit + push in the same turn (do not batch “later”)
6. Post-commit: `scripts/git-auto-push.ps1` → `origin` (`Vanguduza/dial`); if hook misses, push manually
7. Never `--force` to `main`/`master`
8. Issue comment when thin path green and when DoD rows flip to Y

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

- [ ] Read `DIAL_Build_Workplan_STATE.md` — know `current_stage`
- [ ] PRIORITY 0 still green
- [ ] Active issue linked; DoD/matrix in issue body
- [ ] Working only on active ticket expand **or** auto-advancing to next stage (no wait)
- [ ] No Baileys; USD browse; EcoCash\|COD buttons; `amountMinor`
- [ ] Living docs + STATE.md in landing PR
- [ ] Pushed to `Vanguduza/dial`

*End of autonomous runbook.*
