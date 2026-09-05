# DIAL plan-phase DoD backlog

**Purpose:** Near-complete feature DoD before Build (dial-tracer-slice / D-52).  
**Steer:** **D-2 = agency (D-58)**; **D-51 owned stock discarded**. Customer-open still Appendix C; FDMS live credentials may stub until Phase-0.  
**Rules:** No stub-as-MVP; MVP/platform locks (D-37, D-41, D-57, D-58, D-59, D-60, **D-61**, …) in DoD from day one — **not** D-51.
**Ticket hygiene:** Assigned to **Dev Manager** (Blueprint §8.0 / Cursor prompt) — open E1a or E2a with DoD + owner before parallel trains.  
**No code scaffold** here — docs/tickets only.

Evidence codes: T tests/typecheck · W webhook replay · P Promptfoo · S screenshot/recon · A audit report (money-path / capability / IDOR)

---

## E1 — Money spine + Job Reserve + WHT + agency FDMS (D-58) + Spare FX (D-57)

| Field | Content |
| --- | --- |
| Locks | C-4, D-40a, D-43, D-49, D-50, **D-58** (D-51 discarded), **D-57** |
| Grill | Topic 1; **D-2 = agency**; owned stock discarded |
| Channels | web checkout · WA pay/status · native pay · admin money ops |
| Thin vertical **E1a** | Freeze OfferSnapshot (USD) → PSP authorize → webhook capture → ledger → **FiscalReceiptQueued** (agency) |
| Thin vertical **E1b** | Daily ZiG rate → EcoCash ZiG payable + `fx_rate_id` |

### Feature DoD checklist

- [ ] `amountMinor` + currency end-to-end
- [ ] PspAdapter stubs Paynow/ContiPay/EcoCash/PayPal/COD/escrow — D-43
- [ ] JobReserve state machine tests
- [ ] Webhook signature + idempotency; duplicate no-op
- [ ] Capture/release from webhook truth
- [ ] ITF263 / withholding_balances — D-50
- [ ] **Agency only** — no DIAL_OWNED / owned COGS (**D-58**)
- [ ] Seller disclosure Sold by {Supplier}
- [ ] B2B cannot buy informal — D-49
- [ ] Spare USD browse/cart; ZiG only at checkout — D-57
- [ ] Admin Daily ZiG rate + audit — D-57
- [ ] AI cannot set payable
- [ ] **FDMS D-59** receipt classes + in-house Gateway; e-invoices reflect tax; **WA → same fdms_outbox**
- [ ] Outbox/Temporal money/fiscal
- [ ] No NEXT_PUBLIC_/VITE_ on PSP/service_role
- [ ] dial-money-path-review before merge

**Matrix:** Tracer matrices §A + §A2

---

## E2 — WhatsApp Cloud + Flows MVP (+ D-57 checkout buttons)

| Field | Content |
| --- | --- |
| Locks | D-40, D-41, D-41a, **D-57** |
| Grill | Topic 2 confirmed; Meta template/rate OPEN parked |
| Channels | WA primary; web/native parity via same ERP APIs |
| Thin vertical **E2a** (prefer if money counsel blocked) | `FLOW_SPARE_SEARCH` → cart (USD lines) → `FLOW_SPARE_CHECKOUT` pay step with **required buttons EcoCash \| COD** → ERP `payment_intent` / COD order |

### Feature DoD checklist

- [ ] Cloud API webhook signature + idempotency — no Baileys / unofficial clients
- [ ] Spare Flow search→cart→checkout against ERP (not Chatwoot as SoR)
- [ ] Browse/search/cart surfaces show **USD only** — D-57
- [ ] Pay step: **EcoCash** and **COD** as interactive button/CTA choices (not free-text) — D-57
- [ ] EcoCash path: show ZiG payable from daily rate + `fx_rate_id` — D-57
- [ ] COD path: USD + ZiG equivalent at confirm — D-57
- [ ] Other rails (Paynow URL button) remain available per D-43 / companion
- [ ] 18-item disclosure + review before pay — §7.5
- [ ] Tech guided intake + emergency short-circuit (no AI block)
- [ ] §10 MVP catalog screens from WA companion (returns, referrals, promos consent, …)
- [ ] Chatwoot handoff keyed by customer/job/order ids
- [ ] Marketing consent gates
- [ ] Meta template IDs listed in ops runbook (go-live OPEN parked)

**Evidence:** W (WA webhook) + S (Flow pay buttons) + dep grep no Baileys

**Matrix:** §B

---

## E3 — MapLibre + delivery dispatch

| Field | Content |
| --- | --- |
| Locks | D-44, D-45, D-45a |
| Thin vertical **E3a** | Create `delivery_job` → offer one courier → accept → POD event |

### Feature DoD checklist

- [ ] Job SoR = `packages/delivery` (not Fleetbase runtime)
- [ ] `DeliveryDispatchWorkflow` offer / reject / timeout → reassign
- [ ] Zero couriers → FIFO queue
- [ ] MapLibre on delivery-android + admin live track
- [ ] Distance/ETA OSRM/VROOM — not Google/Mapbox SoR
- [ ] POD capture + COD reconcile hook
- [ ] Customer track Realtime read-only
- [ ] Multi-stop only if Pack MVP AC says so

**Evidence:** T (workflow) + S (map)

**Matrix:** §C

---

## E4 — packages/ai typed capabilities + D-61 compatibility

| Field | Content |
| --- | --- |
| Locks | C-1, §5.7–5.15, **§6.24**, D-32, D-54, D-56, **D-61** |
| Thin vertical **E4a** | `guidedIntake` → JobAssessment row only (no price) |

### Feature DoD checklist

- [ ] guidedIntake Zod + D-32 omit identity
- [ ] clientAssessment safe-self-help fail-closed
- [ ] opsDraftQuote drafts only — human + pricing engine for amounts
- [ ] Promptfoo smoke (schema / no-money / privacy) — outline now; CI at T7
- [ ] Langfuse / `AiInvocation` cost + correction hooks
- [ ] `dial-ai-capability-review` audit before merge — D-56
- [ ] Factory promote still human + Promptfoo — D-54
- [ ] Flash-Lite optional P1 — **not** on critical path
- [ ] D-61 provider-independent capability boundary; no hardcoded sole provider
- [ ] Context enters through purpose/privacy policy; no raw identity
- [ ] If exposed through Hermes, tool call maps H0–H4 and domain service remains SoR

**Evidence:** P + A (capability review)

---

## E5 — Catalogue Factory + B2B hide informal

| Field | Content |
| --- | --- |
| Locks | D-49, **D-58** (D-51 discarded), D-53, D-60 (B2C informal visible) |
| Thin vertical **E5a** | CSV ingest → human approve one SKU → Meili B2C visible; informal hidden for B2B |

### Feature DoD checklist

- [ ] Ingest batches + review queue; no auto-publish to Meili
- [ ] `search_no_result_events`
- [ ] B2B Meili/API filter excludes informal
- [ ] Offers are agency `MARKETPLACE` only — **no** `DIAL_OWNED` / principal index path (**D-58**)
- [ ] AI candidates never auto-publish

**Evidence:** T (B2B leak probe = 0)

---

## E6 — Intelligence Factory + Command Centre

| Field | Content |
| --- | --- |
| Locks | D-54, **D-61** |
| Thin vertical **E6a** | One checklist shadow → Promptfoo fail → no promote; one Actual KPI with MetricContract |

### Feature DoD checklist

- [ ] Shadow run metadata
- [ ] Promptfoo gate before promote UI
- [ ] Human promote required
- [ ] Outcome-weighted dataset version
- [ ] MetricContract registry on every CC tile
- [ ] Actual vs Simulated banner
- [ ] Integration test: Simulated cannot pay

**Evidence:** T (Simulated→payout forbidden) + P

---

## E7 — Hermes Business Agent Fabric + R2 + Provider Bridge + Quantum Intelligence (D-61)

| Field | Content |
| --- | --- |
| Locks | **D-61**, D-32, D-40, D-47/48, D-52, D-54, D-58–D-60 |
| Grill | **New D-61 Topic 7 required before code** — Supervisor → provider/manager → privacy/memory/R2 → tools → intelligence/stakeholders |
| Thin vertical **E7a** | Deterministic Supervisor + provider-policy stub + opaque subject/context compiler + one H0 read-only tool + R2 manifest/fake archive + run audit |
| Channels | internal test first; no customer-facing production traffic in E7a |

### Feature DoD checklist

- [ ] Play stays RUNNING across at least two work items; batch completion does not stop supervisor
- [ ] Pause/Resume/Stop/E-stop state-machine tests; E-stop fences H2+ writes
- [ ] Lease expiry + fencing-token stale-worker recovery
- [ ] Idempotency/checkpoint/retry test after uncertain worker interruption
- [ ] Provider adapter is configuration; no domain hardcode
- [ ] managerEligible deny test — manager task cannot silently downgrade
- [ ] API-key provider stub + supported OAuth/CLI bridge interfaces; no copied browser cookies/session tokens
- [ ] Opaque subject ID + minimum-purpose `AiContextPackage`
- [ ] Privacy Egress deny test for direct identity / prohibited data class
- [ ] Health cross-domain negative test
- [ ] H0 read tool executes through ToolCallEnvelope + object AuthZ; no raw SQL tool
- [ ] R2 object manifest + checksum/archive fake; R2 never source of current business state
- [ ] Run/tool/policy/provider provenance persisted in audit fixture
- [ ] Epistemic label + evidence contract for one deterministic management insight
- [ ] Supplier benchmark cohort/confidentiality policy type/test exists before supplier-facing output
- [ ] `dial-ai-capability-review` + `dial-grill-locks` + D-52 matrix evidence before merge

**Matrix:** Tracer matrices §E

## Next actions

1. Product/commercial locks remain closed through D-60; **D-61 is now a new canonical platform lock, not a new unresolved product choice**.
2. Run `dial-grill-locks` **Topic 7 / D-61** against master §6.24 and fill any missing E7a DoD/matrix assumptions before code.
3. Dev Manager reconstructs repo state from Git/code/tests; T0 is implemented, but most domain packages including Hermes are not.
4. Open/own one tracer ticket. Existing **E2a/E1a** remain valid business-path priorities; **E7a** is the D-61 foundation slice and may proceed in dependency-safe order/parallel only after ticket ownership is clear. Do not flood empty packages.
5. First fresh build session reruns install/typecheck/test/build in its own environment; historical T0-green documentation is not a substitute for current verification.
6. Customer-open still needs Appendix C; D-61 does not bypass POTRAZ/PSP/FDMS/tax/Meta launch gates.
