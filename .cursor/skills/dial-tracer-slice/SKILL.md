---
name: dial-tracer-slice
description: >-
  Implementation sequencing inside a fully planned feature (Plan→Build thin
  vertical→Expand in-ticket→Done). Tracer = build order only — not permission
  to ship stubs. Ticket incomplete until feature DoD 100% plus evidence.
  Inspired by AI Hero tracer bullets; Reality Checker evidence habits from
  agency-agents (MIT). Authority: D-52 / D-55 / D-56.
---

# DIAL tracer-slice (D-52 / D-55)

## Locked interpretation

**Tracer = build order against a complete spec — not a license to ship stubs.**

Founder lock (**D-52**):

1. **Due diligence in planning first** — near-complete ACs / DoD before code.
2. Tracer = **sequence only**, against that complete spec.
3. Sequence: **Plan → Build (thin vertical) → Expand in-ticket → Done**.
4. **Hard ban:** equating “MVP” or “tracer done” with stub/scaffold-only delivery.

## When to use

Implementing a multi-layer DIAL feature (API + `packages/*` + outbox/webhook/UI) **after** planning diligence is done (Pack ACs / ticket DoD present). Also when an agent starts horizontal CRUD/auth/middleware sprawl before the first green critical path.

## Prerequisites (before Build)

- Ticket (or equivalent) has a **feature DoD checklist** derived from Pack / v4 ACs — not invented mid-code.
- Money / WA / maps / promotions / delivery / AI / dual-capacity / Catalogue Factory / Intelligence: run **`dial-grill-locks`** in Plan first (**D-56**); do not code until shared understanding + locks respected.
- MVP-locked items (**D-37**, **D-41**, **D-51**, etc.) appear in DoD **from day one** — no “Phase 2 dump” deferral of locked scope.
- Epic-level work: **completion matrix** (ACs × channels web / WA / native) exists; blanks = incomplete.

## Workflow

Inspired by [Tracer Bullets](https://www.aihero.dev/tracer-bullets) (AI Hero) — **DIAL-authored**; sequencing only.

### Plan

1. Confirm ACs / DoD / channel matrix are near-complete enough to execute without inventing product scope.
2. Name the **thinnest end-to-end slice** that proves the approach (one happy path) — still counted against the full DoD, not a substitute for it.
3. Optional: `dial-diagram-editorial` for multi-actor / state-machine features (clarify DoD, not replace it).

### Build (thin vertical)

4. Touch only the layers needed for that first green path (e.g. one route → one package function → one AC assertion). Skip sibling endpoints, full error matrices, and polish **temporarily**.
5. Validate: typecheck/tests or manual AC for that path.

### Expand in-ticket

6. Stay on the **same ticket/epic** until remaining DoD items land (more endpoints, channels, edge cases, polish). Prefer fresh context for large expansions, but **do not** close the ticket as “tracer done.”

### Done (DoD 100% + evidence)

7. Ticket / PR is **incomplete until DoD 100%** and the completion matrix has **no blanks** for in-scope channels.
8. Money / fiscal / PSP / promo paths: after the path compiles, run `dial-money-path-review` (audit-then-fix) before claiming done.
9. **Reality Checker evidence** (agency-agents habit, MIT → DIAL): before claiming Done, attach **evidence**, not vibes:
   - [ ] Automated tests and/or typecheck green for in-scope packages
   - [ ] UI tickets: screenshot(s) or Playwright smoke (`dial-webapp-recon`) for the happy path
   - [ ] Webhook / money tickets: idempotent replay note or test proving duplicate event is no-op
   - [ ] AI tickets: Promptfoo (or linked eval) + human promote path cited (**D-54**) — not self-certified “looks good”
10. Reject Rapid Prototyper / stub-MVP culture — conflicts **D-52**.

## Anti-forgetfulness checklist

- [ ] Feature DoD checklist in the ticket (from Pack ACs)
- [ ] `dial-grill-locks` in Plan (**D-56**) on money / WA / maps / AI / dual-capacity / Catalogue Factory / Intelligence
- [ ] First green path shipped as build order — **not** as “feature complete”
- [ ] Expand remaining DoD in-ticket (or linked tickets under the same epic DoD)
- [ ] Completion matrix ACs × (web / WA / native) filled — **no merge if blanks** for required channels
- [ ] No Phase-2 dump of MVP-locked items (D-37, D-41, D-51, …)
- [ ] Evidence attached (tests / screenshots / webhook replay / Promptfoo cite as applicable)

## Anti-patterns

- **“MVP = stub”** / scaffold-only claimed as launch-ready
- Closing a ticket after the tracer path while DoD or channel matrix remains open
- Outrunning headlights: all verbs + middleware + rate limits before the DB/ledger call works
- Horizontal-only tickets (“models first, API later, UI last”) with no integration seam **and** no full-feature DoD
- Expanding into locked donors (Medusa/OfferKit as SoR, Baileys, Google Maps SoR)
- Deferring MVP locks (D-37 / D-41 / D-51 / …) to a vague Phase 2
- “Ship now, evidence later” / fantasy A+ without tests or Promptfoo+human for AI

## Authority

**D-52** (v4 decision log + §0.2); **D-56** plan-phase grill; **D-55** evidence habits; Agent Pack §2.2; Blueprint §8.2; `DIAL_AIHero_Adaptations.md`; `DIAL_External_Skills_Repos_Utilization.md` §2.
