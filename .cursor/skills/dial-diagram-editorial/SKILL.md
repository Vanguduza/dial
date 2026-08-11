---
name: dial-diagram-editorial
description: >-
  Choose and specify editorial diagrams for DIAL architecture and ops (layer
  stack, Temporal delivery swimlanes, Job Reserve state machine, Intelligence
  Factory loop, D-51 dual capacity, Command Centre Actual vs Simulated). Use when
  planning ERP boundaries, delivery/money flows, or docs under docs/architecture
  or docs/diagrams. Inspired by cathrynlavery/diagram-design (MIT). Authority: D-55.
---

# DIAL diagram-editorial (D-55)

Thin **DIAL-authored** index. Does **not** vendor the upstream asset gallery or 27×3 HTML examples.

**Upstream (optional personal install):** [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) — MIT. If installed, load its `references/type-*.md` for layout conventions; otherwise describe the diagram in prose or Mermaid for PR comments only.

## When to trigger

- Architecture / package-boundary planning after `dial-grill-locks` (or during Plan of `dial-tracer-slice`)
- Explaining Temporal delivery, Job Reserve, dual capacity, Factory, or Command Centre to humans
- Authoring `docs/architecture/*` or versioned HTML under `docs/diagrams/`
- Threat Dragon companions need a **non-STRIDE** explanatory figure (Threat Dragon remains D-48 SoR for STRIDE)

## When not to use

- Substituting a pretty diagram for grill, tracer DoD, or money-path audit
- Operational map/distance truth (MapLibre / OSRM / VROOM remain SoR — D-44)
- Customer-app UI redesign that reopens C-5 or purple/glow marketing defaults
- Money/compliance runbooks that need whimsy/sketchy primitives — use sober editorial skin only

## Inputs

| Input | Required | Notes |
| --- | --- | --- |
| Domain intent | Yes | Which DIAL lock/domain (money, delivery, Factory, dual capacity, …) |
| Audience | Yes | Eng / ops / counsel / investor — density follows audience |
| Output sink | Yes | `docs/diagrams/*.html`, architecture MD, or Mermaid-in-PR |
| Brand tokens | Optional | Prefer `packages/design-tokens` / site tokens; do not invent a second brand SoR |

## Outputs

1. **Type pick** from the DIAL map below (+ rationale in one sentence)
2. **Node/edge inventory** (≤ complexity budget; focal accent on money/ledger or the decision being explained)
3. **Artefact:** HTML+SVG if upstream installed; else Mermaid or structured prose checklist
4. **Lock callouts** annotated on the figure (e.g. *Simulated never auto-pays*, *no Fleetbase SoR*)

## DIAL type → domain map

| DIAL subject | Preferred type(s) | Must show / must not show |
| --- | --- | --- |
| ERP / monorepo boundaries | **Layer stack** or **Architecture** | `apps/*` → `packages/{orders,pricing,payments,ledger,delivery,promotions,ai}` → Postgres / Meili / Temporal / outbox. Focal accent on **money packages + ledger** only |
| Delivery dispatch (D-45) | **Sequence** or **Swimlane** | Actors: customer / courier / Temporal `DeliveryDispatchWorkflow` / MapLibre client. Offer → accept → pickup → POD. **No** Fleetbase-as-SoR node |
| Job Reserve / PSP | **State machine** | Reserve → capture / release; **webhooks as truth**. Pair follow-up: `dial-money-path-review` / `dial-psp-adapter-completeness` |
| Intelligence Factory (D-54) | **Loop** | Outcomes → datasets → Promptfoo → human promote → production. Annotate: no silent auto-publish; AI never writes payable amounts |
| Command Centre (D-54) | **Quadrant** | Axes: Actual vs Simulated × control vs observe. Annotate: **Simulated never auto-pays** |
| Dual capacity (D-51) | **Venn** or **Nested** | `MARKETPLACE` agency vs `DIAL_OWNED` principal SKUs; disclose seller; separate COGS/inventory — no marketplace-wide principal flip |
| B2B hide informal (D-49) | **Data flow** or **DP security matrix** | Search / Meili / offer APIs filter by role — informal never visible/sellable to B2B |
| WA Flows (D-40) | **Sequence** | Official Cloud API only — no Baileys / unofficial clients |

## Editorial habits (from upstream, DIAL-skinned)

- Target density ~4/10; above ~9 nodes → split overview + detail
- One accent colour; coral/accent = **1–2 focal nodes** (usually ledger / Temporal / MetricContract)
- Prefer deletion over decoration; no shadow soup, no Mermaid-default rainbow
- Diagrams **after** grill shared understanding; **before** Expand sprawl if they clarify DoD

## Anti-patterns

- Vendoring upstream `assets/` or example HTML trees into the monorepo
- Treating diagrams as substitute for `dial-grill-locks` / `dial-tracer-slice` DoD
- Drawing Google/Mapbox as distance SoR, Medusa/OfferKit as money SoR, or Expo customer shells
- Sketchy/whimsy skin on fiscal, WHT, or escrow runbooks

## Authority

**D-55**; companion `DIAL_External_Skills_Repos_Utilization.md` §1 (locked adopted). Attribution: cathrynlavery/diagram-design (MIT). Does not reopen C-5 / D-38…D-54.
