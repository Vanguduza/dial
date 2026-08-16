# Dial a Tech × FixItNow — feature audit and workflow plan

**Date:** 2026-08-16 (specialist routing Build 2026-08-17; nav + booking overlay 2026-08-17)  
**Status:** public `/tech` copy landed; OEM specialist routing landed; **nav + booking overlay (audit §4–5) landed**.  
**Does not claim** donor parity, G3, G6, or G12.

**Authority:** v4 Tech product + D-32 / D-38 / D-50 / D-57 / D-58; Pack §9.3 / §10; `.cursor/rules/dial-donor-identity.mdc`; `docs/planning/DIAL_Donor_Parity_Roadmap.md` (ENH-609 SoR).  
**AI review first:** [`docs/agent-audits/ai-capability-tech-fixitnow-ux-2026-08-16.md`](../agent-audits/ai-capability-tech-fixitnow-ux-2026-08-16.md) (`dial-ai-capability-review`).  
**Grill (D-56):** §7 — answered from repo; no founder questions.  
**Canvas:** `tech-fixitnow-feature-audit.canvas.tsx` (open beside chat).

**Honest:** FixItNow **customer and technician dashboards are not ported**. Public orange site under `/tech` is copied. Diagnose, Emergency, and signed-in My jobs are first-class in the copied Navbar. Job pay is EcoCash|COD on the job page (fail-closed without Daily ZiG rate). Reviews and customer dashboard chrome remain open.

---

## 0. AI capability review (report first)

**Verdict:** current `packages/ai` is **safe to host under FixItNow chrome** if the UI follows the locks below. Do not expand schemas or call LiteLLM from the orange site in this plan.

| Check | Result |
| --- | --- |
| AI never writes payable amounts | **Pass** — `JobAssessmentSchema` has no price fields; ops draft `ledgerWrite: false`; Gateway rejects `amountMinor` on `/api/ai/ops-draft-quote` |
| Zod structured output | **Pass** (thin) — `summary`, `likelyJobClass`, `urgency`, `needsHumanQuote: true` |
| D-32 identity omit | **Pass** on named fields — `toModelEgress` strips userId/phone; session SoR on Gateway |
| Emergency never AI-gated | **Pass** — `POST /api/tech/services` `emergency_book` does not await Gemini |
| No generic chat | **Pass** — only `guidedIntake` / `clientAssessment` / `opsDraftQuote` |
| Promptfoo no-money | **Pass** (fixture) — `packages/ai/evals/promptfooconfig.yaml` |
| Langfuse / live LiteLLM on intake | **Not wired** — `guidedIntake` is a keyword stub; Medium follow-up |
| Presidio on free-text | **Not wired** — required before live Gemini (Medium) |

**Where money actually comes from:** `@dial/jobs` `quoteFromRateCard` / `draftTechQuote` (`source: "rate_card"`, USD `draftAmountUsdMinor`). That is the **pricing engine**, not the model. `opsDraftQuoteFromAssessment` is an **ops narrative draft** (summary + human approval flags) — it must stay behind `INTERNAL_API_SECRET` and **must not** appear on the customer PDP.

**What the AI must never do (founder lock):**

1. Write or display a payable price, fee, refund, or Job Reserve amount.  
2. Write the ledger or instruct a PSP.  
3. Compute technician Take-Home / 30% WHT.  
4. Block emergency dispatch while “thinking.”  
5. Put name, phone, address, or ID on the model payload.  
6. Auto-publish checklists or diagnoses without a human (D-54).  
7. Run a generic chat box on `/tech`.

Full severity table: the agent-audit file above.

---

## 1. Inventory A — FixItNow (donor)

**Source:** `C:\DIAL\.tmp\FixItNow` (do not commit). Stack: Next.js App Router, Tailwind, shadcn, orange `#ff7308`.  
**Public chrome:** Navbar = Home, Services, Find Technicians, How It Works, Contact. Footer = about / services / technicians / how-it-works / help / contact / legal.

### 1.1 Public (customer-facing)

| Route | What it does |
| --- | --- |
| `/` | Landing: HeroCarousel, industries, how-it-works, featured services, top technicians, why-choose, booking timeline, reviews, stats, become-technician, FAQ, CTA |
| `/services` | Catalogue: search, filters, pagination, service cards |
| `/services/[id]` | Service PDP + **BookingModal** (pick slot + note → donor `serviceBooking` server action → donor API) |
| `/find-technicians` | Technician directory |
| `/find-technicians/[id]` | Technician profile + book CTA |
| `/how-it-works` | Marketing: find → book → tech accepts → done |
| `/contact` | Form + **Google Maps iframe** |
| `/about` `/help` `/terms` `/privacy-policy` `/cookies` | Marketing / legal |
| `/payment?success=` | Stripe/SSL return splash → My Bookings |

**Donor booking workflow (five steps, copied into DIAL `HowItWorks` / `bookingProcessData`):** Search service → Choose technician → Pick time slot → **Book & Pay (card)** → Job completed / review.

### 1.2 Auth (donor)

`/login` `/register` `/forgot-password` `/reset-password` — donor JWT + Google OAuth pattern. **Not DIAL SoR.**

### 1.3 Customer dashboard (sidebar `navigation.customer`)

| Route | Workflow |
| --- | --- |
| `/dashboard` | Stats: bookings, pending, active, completed, payments, reviews |
| `/dashboard/my-bookings` | Booking table |
| `/dashboard/my-bookings/[id]` | Booking detail |
| `/dashboard/my-bookings/[id]/payment` | **StripeButton + SSLCommerzButton** |
| `/dashboard/my-bookings/[id]/leave-review` | Rating + comment bound to booking |
| `/dashboard/booking-success` | Post-book splash |
| `/dashboard/my-payments` | Payment history (donor PSP) |
| `/dashboard/reviews` | Review list |
| `/dashboard/profile` `/dashboard/settings` `/dashboard/help-support` | Account chrome |

**Not ported to DIAL.**

### 1.4 Technician dashboard (`navigation.technician`)

| Route | Workflow |
| --- | --- |
| `/technician-dashboard` | Tech home |
| `/technician-dashboard/services` | CRUD services the tech offers |
| `/technician-dashboard/availability` | Slot calendar the tech owns |
| `/technician-dashboard/bookings` | Incoming jobs |
| `/technician-dashboard/earnings` | Gross earnings (no Zimbabwe WHT) |
| `/technician-dashboard/profile` | Profile |

**Not ported.** Field ops SoR for DIAL is `apps/technician-android` (Pack §9.7), not a FixItNow admin skin.

### 1.5 Admin dashboard (`navigation.admin`)

`/admin-dashboard` + users / bookings / services / analytics / settings — marketplace moderator UI.

**Do not copy** onto DIAL `admin-web` (Pack §9.5 queue-first A–P).

### 1.6 Donor money / maps / AI (facts)

- Pay = Stripe + SSLCommerz. No EcoCash, no COD, no Job Reserve, no ZiG.  
- Maps on contact = Google embed.  
- **No** guided troubleshooting, **no** diagnostic checklists, **no** emergency dispatch path, **no** quotations vs rate cards, **no** evidence/photo job file, **no** WHT Take-Home.  
- Booking SoR = donor REST `POST /api/bookings/create` (not Cal.com in this tree; DIAL still must not treat Cal.com as job/money SoR).

---

## 2. Inventory B — Dial a Tech (product + what `/tech` has)

### 2.1 Product requirements (v4 + Pack §9.3)

Pack named screens: **Guide landing**, **Emergency**, **Diagnose / checklist runner**, **Known need / book** (Cal.com **slots** sibling), **Job status / evidence**, **Technician profile cards**.

v4 §6.16.2 money/AI spine:

```text
Guide (calm, not AI-hype)
  → intake + media
  → guidedIntake / clientAssessment (omit identity; Zod; no money)
  → match / assign (preferred-tech rematch)
  → call-out → Job Reserve held
  → Cal.com slot only for non-emergency when configured
  → on-site evidence → ScopeConfirmed
  → Quote from rate versions (never AI money)
  → customer VariationApproved if needed
  → JobCompleted + EvidenceSealed → payouts (WHT on tech)
Emergency shortcut: location + problem → dispatch; AI must not gate.
```

Overlays: agency (D-58), USD browse + ZiG at pay (D-57), EcoCash + COD buttons, 30% WHT Take-Home (D-50), MapLibre (D-44), official WA only.

### 2.2 What `/tech` already has (2026-08-16)

**Copied FixItNow public (wired to DIAL catalogue / book):**

| DIAL route | Notes |
| --- | --- |
| `/tech` | Donor landing; CTAs → `/tech/services` |
| `/tech/services` | List/filter from `fixitnowCatalogue` (USD display **derived** from `amountUsdMinor` / rate_card) |
| `/tech/services/[id]` | PDP + `BookingModal` → `POST /api/tech/services` (`book` / `emergency_book`); session cookie; **no** Stripe |
| `/tech/find-technicians` `[id]` | Directory / profile from `fixitnowTechnicians` |
| `/tech/how-it-works` `/about` `/help` `/contact` `/terms` `/privacy-policy` `/cookies` | Donor marketing; **contact still embeds Google Maps** |

**Navbar today:** Home, Services, Find Technicians, How It Works, Contact. Logged-in avatar dumps Dashboard/Profile/Settings onto `/tech/jobs`. Login/Sign up → `/?next=/tech` (DIAL door).

**DIAL extras (Pack §9.3) — exist, not in Navbar:**

| Route | Wiring | Honest gap |
| --- | --- | --- |
| `/tech/guide` | Keyword `resolve_checklist_by_symptom` — **not** `POST /api/ai/guided-intake` | Tracer chrome; not FixItNow-skinned to parity; no model assessment UI |
| `/tech/emergency` | `emergency_book`; rate_card draft; link to emergency checklist | Tracer; not in Navbar; AI pricing bypassed (correct) |
| `/tech/book` | Slot list + `TechBookForm` + profile cards | Tracer leftover vs donor PDP modal |
| `/tech/checklist/[id]` | Step runner (local next-click) | Not posting answers/evidence to technician API |
| `/tech/jobs` `[jobId]` | Session job list/detail; intake → `book_intake`; evidence timeline read | Not FixItNow dashboard table; **no pay step** |

**APIs (SoR):**

| API | Role |
| --- | --- |
| `POST /api/tech/services` | book / emergency_book / intake / book_intake; `payableFromAi: false` |
| `GET /api/tech/services?view=` | slots, jobs, job, checklists, profiles |
| `POST /api/ai/guided-intake` | Session; JobAssessment only |
| `POST /api/ai/ops-draft-quote` | **Internal secret**; never customer |
| `/api/tech/technician` | Checklists, evidence, **Take-Home / ITF263** (tech Android + admin) |

**Not built on web:** customer dashboard chrome, job pay (EcoCash\|COD\|Paynow), reviews, booking-success, technician web earnings, MapLibre on Tech, guidedIntake on the orange guide.

---

## 3. Matrix — donor feature → DIAL → keep / replace / add / drop

Legend: **keep** = donor UX + DIAL API; **replace** = same screen job, different SoR/copy; **add** = DIAL-only; **drop** = do not port.

| Donor feature | DIAL equivalent | Action | Why |
| --- | --- | --- | --- |
| Landing `/` | `/tech` | **Keep** | Locked identity (D-38). Copy Dial a Tech. Add Diagnose + Emergency CTAs in hero/timeline (tweak, not reskin). |
| Services catalogue | `/tech/services` + rate_card catalogue | **Keep** | USD **browse** from `amountMinor`; no ZiG on cards (D-57). Agency: DIAL is agent; tech is contractor — no DIAL-owned SKU. |
| Service PDP + BookingModal | `/tech/services/[id]` | **Keep UX / replace checkout** | Slot picker stays. After slot: rate_card **draft** (label draft) → confirm → Job Reserve. Note field may feed **guidedIntake** (no price). No Stripe. |
| Find technicians + profile | `/tech/find-technicians` | **Keep** | Manager’s-choice / Value Score from `@dial/jobs`, not donor ratings SoR. Book CTA → DIAL book. |
| How it works (5 card steps) | `/tech/how-it-works` | **Replace copy** | Insert Diagnose; replace “secure online payment” with EcoCash + COD + Job Reserve. Keep orange layout. |
| Booking timeline on home | `BookingProcessTimeline` | **Replace copy** | Same five-slot visual; DIAL steps (see §4). |
| Contact form | `/tech/contact` | **Keep form / replace map** | Drop Google iframe (D-44). MapLibre or static Harare address. |
| About / help / legal | `/tech/about` etc. | **Keep** | Dial a Tech copy; counsel may replace legal later. |
| `/payment` Stripe splash | Job pay + `/tech/jobs/[id]` | **Drop donor page** | Pay on the job, not a Stripe return URL. |
| Login / register / Google / donor JWT | `/` DIAL session | **Drop as SoR** | Optional later: orange return-to `/tech` after auth. |
| Customer dashboard | `/tech/dashboard` (to build) | **Add** (recreate chrome) | FixItNow sidebar **inside Tech**. Stats from `@dial/jobs`, not donor API. **Not ported today.** |
| My bookings | `/tech/jobs` | **Replace IA** | Keep donor table look when dashboard lands; SoR = DIAL jobs. Tracer list exists. |
| Booking detail | `/tech/jobs/[jobId]` | **Replace + add** | Status + **evidence photos** + checklist link + variation approve. MapLibre if location. |
| Booking pay (Stripe/SSL) | `/tech/jobs/[jobId]/pay` | **Replace** | EcoCash + COD (+ Paynow) **buttons**; USD shown; **ZiG only on pay**; `amountMinor`; webhook-as-truth; IMTT not a line (D-60). **Missing.** |
| Leave review | `/tech/jobs/[jobId]/review` | **Keep UX later** | Bound to completed DIAL job. **Missing.** |
| My payments | Ledger/PSP refs on job | **Replace** | No Stripe dashboard. |
| Technician services/slots/bookings | technician-android first; optional `/tech/technician/*` | **Replace workflows** | Cal.com = **slot adapter sibling** only. Job SoR = `@dial/jobs`. |
| Technician **earnings** | Take-Home + ITF263 (D-50) | **Replace** | Gross → DIAL fee → 30% WHT or ITF263 0% → net `amountMinor`. Never AI. Android + `/api/tech/technician` already; **no FixItNow earnings page.** |
| Admin dashboard | DIAL admin A–P | **Drop** | Not a FixItNow skin. |
| Donor booking API / Mongo | `POST /api/tech/services` | **Drop** | Already replaced on PDP modal. |
| Google Maps | MapLibre + Nominatim | **Drop Google as SoR** | Contact embed is the live violation to fix in Build. |
| AI chat / AI prices | — | **Drop** (donor has none; do not invent) | Capabilities only; no generic chat. |
| Guided diagnose | `/tech/guide` + checklists | **Add** | FixItNow has no equivalent. First-class nav. |
| Emergency dispatch | `/tech/emergency` | **Add** | Deterministic; never wait on AI. |
| Checklist runner | `/tech/checklist/[id]` | **Add** | Library SoR `@dial/jobs`; AI may **draft** ops text only via Factory+human. |
| Rate-card quotation / Job Reserve | `draftTechQuote` + payments hold | **Add** | Visible as **draft USD** until human/engine confirm. |
| Evidence / photo | job detail + tech Android camera | **Add** | Gallery not SoR; camera + overlay (Pack §9.7). |
| Cal.com as booking SoR | Cal.com **slots only** | **Drop as SoR** | Recreate slot-picker UI; do not vendor Cal.com as job engine. |

---

## 4. Workflow tweaks (the point)

FixItNow is “pick a listed service → pick a person → pick a slot → pay by card.”  
Dial a Tech is “understand the problem (or skip to known-need / emergency) → book a **rate-card draft** → hold Job Reserve on EcoCash\|COD → technician works a **checklist + evidence** → human-confirmed quote / variation → take-home after 30% WHT.”

Keep the orange screens. Change the **funnel**, not the brand.

### 4.1 Public funnel (home → pay)

```text
FixItNow:  Search → Technician → Slot → Card pay → Done
DIAL:      [Diagnose?] ─┬─ Known need → Services PDP → Technician → Slot
                        │                              → rate_card DRAFT (USD)
                        │                              → human confirm
                        │                              → EcoCash | COD (ZiG at pay)
                        ├─ Emergency → dispatch (no AI gate) → call-out reserve
                        └─ Guide → guidedIntake (no price) → checklist
                                   → then book as known-need or emergency
Then: job status + photos + checklist → complete → review
```

**Concrete UI seats:**

1. **Diagnose lives at `/tech/guide`**, first-class in Navbar (“Diagnose”). Calm copy, not “AI will price this.” Symptom box → `POST /api/ai/guided-intake` **and** keyword checklist resolve. Show assessment **summary / urgency / likely job class** only. CTA: Open checklist / Book diagnostic / Emergency. **No dollar from the model.**

2. **Emergency lives at `/tech/emergency`**, first-class in Navbar (and Hero + Emergency category card). One-tap `emergency_book`. Show rate_card **call-out draft** with “draft — confirmed on site.” Never spinner-wait on Gemini.

3. **Known-need book stays on the FixItNow PDP modal** (`/tech/services/[id]`). After slot + note:  
   - If note present: run guidedIntake in the background for routing only.  
   - Always show **rate_card USD draft** (`draftAmountUsdMinor`) labelled draft.  
   - Confirm → create DIAL job → **pay step** (not Stripe).  
   `/tech/book` becomes a shortcut into this path (or redirects to `/tech/services`) so we do not keep two ugly book UIs.

4. **Pay is a job screen**, not donor `/payment`. Buttons: **EcoCash**, **COD** (Paynow if that rail is on). Browse/PDP stay USD. ZiG figure only here, from ops daily rate. Job Reserve hold after PSP/COD truth. IMTT not a customer line.

5. **Quotations:** customer never sees `opsDraftQuote`. Ops/admin (or later a “quote pending” job state) uses pricing engine + human. If the job needs a variation after evidence, customer sees **human-approved** `amountMinor` on the job — same orange job detail, new panel, not an AI price tag on the PDP.

6. **Checklists + evidence:** after book (and on emergency), job detail links `/tech/checklist/[id]`. Technician Android remains the camera SoR; customer web **views** sealed evidence. Checklist answers POST to existing technician API — today’s runner is local-only (gap).

7. **Technician Take-Home:** if/when a web tech dashboard is copied, **Earnings** becomes Take-Home: gross → fee → ITF263 or 30% WHT → net. APIs already exist. Do not show a FixItNow “you earned $X” card that hides WHT.

8. **Maps:** any “where is my tech / where am I” = MapLibre. Contact page must lose Google.

### 4.2 Agency, USD/ZiG, rails (on those same screens)

- PDP/cards: “Dial a Tech arranges a verified technician” — agent, not DIAL-employed principal (v4 2B-14 / D-58).  
- Prices on browse = USD from rate_card minor units (donor `price` float is display-only; SoR stays integer).  
- No Stripe, no SSLCommerz, no donor JWT.  
- Cal.com: slot list in the modal only.

### 4.3 What not to build

- A chat widget that “estimates your repair.”  
- Showing `opsDraftQuote` JSON to customers.  
- Porting StripeButton / SSLCommerzButton.  
- Vendoring Cal.com as the job table.  
- FixItNow-skinning DIAL admin.

---

## 5. Information architecture (Navbar)

### 5.1 Public Navbar (copied FixItNow)

| Item | Action |
| --- | --- |
| Home `/tech` | **Stay** |
| Services `/tech/services` | **Stay** — known-need catalogue |
| Find Technicians `/tech/find-technicians` | **Stay** |
| **Diagnose** `/tech/guide` | **Add** — Pack guide + guidedIntake + checklists |
| **Emergency** `/tech/emergency` | **Add** — deterministic |
| How It Works `/tech/how-it-works` | **Stay** — rewrite steps to DIAL funnel |
| Contact `/tech/contact` | **Move to footer** (or stay; not a primary job). Fix map. |

Logged-in (right side, still orange avatar):

| Item | Action |
| --- | --- |
| **My jobs** `/tech/jobs` | **First-class** (not only behind Dashboard) |
| Dashboard | When ported: `/tech/dashboard` with FixItNow sidebar |
| Profile / Settings | Tech-styled `/tech/profile` `/tech/settings` later; today do not pretend they exist |
| Login / Sign up | Keep DIAL `/` door with `next=/tech` |

Footer keeps About, Help, legal. Become Technician CTA → DIAL tech onboarding / Android, not donor register.

### 5.2 Customer dashboard (not ported — when built)

Recreate FixItNow sidebar **under `/tech/*`**: Dashboard, My jobs, Payments (DIAL), Reviews, Profile. Help → `/tech/help`.  
Do **not** wrap this in shared `AppShell`.

### 5.3 Technician

Do not block customer UX on a web tech dashboard. Android = jobs, checklist, evidence, Take-Home. Optional later: FixItNow technician chrome at `/tech/technician/*` with WHT earnings.

### 5.4 Dual book surfaces

| Surface | Role after tweak |
| --- | --- |
| `/tech/services/[id]` BookingModal | **Primary** known-need (donor UX) |
| `/tech/book` | Fold into services or keep as “known diagnostic” shortcut using same API |
| `/tech/emergency` | Emergency only |
| `/tech/guide` | Intake / checklist; then hand off |

---

## 6. Recommended Build order (D-52) — not this task

Thin vertical already landed: orange landing + PDP book → real `POST /api/tech/services`.

**Next (when Build is authorised):**

1. [x] Navbar + How-it-works copy (Diagnose, Emergency, EcoCash/COD language).  
2. [x] BookingModal: rate_card draft label + redirect to job; then **pay** EcoCash\|COD.  
3. [x] Skin `/tech/guide` + wire `guidedIntake` (still no prices); checklist POST still local-only.  
4. [x] Job detail: evidence + status; drop Google on contact. MapLibre not added on Tech (not already used there).  
5. Recreate customer dashboard chrome.  
6. Technician Take-Home on Android (already tracer) / optional web earnings.  
7. Reviews.

**Nav + booking overlay (2026-08-17):** Diagnose / Emergency first-class in FixItNow Navbar; Contact in footer; signed-in **My jobs**. Home/hero Emergency CTA. Pay on `/tech/jobs/[id]` via existing `@dial/payments` EcoCash\|COD + Job Reserve — fail-closed without ops Daily ZiG rate. Live EcoCash keys still not injected.

Ticket incomplete until overlay + pay + diagnose are evidenced — not when the hero looks orange.

---

## 7. Internal grill (D-56) — answered from repo

Frontier empty. Human is not asked.

| # | Question | Answer |
| --- | --- | --- |
| Q1 | May AI print a price on the PDP or modal? | **No.** Rate_card `draftAmountUsdMinor` only. `opsDraftQuote` is internal. |
| Q2 | Is Cal.com the booking SoR? | **No.** Slot adapter sibling. Job + money = `@dial/jobs` + Job Reserve. |
| Q3 | Stripe / SSLCommerz? | **No.** EcoCash + COD (+ Paynow). |
| Q4 | Google Maps on contact? | **No as SoR.** MapLibre or static address (D-44). |
| Q5 | Drop Diagnose/Emergency because FixItNow lacks them? | **No.** Pack §9.3 DIAL extras — skin them orange; first-class nav. |
| Q6 | Customer-visible ops draft quote? | **No.** Human + pricing engine; customer sees approved `amountMinor`. |
| Q7 | Technician earnings without WHT? | **No.** D-50 Take-Home. |
| Q8 | FixItNow-skin DIAL admin? | **No.** Queue-first admin. |
| Q9 | Generic AI chat on `/tech`? | **No.** Capabilities only (v4 §5.15). |
| Q10 | Guided intake on emergency path? | **Must not gate.** Optional after dispatch. |
| Q11 | Live Gemini in this UX ticket? | **No.** Fixture stub OK; Presidio before live egress. |
| Q12 | Agency vs employer? | DIAL is **agent** (D-58). Job Reserve ≠ employment product design. |

---

## 8. Pointers

- Donor screen matrix (public copy status): `DIAL_Donor_Parity_Roadmap.md` §6  
- ENH-609: `ENHANCEMENTS.md`  
- AI review: `docs/agent-audits/ai-capability-tech-fixitnow-ux-2026-08-16.md`  
- Capabilities: `packages/ai/src/index.ts`; Gateway `/api/ai/guided-intake`, `/api/ai/ops-draft-quote`  
- Rate cards / jobs: `packages/jobs` `quoteFromRateCard`, `createJobIntake`, `bookJobFromIntake`  
- Take-Home: `packages/payments` `computeTakeHomeBreakdown`; `/api/tech/technician`  

---

## 9. OEM specialist routing (thin vertical, 2026-08-17)

Founder need: Mercedes-class problems should surface a **registered** Mercedes specialist — not a vibe-picked tech id.

| Layer | What landed |
| --- | --- |
| AI | `guidedIntake` → `specialistHint` `{ required, brand, system, reason }`. No `amountMinor`, no technician ids. Honda/general text → `required: false`. |
| Jobs SoR | `oemSpecialties` on profile cards; fixture `tech_mercedes_spec`; aliases Mercedes/Benz/MB. Deterministic rank. |
| Gateway | Diagnose via `POST /api/tech/technician` `resolve_checklist_by_symptom` and `POST /api/tech/services` `action=diagnose`. |
| UI | `/tech/guide` **Recommended specialist**; BookingModal on note blur; Navbar Diagnose; `/tech/find-technicians?oem=mercedes`. |

Try: sign in → `/tech/guide` → “Mercedes Benz powertrain warning” → Farai Mercedes ranked. Honda Civic idle → no specialist forced. Audit: `docs/agent-audits/ai-capability-tech-specialist-routing-2026-08-17.md`.  
