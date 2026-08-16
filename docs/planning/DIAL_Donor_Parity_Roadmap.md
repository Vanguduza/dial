# DIAL Donor Parity Roadmap

**Founder override (2026-08-16):** copy FixItNow **customer-facing Next.js UI** into `/tech` (no LICENSE still). Do **not** redesign or restyle a thin hero. Do **not** vendor donor git history, `node_modules`, Mongo, Stripe, SSLCommerz, or JWT as SoR. Wire actions to DIAL gateway APIs.

**Status:** planning SoR + Tech public UI copy in progress (2026-08-16). **Not done** (dashboards / pay / reviews still open). Does **not** claim Completion Plan G3 or G12.  
**Authority:** `DIAL_Consolidated_Plan_v4.md` §6.2.1 + D-38; `DIAL_Development_Agent_Pack.md` §9 / §15; `AGENTS.md`; `.cursor/rules/dial-non-negotiables.mdc`; founder lock in `.cursor/rules/dial-donor-identity.mdc`.  
**This document is a plan only.** No further storefront redesign is authorised by writing it. Shared customer `AppShell` rollback is a **later Build step** (P0), not part of this planning task.

**Plan-first overrun (honest):** Founder rejected shared DIAL skin and cheap recreation. Build copied FixItNow public UI into `apps/gateway-web` `/tech` (landing, services catalogue + PDP, technician directory, marketing pages). Book → `POST /api/tech/services`. **Do not claim full FixItNow parity** — customer/technician dashboards and donor payments are not ported.

**Tech workflow overlay (2026-08-16):** how that orange UI should host diagnose, rate-card quotes, Job Reserve, EcoCash+COD, and WHT — without Stripe or AI prices — is planned in [`DIAL_Tech_FixItNow_Feature_Audit.md`](./DIAL_Tech_FixItNow_Feature_Audit.md) (AI review first; canvas `tech-fixitnow-feature-audit.canvas.tsx`). Plan only; does not implement UI.

---

## 1. Why the shared DIAL storefront skin failed

Donors were locked in v4 §6.2.1 / D-38 so DIAL would **not design from scratch**. The intended method is: take each donor’s **look, layout, screens, features, and workflows**, customise branding/copy, and **wire every action to DIAL APIs**.

What landed instead (ENH-609 as previously written) was a **single DIAL brand**: `packages/design-tokens` + `globals.css` + `AppShell` with Home / Spares / Grocery / Services tabs, Fraunces/Source Sans, and one chrome wrapping Spare browse (and still listing Tech as a tab). Grocery, supplier, account, `/`, and `/home` use the same DIAL gradient/token look. `/tech` has since started a branch-scoped `tech.css` layout, but the rest of gateway-web still reads as one cheap shared redesign.

That is the opposite of D-38. Spare is a multi-vendor parts marketplace. Dial a Tech is an orange home-services marketplace (FixItNow). Grocery is food/pantry. Supplier is a vendor panel. They must **not** share a storefront identity.

**Hard ban (founder, 2026-08-16):** do not invent or enforce one shared DIAL brand / `AppShell` look across Spare, Tech, Grocery, Supplier, Delivery, Account. Shared chrome as a single storefront skin is **out**.

Style Dictionary / `packages/design-tokens` remains valid for **admin, native primitives, and print** — not as a customer storefront skin.

---

## 2. Principle (locked)

| Layer | Rule |
| --- | --- |
| **Visual identity** | One **donor identity per branch**. `/tech` reads as FixItNow (orange `#ff7308` / `oklch(0.72 0.19 49)`). `/spare` reads as Mercur B2C. Supplier reads as Mercur vendor-panel. Grocery reads as a marketplace storefront (Mercur B2C IA + food collections). Natives follow Pack §9 donors. |
| **Backend / money** | DIAL packages only: `amountMinor`, outbox, Job Reserve, `@dial/payments`, `@dial/jobs`, `@dial/catalogue`, `@dial/delivery`. **Never** donor ledgers, auth, or PSPs as SoR (v4 §6.2.1 hard rule). |
| **Enhancements** | DIAL compliance is **additive** on top of donor UX — not a replacement skin. Overlay listed once in §3. |
| **Licence** | Recreate screens/CSS/IA in DIAL apps. Do **not** vendor donor source trees (especially AGPL; especially FixItNow with **no LICENSE**). MIT donors: still prefer recreation unless Pack already allows a CSS/theme subset **and** the LICENSE file is in the clone. |
| **Auth door** | `/` stays auth-first (v4 §1.4 / Pack §9.1). `/home` is a **neutral Shop \| Services chooser**. Destinations are branded. |
| **Admin** | In-repo queue-first IA (Pack §9.5 / v4 §6.17). **Do not** FixItNow-skin `admin-web`. |
| **WhatsApp** | No UX donor repo. Flows spec (`DIAL_WhatsApp_Flows_and_Templates.md`); EcoCash + COD **buttons** (D-57). Not FixItNow. |
| **Credentials** | No live payment / WhatsApp / tax keys until production-ready (`.cursor/rules/dial-credentials-after-testing.mdc`). Fixture/sandbox evidence until then. |

**Recommended IA (chosen — not waiting):**

- `/` = DIAL sign-in door (neutral).
- `/home` = authenticated chooser: Shop → `/spare` (Mercur identity), Services → `/tech` (FixItNow identity). Grocery / Account / Supplier are separate entries, not a fourth tab on a shared shell.
- `/tech/*` = FixItNow-identity Tech web.
- `/spare/*` = Mercur-identity Spare web.

---

## 3. DIAL enhancement overlay (additive — apply on every branch)

Donor UX first; then these DIAL requirements on the **same screens**, not a parallel product:

1. **Agency (D-58)** — DIAL is agent; seller disclosure (“Sold by {Supplier}”); no DIAL-owned principal SKUs.
2. **USD browse + ZiG at checkout (D-57)** — Spare/grocery catalogue and cart `displayCurrency = USD`; ZiG only at pay step from ops daily rate (`fx_daily_rates` / `fx_rate_id`).
3. **EcoCash + COD** — required checkout **buttons/CTAs**, not free-text only; IMTT is DIAL opex, never a customer line (D-60).
4. **B2B hide informal (D-49)** — filter search/Meili/APIs; not checkout-only.
5. **Tech WHT 30% (D-50)** — Take-Home shows gross → fees → ITF263/WHT → net `amountMinor`; do not design payouts as if WHT disappears.
6. **Job Reserve** — book-a-tech and spare checkout hold/settle on DIAL money path; AI never writes payable amounts.
7. **Official WhatsApp Cloud API only (D-40)** — no Baileys / unofficial clients.
8. **Maps = MapLibre + Nominatim/OSRM/VROOM (D-44)** — not Google/Mapbox as SoR.
9. **Delivery job SoR** = `packages/delivery` + Temporal `DeliveryDispatchWorkflow` (D-45).
10. **C-5** — native Android + iOS + web; **no Expo/RN customer shells**.
11. **Feature DoD (D-52)** — thin vertical is build order only; branch incomplete until screen matrix + API evidence + screenshots. No stub-as-MVP.

---

## 4. Internal grill (D-56) — answered from repo + founder lock

Frontier questions answered here. Human is not asked to re-confirm product direction.

| # | Question | Answer (locked / chosen) |
| --- | --- | --- |
| Q1 | Shared `AppShell` / one DIAL storefront brand? | **No.** Founder lock. Branch-scoped CSS/layouts. |
| Q2 | `/` two branded sites vs chooser? | **Chooser.** `/` auth; `/home` Shop\|Services; `/tech` FixItNow; `/spare` Mercur. |
| Q3 | Vendor FixItNow source into the monorepo? | **UI yes (founder 2026-08-16).** Copy customer-facing Next.js UI into `/tech`. **No** donor git history, `node_modules`, Mongo, Stripe, SSLCommerz, JWT as SoR. |
| Q4 | FixItNow Stripe/SSLCommerz / Google login / donor JWT as SoR? | **No.** DIAL auth cookie + Job Reserve + EcoCash\|COD\|Paynow. |
| Q5 | Cal.com as booking/job SoR? | **No.** v4 §6.10 may keep Cal.com as **slot calendar adapter**. Job + money SoR = DIAL Job Reserve + `POST /api/tech/services`. Recreate FixItNow slot-picker **UI**. |
| Q6 | FixItNow-skin DIAL admin? | **No.** Pack §9.5 queue-first. Technician **ops** → `technician-android` (Pack §9.7), not FixItNow `admin-dashboard`. |
| Q7 | Expo/RN customer shell to “match donor faster”? | **No.** C-5. |
| Q8 | Live EcoCash/WA/ZIMRA keys to finish UX? | **No.** Credentials-after-testing. UX parity evidenced on fixture/sandbox. |
| Q9 | WhatsApp UX = FixItNow? | **No.** Flows spec + required pay buttons. |
| Q10 | Grocery donor missing from Pack §9? | Use **Mercur B2C IA + food collections** (founder table). Do not hunt a new primary food repo this cycle. |
| Q11 | Natives: shared DIAL Compose/SwiftUI skin? | **No.** Same identity rule, later phases: CoolMall / eCommerce / Now in Android / foodhub-compose rider. |
| Q12 | Does this plan exit G3 or G12? | **No.** Preview stays fixture (ENH-610). |

**Open human decisions:** none blocking. Non-blocking recommendations are in §12.

---

## 5. Licence stance (per donor)

v4 §6.2.1 licence gate: confirm MIT/Apache/BSD (or counsel-cleared) **before copy-paste**. This roadmap’s default is **faithful recreation** even when MIT, because DIAL APIs are SoR and donor backends must not land in the tree.

| Donor | Licence (verified 2026-08-16) | Stance |
| --- | --- | --- |
| `AyanSujon/FixItNow` (local `.tmp/FixItNow`) | **Missing** — no `LICENSE` in clone; GitHub raw LICENSE 404 | **Founder override:** copy **customer UI** into `apps/gateway-web` `/tech`. Do not commit `.tmp/FixItNow`. Do not copy donor backend/payments/auth as SoR. |
| NearServe / Homezy | Secondary Tech polish only | Recreate; licence-check before any paste. |
| `mercurjs/b2c-marketplace-storefront` | Mercur core **MIT** (badge / docs); confirm storefront `LICENSE` at clone time | Recreate Mercur screens into `/spare`. Optional: clone to `.tmp` for **visual reference only**. Do not adopt Medusa/Mercur as commerce SoR. |
| `mercurjs/vendor-panel` | MIT family (confirm at clone) | Recreate vendor-panel IA on `@dial/suppliers`. |
| `Joker-x-dev/CoolMallKotlin` | **MIT** | Recreate Compose shopping UX; wire DIAL gateway. Do not vendor CoolMall API/backend. |
| `tunacosgun/eCommerce` | Confirm at clone (Pack §9) | Recreate SwiftUI shopping; DIAL APIs. |
| `android/nowinandroid` | Apache-2.0 | Architecture donor for technician app — already the module shape. |
| `furqanullah717/foodhub-compose` | Apache-2.0 | Rider **pattern only**; job engine stays `@dial/delivery`. |
| Saleor Paper (FSL), Enatega proprietary | Explicitly **not** locked donors | Visual reference only if ever used. |
| AGPL (Fleetbase, etc.) | Pattern-only; never wholesale | Do not copy trees into the monorepo. |

**Pack CSS/theme subset:** shadcn/ui for Tech is the copied FixItNow set under `components/ui` + tokens in `app/tech/tech.css` (scoped `.fin-tech`). Spare/Grocery must not inherit FixItNow orange as a shared `AppShell`.

---

## 6. FixItNow inventory (facts from `.tmp/FixItNow`)

**Stack:** Next.js App Router, Tailwind v4, shadcn, orange primary `#ff7308`.  
**Public chrome:** `Navbar` (Home, Services, Find Technicians, How It Works, Contact) + `Footer`.  
**Landing sections (`(public)/page.tsx`):** HeroCarousel, PopularIndustries (lucide tiles), HowItWorks, FeaturedServices, TopRatedTechnicians, WhyChoose, BookingProcessTimeline, CustomerReviews, PlatformStatistics, BecomeTechnician, FAQ, FinalCTA.

### 6.1 Customer-facing screen matrix (Tech web)

Status key: **missing** = no DIAL route with that job; **tracer** = route exists but not donor-parity (shared DIAL look, stubs, or incomplete IA); **parity** = donor look + workflow + DIAL API evidence.

| FixItNow route | Role | DIAL route | Status | Workflow SoR |
| --- | --- | --- | --- | --- |
| `/` landing | Public home | `/tech` | **copied UI** | FixItNow HeroCarousel + sections; copy Dial a Tech. Book/browse CTAs → `/tech/services`. |
| `/services` | Service catalogue | `/tech/services` | **copied UI** | List/filter from DIAL rate_card catalogue (`fixitnowCatalogue`); not FixItNow API. |
| `/services/[id]` | Service PDP + book CTA | `/tech/services/[id]` | **copied UI** | BookingModal → `POST /api/tech/services` (session). USD draft from rate_card. |
| `/find-technicians` | Directory | `/tech/find-technicians` | **copied UI** | DIAL technician profile cards (Pack §9.3). |
| `/find-technicians/[id]` | Tech profile | `/tech/find-technicians/[id]` | **copied UI** | Profile page; book CTA → `/tech/services`. |
| `/how-it-works` | Marketing | `/tech/how-it-works` | **copied UI** | Donor how-it-works. `/tech/guide` remains DIAL diagnose extra. |
| `/contact` | Contact | `/tech/contact` | **copied UI** | Layout copied; no donor backend. |
| `/about` | About | `/tech/about` | **copied UI** | Copy Dial a Tech. |
| `/help` | Help | `/tech/help` | **copied UI** | Distinct from `/dashboard/help-support`. |
| `/terms` `/privacy-policy` `/cookies` | Legal | `/tech/terms` `/tech/privacy-policy` `/tech/cookies` | **copied UI** | Donor layout + Dial a Tech copy; counsel may replace later. |
| `/payment` | Donor pay | **do not port** | **n/a** | Stripe/SSLCommerz **out**. Pay on job/order via DIAL. |
| `/login` `/register` `/forgot-password` `/reset-password` | Donor auth | `/` + DIAL session | **n/a (door)** | Do not copy Google OAuth / donor JWT. After auth, `/home` chooser. Optional later: Tech-styled return-to `/tech`. |
| `/dashboard` | Customer home | `/tech/dashboard` | **missing** | Recreate FixItNow customer sidebar chrome **inside Tech**, not DIAL `AppShell`. |
| `/dashboard/my-bookings` | Booking list | `/tech/jobs` | **tracer** | List exists; not FixItNow table/IA. Jobs = `@dial/jobs`. |
| `/dashboard/my-bookings/[id]` | Booking detail | `/tech/jobs/[jobId]` | **tracer** | Evidence/status; Job Reserve not Cal.com as SoR. |
| `/dashboard/my-bookings/[id]/payment` | Pay | `/tech/jobs/[jobId]/pay` | **missing** | EcoCash + COD + Paynow buttons; `amountMinor`; webhook-as-truth. |
| `/dashboard/my-bookings/[id]/leave-review` | Review | `/tech/jobs/[jobId]/review` | **missing** | Reviews bound to completed DIAL jobs. |
| `/dashboard/booking-success` | Success | `/tech/jobs/booked` | **missing** | |
| `/dashboard/my-payments` | Payments | `/tech/payments` | **missing** | DIAL ledger/PSP refs — not Stripe dashboard. |
| `/dashboard/reviews` | Reviews list | `/tech/reviews` | **missing** | |
| `/dashboard/profile` | Profile | `/tech/profile` or `/account/profile` | **tracer** | Prefer Tech-styled profile when entered from Tech; Account remains a door, not a third storefront brand. |
| `/dashboard/settings` | Settings | `/tech/settings` | **missing** | |
| `/dashboard/help-support` | Support | `/tech/help` | **missing** | |

**Pack §9.3 named screens vs donor:** Guide landing, Emergency, Diagnose/checklist, Known-need/book, Job status, Technician profile cards. Emergency + checklist are **DIAL extras** — keep them, skin them FixItNow, do not drop them because FixItNow lacks them.

**Current DIAL Tech that Pack named:**

| Pack §9.3 | DIAL today | Honest gap |
| --- | --- | --- |
| Guide landing | `/tech` + `/tech/guide` | Landing is a partial recreation, still not FixItNow-complete. |
| Emergency | `/tech/emergency` | Exists; needs same identity, deterministic checklist `emergency.triage`. |
| Diagnose / checklist | `/tech/checklist/[id]` | Exists; skin + real library (42 seeds already). |
| Known need / book | `/tech/book` | **Tracer:** posts `POST /api/tech/services` (real DIAL book) but UI is a slot list + form, not FixItNow service→tech→slot→pay. Slots from Cal.com **fixture** when unset. |
| Job status / evidence | `/tech/jobs`, `/tech/jobs/[jobId]` | Tracer. |
| Technician profile cards | on `/tech/book` | Partial. |

### 6.2 FixItNow technician + admin (do not copy as DIAL admin)

| FixItNow | DIAL destination | Notes |
| --- | --- | --- |
| `/technician-dashboard` and nested services/slots/availability/bookings/earnings/profile | `apps/technician-android` first (Pack §9.7); optional later `/tech/technician/*` | Recreate **workflows** (services, slots, bookings, earnings). Earnings = Take-Home + WHT (D-50). Slots may sync via Cal.com adapter. |
| `/admin-dashboard` users/bookings/services/analytics/settings | **`apps/.../admin/*` unchanged** | Queue-first A–P. FixItNow admin is a marketplace moderator UI — **not** DIAL ERP IA. |

### 6.3 What not to copy from FixItNow

- Stripe, SSLCommerz, `StripeButton`, `checkoutPayment` / `createPayment` as SoR.
- Donor `loginUser` / Google OAuth / HttpOnly JWT proxy as DIAL auth.
- Donor Postgres / server repo `FixItNow-Server-Side`.
- Demo role passwords from FixItNow README (do not reuse in DIAL).
- Cal.com (or donor slot table) as **job/money** SoR.
- Wholesale donor git history, `node_modules`, or `FixItNow-Server-Side`. Customer **UI** copy is founder-authorised; backend is not.

---

## 7. Spare web — Mercur B2C

**Donor:** `mercurjs/b2c-marketplace-storefront` (+ YNS or Nimara polish). Live look: [b2c.mercurjs.com](https://b2c.mercurjs.com).  
**Pack §9.2 screens:** Home/collections, Search+facets, Select Vehicle/EPC, PDP, Cart/checkout, Orders/tracking/returns, Garage.

| Pack / Mercur-like screen | DIAL route | Status | Honest gap |
| --- | --- | --- | --- |
| Home / collections | `/spare` | **tracer** | Browse is **API-wired** (Meili/search, USD, B2B filter) but wrapped in **shared `AppShell`** — wrong identity. Not Mercur layout (hero, collection grid, seller cards). |
| Search + facets | `/spare?q=` | **tracer** | OEM search exists; Mercur facet chrome missing. |
| Select Vehicle / EPC | `/spare/entry` | **tracer** | DIAL-token page, not Mercur. |
| PDP | `/spare/[offerId]` | **tracer** | USD + agency disclosure + add-to-cart **wired**; look is DIAL tokens, not Mercur PDP. |
| Cart | `/spare/cart` | **tracer** | USD lines; no Mercur multi-vendor cart UX. |
| Checkout | `/spare/checkout` (+ `/done`) | **tracer** | EcoCash\|COD path exists in eng; not Mercur checkout chrome; ZiG only at pay (D-57). |
| Orders / tracking | `/spare/orders`, `/spare/orders/[orderId]` | **tracer** | IDOR locked recently; look is not Mercur. |
| Returns | `/spare/returns` | **tracer** | |
| Garage / Vehicle Hub | `/spare/garage` | **tracer** | Consent required (Pack §9.2). |
| Seller / vendor storefront | `/spare/seller/[id]` | **missing** | Agency disclosure on PDP is not a seller shop. |

**P0 for Spare:** drop `AppShell` on `/spare`; add `app/spare/spare.css` + Mercur-like header (logo, search, cart, collections). Then expand PDP→cart→checkout to visual parity. Do **not** mark Spare “done” because browse lists offers.

**Do not copy:** Medusa/Mercur checkout, Stripe, Mercur auth, Medusa as order SoR.

---

## 8. Grocery web

Pack §9 has no grocery donor table; founder lock = Mercur B2C / marketplace patterns; food/pantry only (no liquor).

| Screen | DIAL route | Status |
| --- | --- | --- |
| Browse | `/grocery` | **tracer** — DIAL brand gradient hero; USD + B2B filter wired; **not** a marketplace storefront. |
| Search + facets | `/grocery/search` | **tracer** — client fetch; DIAL tokens. |
| Collections | `/grocery/collections` | **tracer** / stub-like. |
| Slot | `/grocery/slot` | **tracer** |
| Cart / checkout / track | `/grocery/cart`, `/checkout`, `/track` | **tracer** — food spine exists in G10 prep; look is shared DIAL. |

Build after Spare Mercur chrome so grocery can **reuse marketplace IA** (search, collections, cart) with food tokens — a **distinct** grocery identity, not Tech orange and not Spare parts chrome.

---

## 9. Supplier web — Mercur vendor-panel

**Pack §9.4:** Onboarding, catalog/costs upload, heartbeat inbox, orders to confirm, co-op, statements/bonds.

| Pack screen | DIAL today | Status |
| --- | --- | --- |
| All of the above | **one** `/supplier` page, DIAL tokens, inline sections | **tracer** — APIs (`@dial/suppliers`) are partly wired; **IA is not vendor-panel** (no separate routes, no Mercur chrome). |

Split into vendor-panel-like routes under `/supplier/*` (onboarding, catalog, heartbeat, confirm-SLA, statements, co-op). Do not use customer `AppShell`.

---

## 10. Gateway door, Account, Delivery web, Admin

| Surface | Donor | DIAL today | Plan |
| --- | --- | --- | --- |
| `/` sign-in | none (DIAL door) | DIAL gradient + tokens | Keep **neutral**. Not a storefront. |
| `/home` Shop \| Services | Pack §9.1 | DIAL branded welcome | Keep **neutral chooser**; destinations are branded. Remove any implication that Home is a DIAL shop. |
| `/account/*` (profile, addresses, notifications, consent, promo) | none | five pages, likely DIAL tokens | **Not** a sixth storefront. Chrome follows **entry branch** (Spare Mercur vs Tech FixItNow) or a minimal door. Promo credit: D-42, no cash-out. |
| `/delivery/track`, `/delivery/courier` | MapLibre + foodhub rider (native) | exists | Customer track = read-only MapLibre (D-45). Do not Google-skin. Courier **app** is native. |
| `/admin/*` | in-repo IA | queue-first A–P | **Unchanged identity.** Not in this donor-parity storefront programme. |

---

## 11. Native apps (later phases, same identity rule)

| App | README donor | Thin vertical today | Parity meaning |
| --- | --- | --- | --- |
| `apps/customer-android` | CoolMallKotlin (MIT) — catalog/cart/orders | Sign-in → Spare USD browse → EcoCash\|COD → orders/garage; grocery path | Compose UI **reads as CoolMall shopping**, not a DIAL token dump. Same DIAL APIs as web. No Expo. |
| `apps/customer-ios` | tunacosgun/eCommerce (+ Pow polish) | SPM client + SwiftUI shell | SwiftUI **reads as that shopping app**. Same APIs. |
| `apps/technician-android` | Now in Android architecture + compose-samples motion | Sign-in, job cache, checklist, evidence, Take-Home WHT | **Workflows** match FixItNow technician (services, slots, bookings, earnings) on NiA architecture. |
| `apps/delivery-android` | foodhub-compose rider (Apache-2.0) | Offer accept/reject, transit, POD, COD | Rider flavour + MapLibre. Not Fleetbase. |

Customer natives **mirror Spare + Tech critical paths** (Pack §9.6). Tech-on-Android is not a second FixItNow webview; it is native screens that **feel like** the Tech product (orange services booking) while Spare-on-Android feels like CoolMall commerce.

**G3** (internal TestFlight/Play) stays a Completion Plan gate with signing certs — this roadmap does not exit it.

---

## 12. Build order (D-52 — thin vertical first, then expand in-ticket)

Do **not** restyle every page in one PR. Each phase has a tracer slice, then in-ticket expand to the screen matrix. Ticket incomplete until that branch’s DoD (§13).

### P0 — Split chrome (first Build step after this plan)

1. **Spare:** stop wrapping browse (and any sibling) in shared `AppShell`. Branch layout + `spare.css` (Mercur-like header). One-line note: revert/retire customer `AppShell` as shared storefront chrome; keep file only if a single branch still needs a local shell, or delete once unused.
2. **Tech:** keep `/tech` off `AppShell` (already). Deepen identity in P1 — do not roll Tech back into DIAL tokens.
3. **`/home`:** chooser only; links to `/spare` and `/tech`.
4. **gitignore:** ignore `.tmp/FixItNow` (and future `.tmp` donor clones) so the donor tree is never committed.
5. **ENH-609** meaning: per-branch donor rebuilds — **not** a shared branding programme.

No claim of visual parity at P0.

### P1 — Tech thin vertical (priority)

**Public copy checkpoint (landed):** FixItNow-looking **landing + services + PDP + technician directory**; PDP `BookingModal` posts **real** `POST /api/tech/services` (rate_card quote; AI never sets payable). Honest: still **not** P1/P2 Done — customer dashboard, job pay, reviews not ported; Diagnose/Emergency not in Navbar.

**Remaining Tech Build (see feature audit, not this paragraph as SoR):** Navbar Diagnose + Emergency; BookingModal → rate_card draft → EcoCash\|COD Job Reserve; skin `/tech/guide` + `guidedIntake` (no prices); job evidence; drop Google Maps on contact. Do not treat `/tech/book` tracer as the donor book path.

**Evidence:** Playwright screenshots vs FixItNow live (`fixitnow-v1.vercel.app` / `fixitnow-client.vercel.app`); API test job id in DIAL; money-path review on pay step when added.

### P2 — Tech expand (customer dashboard + extras)

My jobs, job detail, booking success, pay (EcoCash\|COD), review, customer dashboard chrome, find-technicians, profile. Emergency + diagnose **kept**, same identity.

Technician **web** dashboard is optional; **technician-android** is the ops SoR for field work.

### P3 — Spare Mercur identity

Restyle API-wired browse/PDP/cart/checkout/orders/garage/returns to Mercur IA. Add seller page. USD browse / ZiG pay / agency / B2B filter stay.

### P4 — Supplier vendor-panel

Split `/supplier` into Pack §9.4 routes; Mercur vendor-panel look; existing `@dial/suppliers` SoR.

### P5 — Grocery marketplace identity

Mercur-like food storefront on existing grocery APIs; liquor remains out.

### P6 — Account + delivery-track chrome

Account follows entry branch or minimal door. Customer delivery track: MapLibre, donor-quality layout without Google.

### P7 — Natives (after web identity is the reference)

CoolMall / eCommerce / NiA+FixItNow workflows / foodhub rider. Screenshot matrix web ∥ Android ∥ iOS is G3 evidence — **when signing exists**, not as a claim from this plan.

### P8 — WhatsApp (parallel, not a visual donor)

FLOW_SPARE / FLOW_SPARE_CHECKOUT / grocery/tech flows per spec; EcoCash+COD buttons; fiscal outbox `channel=wa`. No FixItNow UI.

---

## 13. Definition of Done (per branch)

A branch is **not** done when a tracer page exists. All of the following:

### Visual

- Side-by-side screenshots: donor (or donor demo) vs DIAL, desktop + mobile (Blueprint §8.0.1).
- Uninvolved reviewer can name the donor (“this is FixItNow / Mercur / CoolMall”) without being told.
- No shared `AppShell` tabs across Spare/Tech/Grocery.
- No helper text on UI (living-docs rule).

### Feature / workflow

- Screen matrix for that branch is **parity** or explicitly **DIAL-extra** (emergency, WHT Take-Home, ZiG pay step).
- Zero **missing** rows on the customer-critical path (browse/book/pay/status).
- Workflow maps to DIAL SoR (table in each section above).

### API evidence (anti-stub)

- Critical actions hit DIAL routes (`/api/tech/services`, `/api/search/spare`, `/api/spare/checkout`, supplier confirm, etc.).
- Session from cookie/JWT only — no body `userId`/`role`.
- Money: `amountMinor` + currency; Job Reserve / ledger / outbox as applicable; `dial-money-path-review` before merge of pay UI.
- Fixture/sandbox acceptable until credentials-after-testing; **do not** mark live G2/G8/G9 green on this UX work.

### Licence

- No donor `src/` vendored for FixItNow.
- MIT attribution only where a CSS/theme subset is actually copied (prefer none).

---

## 14. Honest completion-plan posture

| Claim | Allowed? |
| --- | --- |
| This document is the ENH-609 planning SoR | Yes |
| Tech or Spare is at donor parity | **No** — Tech is a tracer layout; Spare browse is API-true and visually wrong |
| G3 internal store builds | **No** — signing/certs still `blocked_on_human` |
| G12 dogfood / customer-open | **No** — Appendix C / §8.1 human |
| Vercel preview (ENH-610) is production UX | **No** — fixture mode, no live keys |
| Shared `AppShell` foundation was the right ENH-609 approach | **No** — superseded by this document |

---

## 15. First Tech/Spare split (implementation note for the next Build agent)

When Build starts P0 (not this task):

- Remove `AppShell` from `apps/gateway-web/src/app/spare/page.tsx` (and any new wrappers).
- Do **not** put Tech back into `AppShell`.
- Retire `AppShell` as **cross-branch** chrome (`ShellSection` mixing home/spare/grocery/tech/account). If a local header is needed, it lives under `components/spare/*` or `components/tech/*`.
- Root `layout.tsx` may keep fonts for the **door** (`/`, `/home`); branch layouts override with donor fonts/tokens.

---

## 16. Pointers

- Completion spine: `docs/planning/DIAL_Full_ERP_Completion_Plan.md`
- Workplan STATE: `docs/planning/DIAL_Build_Workplan_STATE.md` (ENH-609 = planning)
- Enhancements: `ENHANCEMENTS.md` ENH-609
- FixItNow reference clone: `C:\DIAL\.tmp\FixItNow` (do not commit)
- Canvas: founder visual beside chat (`donor-parity-roadmap.canvas.tsx`)
- Tech FixItNow feature/workflow audit: [`DIAL_Tech_FixItNow_Feature_Audit.md`](./DIAL_Tech_FixItNow_Feature_Audit.md) (ENH-609 overlay; AI capability review `docs/agent-audits/ai-capability-tech-fixitnow-ux-2026-08-16.md`; canvas `tech-fixitnow-feature-audit.canvas.tsx`)

---

## 17. Open human decisions (non-blocking)

None of these block P0/P1. Recommended answers are already chosen:

1. **`/` chooser vs immediately two branded sites** — **Chooser** (`/` auth, `/home` Shop\|Services, branded destinations). Dual hostnames (`dialaspare.co.zw` / `dialatech.co.zw`) can map to `/spare` and `/tech` later without changing identity.
2. **FixItNow LICENSE** — treat as **unlicensed for copy**. Recreate. If the author later adds MIT, still do not vendor the tree; optional CSS subset only with attribution.
3. **Grocery-specific food donor** — **do not wait**. Mercur B2C IA + food collections. A named food UI donor would be a new D-log, not a pause.
