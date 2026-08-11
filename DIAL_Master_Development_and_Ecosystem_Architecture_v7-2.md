# DIAL Master Development & Ecosystem Architecture — v7

**Status:** Cumulative master specification
**Supersedes as planning surface:** DIAL v5 Revised Development Plan Assessment + DIAL v6 Trades / Commercial / Intelligence / Command Centre / Kernel specification
**Relationship to DIAL v4:** Extends and technically deepens the existing DIAL Complete Plan and Development Pack; founder decisions and existing locked architecture remain authoritative unless explicitly revised in this master document.

## Master-document rule

This document is intentionally cumulative. Material from the previous DIAL assessment is retained unless it is explicitly superseded by a later founder instruction or a more specific technical design in this document. The objective is to avoid losing valid architecture, business strategy, compliance controls, UX decisions, operational ideas or development practices during iterative revisions.

## Strategic doctrine

> **Build broad. Certify deeply. Activate selectively. Make DIAL an operating system for multiple businesses rather than a collection of standalone applications.**

DIAL has sufficient development horizon to prioritise architectural quality, operational completeness, data quality, commercial simulation, intelligence and partnership readiness over premature public launch. Most branches may remain certified-but-dormant until funding, supply density, partnerships or market conditions justify activation.

## Authority hierarchy

1. Founder decisions and locked DIAL decisions remain authoritative.
2. DIAL v4 remains the base architecture, compliance and product source of truth where not amended here.
3. This v7 document consolidates v5 strategic corrections and v6 technical expansions.
4. Domain-level implementation specifications must not violate Kernel, money, security, compliance or source-of-truth rules.
5. Where two non-founder recommendations overlap, prefer the more specific implementation rule in this document.

---

# Part I — Strategic Reassessment and Founder-Aligned Corrections

## Purpose

This document revises the assessment of the **DIAL Complete Plan and Development Pack** after a hostile “Grill-Me” review and the founder's strategic clarifications.

The key conclusion is that DIAL should **not be treated as a conventional MVP that must rush to market**.

The strategic objective is to use the available development time to build a highly polished, integrated DIAL ecosystem in which the major branches, shared infrastructure, operating systems, command centre, catalogue factory, financial controls, AI framework and ERP kernel are designed to function coherently.

Most branches can remain dormant until capital, partnerships, supply density or market conditions justify activation.

The product therefore becomes both:

1. a production-ready operating environment; and
2. a strategic asset that can demonstrate DIAL's capabilities to investors, suppliers, fleets, strategic partners and technology partners.

---

# 1. Strategic Reframing

## Previous concern

The earlier assessment criticised DIAL for attempting to launch too many businesses simultaneously.

## Founder clarification

That criticism is only partially applicable.

DIAL is deliberately being built as an ecosystem before commercial rollout. The branches do not all need to launch simultaneously.

The correct distinction is therefore:

> **Build broad. Launch selectively.**

The architecture should support the complete DIAL ecosystem even if only selected branches are activated initially.

### Revised strategy

```text
                 DIAL ECOSYSTEM
                       │
        ┌──────────────┼──────────────┐
        │              │              │
      ACTIVE         READY          DORMANT
        │              │              │
   Initial       Partnership       Future
   branches      demonstration     funding
        │              │              │
        └──────────────┼──────────────┘
                       │
                 DIAL KERNEL
                       │
              DIAL COMMAND CENTRE
```

This makes the breadth of DIAL an advantage rather than an MVP liability.

---

# 2. The Correct Product Objective

The objective is not:

> “Build enough software to launch.”

It is:

> **Build an integrated DIAL environment that is sufficiently complete, polished, reliable and demonstrable that individual business branches can be activated without rebuilding the underlying platform.**

The system should therefore be judged on:

- architectural integrity
- module interoperability
- operational completeness
- UX quality
- data quality
- financial correctness
- compliance readiness
- AI capability
- automation
- observability
- scalability
- investor/partner demonstrability

---

# 3. Commercial Simulation Engine — HIGH PRIORITY

The commercial simulation engine should become a first-class component of DIAL's planning and decision infrastructure.

The objective is not to maximise margin per transaction.

The DIAL thesis is:

> **Low-friction economics + high transaction volume + repeat usage + operational efficiency + network effects.**

The simulation engine therefore determines whether this volume strategy actually works.

## 3.1 Core architecture

```text
                    COMMERCIAL SIMULATION ENGINE
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
     SUPPLY                  DEMAND                 OPERATIONS
        │                      │                      │
 Supplier cost           Customer price          Delivery cost
 Supplier reliability    Conversion              Failed delivery
 Availability            Repeat rate             Support minutes
 Payment terms            CAC                     Verification
 Stock depth              Frequency               Returns
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                         MONEY ENGINE
                               │
       ┌───────────────────────┼──────────────────────┐
       │                       │                      │
 Revenue                 Variable costs          Risk costs
       │                       │                      │
 Margin                   Payment fees           Returns
 Commission              Tax                    Guarantee
 Delivery revenue        WHT                    Fraud
 Membership              FX                     Bad debt
                               │
                               ▼
                    CONTRIBUTION ECONOMICS
                               │
                  ┌────────────┴────────────┐
                  │                         │
              Per order                Per customer
                  │                         │
              Per job                   Per vehicle
                  │                         │
                  └────────────┬────────────┘
                               │
                         SCALE MODEL
                               │
                 GMV → Revenue → EBITDA → Cash
```

## 3.2 Scenario engine

Every major branch should have:

- pessimistic scenario
- conservative scenario
- base scenario
- aggressive scenario
- stress scenario

Variables should be editable rather than hard-coded.

### Spare parts example

```text
Supplier net price
DIAL markup
Customer price
Payment method
Currency
Tax
Delivery zone
Weight
Delivery failure probability
Return probability
Warranty probability
Order frequency
Customer acquisition cost
Repeat purchase rate
Supplier availability
```

### Services example

```text
Technician rate
DIAL commission
Customer fee
Call-out
Parts GMV
Payment cost
Tax
Guarantee provision
Cancellation
No-show
Technician retention
Repeat booking
Customer acquisition cost
```

## 3.3 Volume strategy model

The engine must answer:

> “How much volume is required to make low-margin transactions economically superior to high-margin transactions?”

For example:

```text
Strategy A
15% margin
1,000 orders/month

vs.

Strategy B
7% margin
5,000 orders/month
```

Compare:

- gross contribution
- operational cost
- working capital
- customer support
- delivery burden
- customer lifetime value
- supplier retention
- infrastructure cost
- net contribution

The engine should show the point where the volume strategy overtakes the margin strategy.

## 3.4 Monte Carlo / stochastic simulation

Where enough data exists, model uncertainty rather than using one deterministic number.

Examples:

```text
Delivery failure ~ probability distribution
Return rate ~ probability distribution
Order frequency ~ probability distribution
Supplier confirmation time ~ probability distribution
Customer repeat rate ~ probability distribution
```

Output:

- expected contribution
- P10
- P50
- P90
- probability of negative contribution
- probability of cash-flow shortfall

## 3.5 Branch readiness

Every DIAL branch receives a commercial readiness model:

```text
Branch
├── Market size
├── Addressable GMV
├── Take rate
├── Variable cost
├── Fixed cost
├── CAC
├── LTV
├── Contribution
├── Working capital
├── Break-even
├── Operational complexity
└── Strategic value
```

This lets DIAL decide which branches to activate when funding arrives.

---

# 4. Technician Economics and Tax Treatment

The 30% withholding tax should not be treated as an attempt to hide or bypass taxation.

It is a compliance requirement.

DIAL should therefore build the tax mechanism into the platform from the beginning.

## 4.1 Technician-facing economics

The technician application should show:

> **Your DIAL Take-Home**

rather than exposing unnecessary platform pricing mechanics.

Example:

```text
Job value recognised by DIAL
Your commission-free amount
Tax withheld, where legally applicable
DIAL commission
Your final payout
```

The technician's commercial relationship with DIAL should be transparent while avoiding unnecessary confusion about customer-side pricing.

## 4.2 ITF263-compliant technicians

Where the technician has valid ITF263 compliance:

```text
Technician gross entitlement
        ↓
DIAL commission
        ↓
Full remaining technician amount
        ↓
Payout
```

The exact tax treatment remains governed by the applicable legal/tax rules and should be encoded through the compliance subsystem rather than assumptions.

## 4.3 Technician Compliance Centre

```text
TECHNICIAN
    ↓
Identity
    ↓
Trade credentials
    ↓
Tax status
    ↓
ITF263
    ↓
Verification
    ↓
Expiry monitoring
    ↓
Payout eligibility
```

DIAL should assist technicians with formalisation rather than simply rejecting non-compliant technicians.

This converts compliance into a supply-development advantage.

---

# 5. Make DIAL the Technician's Operating System

This is now a strategic priority.

The technician should have reasons to use DIAL even when the customer did not originate from DIAL.

## Technician OS

Core capabilities:

- job management
- customer records
- quotation
- scheduling
- route information
- parts sourcing
- service history
- photos/evidence
- checklists
- invoicing
- payout tracking
- tax/compliance
- performance analytics
- warranty/guarantee handling
- customer communication
- reminders
- repeat-service management
- business reports

## Technician Value Score

Every technician receives a continuously updated value score.

Example:

```text
                    TECHNICIAN VALUE SCORE

Overall:                 92/100

Jobs completed:          184
Completion rate:         97%
Customer rating:         4.8/5
Repeat-job rate:         71%
Diagnostic accuracy:     93%
Comeback rate:           2.1%
Response time:           8 min
On-time arrival:         95%
Parts fitment success:   98%
Evidence quality:        94%
Compliance:              100%
Customer disputes:       1.2%
```

The score should not be a simplistic popularity rating.

It should be a multi-dimensional operational score.

## Score dimensions

```text
Quality
Reliability
Speed
Customer satisfaction
Diagnostic performance
Completion
Evidence
Professionalism
Compliance
Commercial reliability
```

The system should show technicians how to improve their score.

### Strategic effect

A technician who uses DIAL for:

- customers
- jobs
- records
- quotations
- parts
- payments
- reputation
- compliance
- analytics

has a much higher switching cost than a technician who merely receives marketplace jobs.

This is the desired network effect.

---

# 6. All Trades — Reframed as a Platform Reliability Strategy

The all-trades decision remains strategically valid.

The purpose is not that every trade must generate substantial revenue on day one.

It creates:

- breadth
- consumer reliability
- accumulated service history
- cross-selling
- technician recruitment
- trust
- skills coverage
- marketplace liquidity
- partnership value

DIAL can therefore begin with zero technicians and recruit progressively.

The system must support the trade universe before the supply network exists.

---

# 7. Revised Job Class Architecture

The previous proposal of separate trade systems should be replaced by a more general job framework.

The core object should be:

```text
JOB
```

with a configurable:

```text
JobClass
```

## 7.1 JobClass

```text
JobClass
├── Trade
├── Service category
├── Diagnostic model
├── Pricing model
├── Skill requirements
├── Credential requirements
├── Risk level
├── Required evidence
├── Checklist family
├── Parts/material requirements
├── Dispatch model
├── SLA
├── Cancellation rules
├── Warranty rules
├── Guarantee rules
├── Payment rules
└── Outcome model
```

## 7.2 Job archetypes

Instead of hard-coding trades, DIAL should support reusable job archetypes.

### A. Fixed Service

Example:

- oil change
- brake pad replacement
- standard cleaning
- hair service

```text
Known scope
Known labour
Known materials
Known duration
```

### B. Diagnostic Service

Example:

- engine fault
- electrical fault
- appliance fault

```text
Symptom
    ↓
Diagnostic procedure
    ↓
Findings
    ↓
Diagnosis
    ↓
Repair recommendation
    ↓
Approved work
    ↓
Outcome
```

### C. Measured/Quoted Service

Example:

- welding
- fabrication
- roofing
- large plumbing installation

Scope must be measured before final pricing.

### D. Emergency Service

Example:

- burst pipe
- electrical failure
- roadside breakdown

Priorities:

```text
availability
response time
risk
location
skill
```

### E. Project Service

Example:

- industrial installation
- construction
- large fabrication

Requires:

- milestones
- materials
- labour
- documents
- variations
- approvals
- progress payments

### F. Inspection / Assessment

Example:

- vehicle inspection
- machinery inspection
- electrical inspection

Output is evidence rather than immediate repair.

### G. Recurring Service

Example:

- fleet maintenance
- facility maintenance
- scheduled cleaning

The same JobClass engine can therefore support many trades without creating a separate architecture for every trade.

---

# 8. AI Strategy — Remove the Overly Conservative Position

The earlier recommendation to be cautious about training AI should be revised.

DIAL should absolutely improve its AI capability continuously.

The important principle is:

> **Train and improve the DIAL intelligence layer while preserving deterministic system truth and appropriate human oversight.**

## 8.1 DIAL Intelligence Loop

```text
Historical data
      ↓
Training / tuning
      ↓
Evaluation
      ↓
Shadow deployment
      ↓
Production
      ↓
Real-world outcomes
      ↓
Outcome weighting
      ↓
Error analysis
      ↓
Retraining / prompt improvement
      ↓
New evaluation
      ↓
Promotion
```

## 8.2 Troubleshooting intelligence

The objective should be to create a progressively stronger DIAL troubleshooting system.

Inputs:

- symptoms
- vehicle
- equipment
- environment
- previous repairs
- measurements
- images
- sounds
- technician observations
- parts replaced
- final outcome

Outputs:

- probable causes
- ranked hypotheses
- recommended diagnostic steps
- confidence
- evidence
- alternative hypotheses
- recommended next test

The system should not merely produce an answer.

It should produce a **diagnostic reasoning path that becomes better with evidence**.

---

# 9. Outcome-Weighted Intelligence

The proposed outcome-quality weighting should become a core feature.

A training example should not receive equal weight merely because someone entered it.

Example:

```text
Diagnosis
   ↓
Repair
   ↓
No comeback for 90 days
   ↓
High-quality outcome
   ↓
High training weight
```

Versus:

```text
Diagnosis
   ↓
Repair
   ↓
Customer returns
   ↓
Repeat repair
   ↓
Low-quality outcome
   ↓
Low training weight
```

Outcome signals can include:

- no comeback
- successful repair
- warranty claim
- repeat failure
- customer satisfaction
- diagnostic confirmation
- parts replacement success
- technician confirmation
- measured test result

This creates a **DIAL Outcome Intelligence Dataset**.

That dataset could eventually become one of DIAL's strongest intellectual assets.

---

# 10. Catalogue Factory — Strategic Priority

The Catalogue Factory should become an independent first-class operating environment.

The existing plan correctly identifies catalogue depth and fitment quality as a core moat.

The next step is to formalise the factory.

## DIAL Catalogue Factory

```text
                CATALOGUE FACTORY
                       │
      ┌────────────────┼────────────────┐
      │                │                │
    INGEST           CLEAN            MAP
      │                │                │
 Supplier files     Normalise       Vehicle mapping
 APIs               OCR             Fitment
 CSV                Dedupe          OEM mapping
 Images             Validate        Diagrams
 WhatsApp           Enrich          Categories
      │                │                │
      └────────────────┼────────────────┘
                       │
                  VERIFICATION
                       │
             ┌─────────┴─────────┐
             │                   │
         AI candidate       Human review
             │                   │
             └─────────┬─────────┘
                       │
                  PUBLICATION
                       │
              Meili / PostgreSQL
                       │
                  DIAL STORE
```

## Catalogue Factory Dashboard

### Executive

- catalogue completeness
- catalogue freshness
- supplier coverage
- vehicle coverage
- fitment confidence
- unresolved records

### Operations

- ingestion queue
- matching queue
- verification queue
- rejected records
- duplicates
- conflicts

### Quality

- false match rate
- confirmed fitment rate
- correction rate
- supplier error rate
- customer fitment disputes

### Productivity

- records processed/day
- AI acceptance %
- human review %
- average processing time
- cost/record

### Commercial

- searches with no result
- requested-but-missing parts
- high-demand missing catalogue items
- conversion lost from catalogue gaps

The final category is especially important.

The catalogue factory should not only maintain data.

It should tell DIAL:

> **What should be added next because customers are trying to buy it?**

---

# 11. DIAL Command Centre

The Command Centre should become the central operating layer for every DIAL branch.

It should not be merely a BI dashboard.

It should be an operational control system.

# DIAL COMMAND CENTRE

```text
                           DIAL COMMAND CENTRE
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
      BUSINESS                   OPERATIONS                 RISK
        │                          │                          │
   GMV / Revenue              Orders / Jobs              Fraud
   Contribution               Dispatch                   Security
   Customers                  Delivery                   Compliance
   CAC / LTV                  Support                    AI risk
   Growth                     Queues                     Claims
        │                          │                          │
        ├──────────────────────────┼──────────────────────────┤
        │                          │                          │
      SUPPLY                    CATALOGUE                    MONEY
        │                          │                          │
   Suppliers                  Coverage                    Ledger
   Technicians                Freshness                   PSP
   Availability               Fitment                     Reserves
   Reliability                Matching                    Reconciliation
        │                          │                          │
        └──────────────────────────┼──────────────────────────┘
                                   │
                              BRANCHES
                                   │
          Spare | Tech | Fleet | Care | Hub | Projects | Future
```

## Command Centre design principle

Every important metric should have:

```text
Current value
Target
Trend
Threshold
Owner
Severity
Root cause
Recommended action
Action status
```

Example:

```text
DELIVERY FAILURE RATE

Current:      7.8%
Target:       <5%
Trend:        ↑
Severity:     HIGH

Primary cause:
Zone 4 courier failure

Owner:
Logistics Manager

Recommended:
Reduce COD exposure in Zone 4
and activate courier B.
```

This makes the system operational rather than descriptive.

---

# 12. Comprehensive DIAL Kernel

The DIAL Kernel should become the foundational platform layer.

## DIAL Kernel

```text
packages/kernel
│
├── Identity
├── Organisations
├── Users
├── Roles
├── Permissions
├── Tenancy
│
├── Money
│   ├── Currency
│   ├── Ledger
│   ├── Payments
│   ├── Payouts
│   └── Reconciliation
│
├── State Machines
├── Events
├── Event Bus
├── Idempotency
├── Audit
├── Evidence
│
├── Pricing Contracts
├── Quotes
├── Taxes
├── FX
│
├── Compliance
│   ├── KYC
│   ├── Tax
│   ├── Consent
│   └── Data Protection
│
├── Notifications
├── Messaging
├── Files
├── Search
├── Observability
├── Feature Flags
├── Configuration
├── Risk
└── Workflow
```

Everything else builds on this.

---

# 13. DIAL Domain Layer

Above the kernel:

```text
packages/
│
├── kernel
│
├── catalogue
├── vehicles
├── suppliers
├── inventory
├── sourcing
│
├── customers
├── technicians
├── jobs
├── job-classes
├── scheduling
├── dispatch
├── delivery
│
├── orders
├── pricing
├── promotions
├── payments
├── payouts
├── guarantees
├── returns
│
├── fleet
├── care
├── projects
├── vehicle-hub
│
├── ai
├── intelligence
├── recommendations
├── diagnostics
│
├── crm
├── communications
├── support
│
├── finance
├── accounting
├── tax
├── compliance
│
└── analytics
```

---

# 14. DIAL Intelligence Layer

Create a dedicated intelligence layer above the domain services.

```text
packages/intelligence
│
├── feature-engineering
├── knowledge
├── embeddings
├── retrieval
├── evaluations
├── outcome-learning
├── recommendation
├── forecasting
├── anomaly-detection
├── pricing-intelligence
├── catalogue-intelligence
├── diagnostic-intelligence
└── technician-intelligence
```

This prevents AI logic from becoming scattered throughout the ERP.

---

# 15. Revised Launch Readiness Framework

The previous checklist should be upgraded from a simple checklist to a **multi-stage certification system**.

## Gate 0 — Architectural Integrity

Verify:

- domain boundaries
- kernel
- ledger
- permissions
- audit
- events
- state machines
- API contracts
- data model
- observability

## Gate 1 — Operational Readiness

Verify:

- supplier workflows
- technician workflows
- catalogue factory
- customer support
- delivery
- finance
- reconciliation
- compliance
- administration

## Gate 2 — Intelligence Readiness

Verify:

- AI evaluation suite
- troubleshooting
- catalogue matching
- outcome collection
- confidence scoring
- fallback paths
- cost controls
- model monitoring

## Gate 3 — Financial Readiness

Verify:

- FDMS
- payment idempotency
- ledger
- reconciliation
- payouts
- WHT
- tax
- FX
- refunds
- guarantees
- reserves

## Gate 4 — Security Readiness

Verify:

- RLS
- authentication
- authorisation
- secrets
- audit
- backup
- restore
- incident response
- penetration testing
- dependency scanning

## Gate 5 — Branch Certification

Each branch gets its own certification.

```text
Dial a Spare
READY / NOT READY

Dial a Tech
READY / NOT READY

Fleet
READY / NOT READY

Care
READY / NOT READY

Vehicle Hub
READY / NOT READY

Projects
READY / NOT READY
```

A branch can therefore be fully built but remain:

> **CERTIFIED — DORMANT**

until commercial activation is approved.

---

# 16. Investor / Partnership Demonstration Mode

Because the objective includes strategic partnerships and investment, add a dedicated mode to DIAL.

## DIAL Demonstration Environment

The Command Centre should support:

```text
DEMO MODE
│
├── Live architecture map
├── Branch capability map
├── Catalogue demonstration
├── Vehicle fitment demonstration
├── AI diagnostic demonstration
├── Technician OS
├── Commercial simulation
├── Command Centre
├── Financial model
├── Supply network
└── Future branch roadmap
```

The demo environment should allow an investor to see:

> customer → search → fitment → supplier → order → payment → delivery → job → technician → ledger → analytics → AI learning

as one connected system.

That is much more powerful than showing isolated screens.

---

# 17. What DIAL Should Ultimately Demonstrate

The strategic pitch becomes:

> **DIAL isn't a marketplace with an ERP attached.**

It is:

> **an integrated commerce, services, logistics, financial, intelligence and business operating platform capable of supporting multiple real-world service industries from one technological kernel.**

The branches are products.

The **DIAL Kernel + data + operating system + network + intelligence layer** are the company.

---

# 18. Revised Strategic Assessment

With the founder's clarification, the earlier assessment changes materially.

| Area | Previous | Revised |
|---|---:|---:|
| Strategic vision | 9/10 | **10/10** |
| Architecture | 9/10 | **9.5/10** |
| Security | 9/10 | **9.5/10** |
| Compliance | 9/10 | **9.5/10** |
| AI strategy | 9/10 | **9.5/10** |
| Catalogue strategy | 9/10 | **10/10** |
| Operational model | 8.5/10 | **9.5/10** |
| UX strategy | 8.5/10 | **9/10** |
| Commercial model | 7/10 | **8.5/10** |
| MVP discipline | 5/10 | **8.5/10** |
| Execution risk | 5/10 | **7.5/10** |
| Investor readiness | — | **9/10** |

The major improvement comes from recognising that DIAL's broad scope is intentional.

The correct risk is no longer:

> “DIAL is trying to launch too many businesses.”

It is:

> **“DIAL must ensure that all branches share an exceptionally strong common platform so that breadth does not create duplicated complexity.”**

That is exactly what the DIAL Kernel, JobClass system, Catalogue Factory, Intelligence Layer and Command Centre are intended to solve.

---

# 19. Highest-Priority Additions to the Development Plan

The following should now be treated as founder-level priorities:

### Priority 1 — DIAL Kernel
The immutable foundation for every branch.

### Priority 2 — Catalogue Factory
A dedicated data-production operation and dashboard.

### Priority 3 — Commercial Simulation Engine
A high-tech scenario and unit-economics laboratory.

### Priority 4 — DIAL Command Centre
A unified operational control system for all branches.

### Priority 5 — Technician Operating System
Make DIAL useful even before marketplace demand.

### Priority 6 — Technician Value Score
Turn reputation and performance into a measurable economic asset.

### Priority 7 — DIAL Intelligence Layer
Centralise AI, evaluation, learning and outcome intelligence.

### Priority 8 — Outcome-Weighted Learning
Use real-world results to improve troubleshooting and recommendations.

### Priority 9 — Branch Certification
Every branch can be fully built, tested and certified while remaining dormant.

### Priority 10 — Investor Demonstration Mode
Make the entire ecosystem demonstrable as a single connected machine.

---

# 20. Final Strategic Conclusion

The correct strategy is therefore:

```text
                    BUILD NOW
                       │
       ┌───────────────┼────────────────┐
       │               │                │
   DIAL KERNEL     DATA MOAT       INTELLIGENCE
       │               │                │
       └───────────────┼────────────────┘
                       │
                 COMMAND CENTRE
                       │
              COMPLETE ECOSYSTEM
                       │
       ┌───────────────┼────────────────┐
       │               │                │
     SPARE           TECH             FLEET
       │               │                │
       ├───────────────┼────────────────┤
       │               │                │
     CARE             HUB           PROJECTS
                       │
                CERTIFIED BRANCHES
                       │
              ┌────────┴────────┐
              │                 │
          COMMERCIAL         FUNDING
           ACTIVATION       / PARTNERS
```

DIAL should therefore **not rush merely to prove that it can launch**.

Use the development period to build something that makes a potential investor, OEM, parts supplier, fleet, insurer, payment provider or strategic technology partner look at DIAL and understand:

**“This is not another app. This is infrastructure.”**

The greatest competitive advantage may ultimately be the fact that DIAL has been built patiently enough that its individual branches are not isolated applications—they are manifestations of one deeply integrated operating system.



---

# Part II — Technical Ecosystem Architecture

The following section preserves and expands the v6 technical design. It is integrated here so the strategic decisions in Part I directly govern implementation architecture.


# 1. DIAL as a Configurable Operating System

DIAL should not implement one independent ERP for automotive, another for plumbing, another for electrical, and another for cleaning.

Instead:

```text
                         DIAL ECOSYSTEM
                               |
                         DIAL KERNEL
                               |
             +-----------------+-----------------+
             |                 |                 |
        UNIVERSAL MONEY   UNIVERSAL WORKFLOW   UNIVERSAL IDENTITY
             |                 |                 |
             +-----------------+-----------------+
                               |
                       UNIVERSAL JOB ENGINE
                               |
          +-----------+--------+--------+-----------+
          |           |        |        |           |
      Automotive   Plumbing  Electrical HVAC     Cleaning
          |           |        |        |           |
          +-----------+--------+--------+-----------+
                               |
                    SHARED OPERATING SERVICES
                               |
      Catalogue | Pricing | Matching | Scheduling | Evidence
      Payments | AI | Messaging | Delivery | Analytics
                               |
                     DIAL COMMAND CENTRE
```

The key abstraction is:

> **A trade is configuration + capabilities + workflows + data contracts, not a separate ERP.**

This allows DIAL to support many industries while keeping the Kernel stable.

---

# 2. DIAL Kernel

## 2.1 Purpose

The Kernel contains only capabilities that are universally true across DIAL.

It must remain deliberately small. A common failure in platform architecture is turning the kernel into a "god module" containing every feature used by every business.

## 2.2 Kernel structure

```text
packages/kernel/
|
+-- identity/
|   +-- users
|   +-- organisations
|   +-- memberships
|   +-- roles
|   +-- permissions
|
+-- tenancy/
|   +-- tenant-context
|   +-- organisation-context
|   +-- branch-context
|
+-- money/
|   +-- money
|   +-- currency
|   +-- ledger-contracts
|   +-- posting-contracts
|   +-- reconciliation-contracts
|   +-- reserve-contracts
|
+-- state/
|   +-- state-machine
|   +-- transition-guards
|   +-- transition-history
|
+-- events/
|   +-- domain-event
|   +-- event-envelope
|   +-- event-versioning
|   +-- subscriptions
|
+-- idempotency/
|   +-- request-keys
|   +-- webhook-deduplication
|
+-- audit/
|   +-- actor
|   +-- action
|   +-- before-after
|   +-- correlation
|
+-- evidence/
|   +-- media
|   +-- fingerprints
|   +-- evidence-chain
|
+-- configuration/
|   +-- organisation-config
|   +-- branch-config
|   +-- policy-config
|
+-- consent/
|   +-- consent-record
|   +-- consent-version
|
+-- notifications/
|   +-- intent
|   +-- preference
|
+-- workflow/
|   +-- workflow-correlation
|   +-- workflow-identity
|
+-- risk/
|   +-- signals
|   +-- review-required
|
+-- observability/
|   +-- correlation-id
|   +-- metrics
|   +-- health
|
+-- validation/
    +-- schemas
    +-- domain-validation
```

## 2.3 Kernel MAY own

- identity primitives;
- organisations and memberships;
- permissions primitives;
- tenancy context;
- immutable monetary primitives;
- state-machine framework;
- event contracts;
- audit framework;
- evidence framework;
- idempotency;
- correlation IDs;
- universal configuration;
- consent framework;
- notification primitives;
- generic risk signals;
- generic workflow contracts.

## 2.4 Kernel MUST NOT own

- vehicle fitment;
- part-number matching;
- technician diagnosis;
- trade-specific labour rates;
- refrigerant rules;
- electrical safety rules;
- plumbing procedures;
- catalogue classification;
- fleet maintenance policies;
- trade-specific warranties;
- branch-specific customer logic.

These remain domain responsibilities.

---

# 3. Universal DIAL Module Contract

Each major DIAL domain should expose a standard module contract.

```ts
interface DialDomainModule {
  id: string
  version: string
  capabilities: CapabilityDefinition[]
  permissions: PermissionDefinition[]
  events: EventDefinition[]
  workflows: WorkflowDefinition[]
  adminViews: AdminViewDefinition[]
  customerSurfaces: SurfaceDefinition[]
  metrics: MetricDefinition[]
  featureFlags: FeatureFlagDefinition[]
  healthChecks: HealthCheckDefinition[]
}
```

This allows the Command Centre, permissions layer, observability system and branch registry to discover domain capabilities without hard-coding every module.

---

# 4. Trade Architecture

## 4.1 TradeDefinition

```ts
interface TradeDefinition {
  id: string
  code: string
  name: string
  status: 'draft' | 'configured' | 'certified' | 'active' | 'paused' | 'retired'

  parentTradeId?: string

  jobClasses: string[]
  skills: SkillDefinition[]
  credentials: CredentialRequirement[]
  riskProfileId: string
  evidenceProfileId: string

  pricingProfiles: string[]
  checklistProfiles: string[]
  matchingProfileId: string
  schedulingProfileId: string
  warrantyProfileId: string
  scoreProfileId: string

  supportedLocations: string[]
  featureFlags: string[]

  version: number
}
```

A trade is a declarative business capability definition that points to reusable engines.

---

# 5. Add/Remove Trade Architecture

A new trade should be addable without modifying the Kernel.

```text
ADD TRADE
   |
   v
TradeDefinition
   |
   +--> Skill taxonomy
   +--> Credentials
   +--> JobClasses
   +--> Checklists
   +--> Pricing profile
   +--> Evidence rules
   +--> Matching profile
   +--> Technician score profile
   +--> AI evaluation set
   +--> Simulation model
   +--> Admin views
   +--> Customer metadata
   |
   v
CERTIFICATION PIPELINE
   |
   +--> schema tests
   +--> workflow tests
   +--> safety tests
   +--> pricing tests
   +--> matching tests
   +--> score tests
   +--> AI evals
   +--> simulation checks
   |
   v
CERTIFIED
   |
   v
RECRUITMENT MODE
   |
   v
MARKETPLACE MODE
```

The architectural objective is that adding a new trade should mostly create configuration, content and domain-specific adapters rather than a second platform.

---

# 6. Trade Lifecycle

```text
DRAFT
  |
CONFIGURED
  |
TECHNICAL_CERTIFIED
  |
OPERATIONS_CERTIFIED
  |
MARKET_READY
  |
ACTIVE
  |
+------> PAUSED
|           |
|           v
|         ACTIVE
|
RETIRING
  |
RETIRED
```

### PAUSED

Used when:

- supply is insufficient;
- a regulatory credential expires;
- pricing becomes non-viable;
- a partner agreement terminates;
- a serious operational or safety problem exists.

Pause stops new work but preserves historical jobs, reviews, technician history, financial records and intelligence data.

### RETIRED

Retirement is logical, never destructive.

Historical records remain part of the DIAL knowledge base.

---

# 7. Enhanced JobClass Architecture

The existing source model already distinguishes `fixed`, `diagnostic`, `estimated_repair`, `emergency` and `project` jobs. This should become a proper versioned `JobClassDefinition`, not remain a simple enum.

```ts
interface JobClassDefinition {
  id: string
  tradeId: string

  code: string
  name: string
  version: number

  archetype:
    | 'fixed_service'
    | 'diagnostic'
    | 'estimated_repair'
    | 'inspection'
    | 'emergency'
    | 'installation'
    | 'replacement'
    | 'fabrication'
    | 'recurring'
    | 'project'

  intakeSchemaId: string
  checklistSchemaId?: string
  pricingProfileId: string

  skillRequirements: SkillRequirement[]
  credentialRequirements: CredentialRequirement[]

  riskLevel: 'low' | 'medium' | 'high' | 'critical'

  schedulingMode:
    | 'instant'
    | 'calendar'
    | 'dispatch'
    | 'assessment_first'
    | 'project_planning'

  dispatchMode:
    | 'nearest'
    | 'best_match'
    | 'specialist'
    | 'team'
    | 'manual'

  evidenceRequirements: EvidenceRequirement[]
  scopeRules: ScopeRule[]
  variationRules: VariationRule[]
  cancellationRules: CancellationRule[]
  warrantyRules: WarrantyRule[]

  outcomeSchemaId: string
  aiPolicy: JobAiPolicy
}
```

---

# 8. Job Archetypes

## 8.1 Fixed Service

For predictable scope and cost.

Examples:

- oil change;
- routine service;
- standard cleaning;
- standard beauty service.

```text
INTAKE -> ELIGIBILITY -> PRICE -> BOOK -> EXECUTE -> EVIDENCE -> COMPLETE
```

## 8.2 Diagnostic

For an unknown underlying fault.

```text
SYMPTOM
   |
INTAKE
   |
GUIDED DIAGNOSTIC
   |
OBSERVATION
   |
TEST
   |
DIAGNOSIS
   |
REPAIR RECOMMENDATION
   |
APPROVAL
   |
REPAIR
```

Diagnostic jobs must preserve symptoms, hypotheses, tests, observations, diagnosis, repair and final outcome so that the Intelligence Factory can learn from complete cases.

## 8.3 Estimated Repair

For a sufficiently understood job where final cost remains variable.

Store:

- estimate range;
- confidence;
- assumptions;
- rate-card version;
- supplier-cost snapshot;
- expiry;
- approved variations.

## 8.4 Inspection / Assessment

The product is the inspection report.

Examples:

- vehicle inspection;
- machinery assessment;
- building assessment;
- electrical inspection.

## 8.5 Emergency

Emergency routing prioritises:

```text
Safety > Availability > Response time > Capability > Distance
```

## 8.6 Installation / Replacement

For jobs where the customer already knows the required intervention but the site and execution conditions must still be validated.

## 8.7 Fabrication

For welding, custom fabrication and dimension-driven work.

```text
REQUEST
 -> DIMENSIONS / DRAWING / PHOTO
 -> MATERIAL ESTIMATE
 -> LABOUR ESTIMATE
 -> QUOTE
 -> RESERVE / DEPOSIT
 -> FABRICATION
 -> QC
 -> DELIVERY / INSTALLATION
```

## 8.8 Recurring Service

For fleet maintenance, facility maintenance, recurring cleaning and similar schedules.

```ts
interface RecurringJobPlan {
  jobClassId: string
  frequency: string
  serviceWindow: string
  slaProfileId: string
  assignedTeamPolicyId?: string
  pricingProfileId: string
  renewalPolicyId: string
}
```

## 8.9 Project

Projects should be collections of jobs, milestones, materials, approvals and variations rather than an unrelated second ERP.

```text
PROJECT
 |
 +-- milestones
 +-- jobs
 +-- materials
 +-- variations
 +-- payments
 +-- evidence
 +-- resources
 +-- team
 +-- approvals
```

---

# 9. Job State Machine

```text
DRAFT
 |
INTAKE
 |
CLASSIFIED
 |
ELIGIBILITY_CHECKED
 |
QUOTED / CALL_OUT_PENDING
 |
BOOKED
 |
MATCHING
 |
ASSIGNED
 |
EN_ROUTE
 |
ARRIVED
 |
DIAGNOSING / EXECUTING
 |
SCOPE_CONFIRMED
 |
VARIATION_PENDING
 |
EXECUTING
 |
AWAITING_CUSTOMER_CONFIRMATION
 |
COMPLETED
 |
EVIDENCE_SEALED
 |
CUSTOMER_ACCEPTED
 |
PAYOUT_ELIGIBLE
 |
PAYOUT_SETTLED
 |
CLOSED
```

JobClass configuration determines which transitions are permitted. Invalid transitions must be structurally rejected rather than treated as UI conventions.

The source plan already defines job events such as `JobClassified`, `TechAssigned`, `ScopeConfirmed`, `VariationApproved`, `JobCompleted` and `EvidenceSealed`; this extended state machine should map those events explicitly.

---

# 10. Technician Value Score — Corrected and Formalised

The source plan already requires a technician quality score built from ratings, completion, punctuality, disputes, rework, safety and compliance, while keeping deterministic eligibility separate from ranking. This document makes the weighting, automatic adjustment and review integration explicit.

## 10.1 Score principle

The Technician Value Score is a weighted, versioned, event-driven performance index.

It is not:

- a manually assigned reputation number;
- an LLM opinion;
- a raw average of customer stars;
- a replacement for deterministic eligibility.

## 10.2 Base weighted profile

Recommended default profile:

| Dimension | Weight |
|---|---:|
| Customer quality | 20% |
| Technical outcome quality | 20% |
| Diagnostic accuracy | 15% |
| Completion reliability | 15% |
| Punctuality / SLA | 8% |
| Rework / comeback | 7% |
| Evidence quality | 5% |
| Professional behaviour | 4% |
| Compliance & safety | 4% |
| Responsiveness | 2% |
| **Total** | **100%** |

Weights must be configuration, not constants buried in application code.

A different trade may use a different weighting profile.

---

# 11. Customer Review Integration

The customer-review system already wired into DIAL should be an authoritative input to the appropriate score dimensions.

```text
JobCompleted
     |
CustomerReviewSubmitted
     |
Review Normalisation
     |
Dimension Scores
     |
Score Contribution
     |
Technician Value Score Recalculation
```

Do not merely average stars. Customer dimensions should map into the weighted score profile.

Example:

```text
workmanship      -> technical outcome quality
punctuality      -> punctuality / SLA
communication    -> professional behaviour
overall rating   -> customer quality
```

---

# 12. Automatic Score Adjustment

Every job becomes a score event.

```text
JOB COMPLETED
   |
   +--> customer review
   +--> completion verification
   +--> evidence quality
   +--> SLA result
   +--> payout outcome
   +--> rework window
   +--> warranty window
   |
   v
ScoreContribution
   |
   v
TechnicianScoreAggregator
   |
   v
CurrentScoreSnapshot
```

Later events must create new score events rather than editing history:

- `WarrantyClaimOpened`
- `ReworkRequired`
- `ConfirmedComplaint`
- `DisputeResolved`
- `SafetyIncidentConfirmed`
- `CustomerReviewUpdated`

---

# 13. Outcome-Weighted Score Contributions

A completed job is not automatically a high-quality outcome.

Use an outcome multiplier:

```text
scoreContribution =
  baseDimensionWeight
  * outcomeQualityMultiplier
  * evidenceConfidence
  * sampleReliability
```

A repair with five stars but a repeat failure after four days should contribute less to technical outcome quality than a five-star repair with no comeback over the defined observation window.

Suggested outcome signals:

- no comeback;
- successful repair;
- warranty claim;
- repeat failure;
- customer satisfaction;
- technician confirmation;
- measured test result;
- post-service inspection;
- customer repeat booking.

---

# 14. Sample Reliability

Early scores should not be treated with the same statistical confidence as mature scores.

Use a smoothing factor such as:

```text
confidence = n / (n + k)
```

where:

- `n` = relevant completed jobs;
- `k` = configurable stabilisation constant.

The score should display both the score and the confidence/sample band.

Example:

```text
Value Score: 93.1
Confidence: High
Relevant jobs: 184
```

versus:

```text
Value Score: 96.8
Confidence: Early
Relevant jobs: 4
```

---

# 15. Trade-Specific Score Profiles

The scoring engine is universal; weights and dimensions can vary by trade.

### Automotive

- diagnostic accuracy;
- repair success;
- fitment accuracy;
- comeback rate.

### Plumbing

- leak resolution;
- repeat-failure rate;
- emergency response;
- evidence quality.

### Electrical

- fault resolution;
- safety compliance;
- repeat failure;
- certification status.

### Cleaning

- service coverage;
- punctuality;
- customer rating;
- repeat booking.

### Beauty

- service quality;
- customer retention;
- punctuality;
- repeat booking.

---

# 16. Technician Score Data Model

```text
technician_score_profiles
technician_score_weights
technician_score_snapshots
technician_score_contributions
technician_score_events
technician_score_adjustments
technician_score_versions
```

Recommended package:

```text
packages/technician-scoring/
  definitions.ts
  weights.ts
  contribution-engine.ts
  aggregation.ts
  calibration.ts
  history.ts
  trade-profiles.ts
  events.ts
```

---

# 17. Technician Score Explainability

The technician application should explain score movement.

Example:

```text
YOUR VALUE SCORE: 92.4

Improved
+2.1  Five successful jobs
+1.3  Customer review improvement
+0.8  Faster response time

Reduced
-1.2  One late arrival
-0.7  One rework event
```

This is important because the score is intended to motivate behaviour, not secretly punish technicians.

---

# 18. DIAL Intelligence Factory

DIAL should explicitly permit AI and machine-learning improvement rather than treating training as something to avoid.

The restriction is not "do not train".

The restriction is:

> **Do not allow uncontrolled model changes to silently alter production behaviour.**

Create:

```text
packages/intelligence-factory/
```

and supporting workers/services:

```text
services/intelligence-worker/
services/model-evaluation/
```

---

# 19. Intelligence Factory Architecture

```text
                       DIAL INTELLIGENCE FACTORY
                                  |
      +---------------------------+---------------------------+
      |                           |                           |
     DATA                      KNOWLEDGE                   OUTCOMES
      |                           |                           |
 jobs / reviews              trade rules                 repair result
 catalogue / pricing        checklists                   rework
 technician history          procedures                   warranty
 delivery                    manuals                     fitment
      |                           |                           |
      +---------------------------+---------------------------+
                                  |
                           DATA QUALITY LAYER
                                  |
                          DATASET VERSIONING
                                  |
                       FEATURE ENGINEERING
                                  |
                +-----------------+------------------+
                |                                    |
            RETRIEVAL                           LEARNING
                |                                    |
     embeddings / ranking           classifiers / ranking / regressors
                |                                    |
                +-----------------+------------------+
                                  |
                              AI GATEWAY
                                  |
                        structured inference
                                  |
                           EVALUATION GATES
                                  |
                       SHADOW -> CANARY -> LIVE
                                  |
                           REAL OUTCOMES
                                  |
                         OUTCOME FEEDBACK
                                  |
                             NEW DATASET
```

---

# 20. Intelligence Dataset Model

Every training or evaluation example needs provenance.

```ts
interface TrainingRecord {
  id: string
  sourceEventIds: string[]
  sourceDomain: string

  features: unknown
  label: unknown

  outcomeQuality: number
  dataQuality: number
  confidence: number

  datasetVersion: string
  createdAt: Date
}
```

Important datasets should include:

```text
job classification
trade classification
diagnostic cases
catalogue matching
fitment confirmation
supplier matching
technician outcomes
customer review outcomes
pricing observations
delivery outcomes
returns
warranty
fraud
```

---

# 21. DIAL Intelligence Learning Loop

```text
PRODUCTION EVENT
    |
DATA CAPTURE
    |
QUALITY FILTER
    |
LABEL / OUTCOME
    |
DATASET VERSION
    |
TRAIN / TUNE
    |
EVALUATE AGAINST BASELINE
    |
SHADOW
    |
CANARY
    |
PRODUCTION
    |
MONITOR
    |
OUTCOME
    |
BACK INTO DATASET
```

The intelligence system is therefore allowed to improve continuously.

---

# 22. Outcome-Quality Hierarchy

Not all evidence should receive the same learning weight.

```text
LEVEL 1 — customer symptom
LEVEL 2 — technician observation
LEVEL 3 — diagnostic test
LEVEL 4 — physical evidence
LEVEL 5 — repair performed
LEVEL 6 — immediate successful outcome
LEVEL 7 — long-term successful outcome
```

For troubleshooting, the strongest labels come from the downstream outcome rather than only from what a technician initially believed.

Example:

```text
Diagnosis
  -> Repair
  -> No comeback for observation period
  -> Strong training signal
```

versus:

```text
Diagnosis
  -> Repair
  -> Comeback
  -> Warranty
  -> Weak/negative training signal
```

---

# 23. Intelligence Factory Evaluation

Every learned capability should have:

- frozen baseline set;
- training set;
- validation set;
- regression set;
- real-world holdout set;
- quality thresholds;
- abstention threshold;
- rollback version.

The source plan already requires evaluation gates and continuous sampled human review; this architecture retains those controls while allowing the models to become better over time.

---

# 24. Troubleshooting Intelligence

The target is a DIAL diagnostic system that becomes progressively better at:

- symptom interpretation;
- hypothesis ranking;
- test recommendation;
- likely-part ranking;
- identifying missing information;
- recognising misleading symptoms;
- learning from unsuccessful repairs.

Outputs should be structured as:

```text
Problem understanding
Hypotheses
Evidence for each hypothesis
Evidence against each hypothesis
Next diagnostic step
Confidence
Missing information
Escalation condition
```

The system should not merely answer a question. It should build a reusable diagnostic case.

---

# 25. Commercial Simulation Engine

Create:

```text
packages/commercial-simulation/
services/commercial-simulation/
```

The production ERP remains the source of truth. The simulation environment consumes immutable data snapshots and cannot mutate production money or operational records.

The simulator exists to answer:

> **What should DIAL do, how much does it cost, how much volume can the system handle, and what breaks first?**

---

# 26. Commercial Simulation Architecture

```text
                     DIAL PRODUCTION DATA
                              |
                     Dataset Snapshot
                              |
                       Scenario Builder
                              |
                Parameter / Distribution Store
                              |
                     Simulation Orchestrator
                              |
          +-------------------+-------------------+
          |                   |                   |
       DETERMINISTIC        MONTE CARLO          DES
       scenarios            uncertainty       event queues
          |                   |                   |
          +-------------------+-------------------+
                              |
                          ABM / Agents
                              |
                         OPTIMISATION
                              |
                    SENSITIVITY ANALYSIS
                              |
                         RESULTS STORE
                              |
                     DIAL COMMAND CENTRE
```

---

# 27. Simulation Modes

## 27.1 Deterministic

Example:

> What happens if delivery failures rise from 4% to 8%?

Use for fast executive what-if analysis.

## 27.2 Monte Carlo

Example:

> Across 10,000 plausible combinations of demand, returns, payment mix and delivery failures, how often does contribution become negative?

## 27.3 Discrete-event simulation

Models queues, resources and events.

Use for:

- supplier confirmation queues;
- technician capacity;
- courier capacity;
- support queues;
- catalogue processing;
- payment/reconciliation workloads.

## 27.4 Agent-based simulation

Model customer, technician, supplier and courier behaviour.

---

# 28. Open-Source Simulation Stack

## SimPy — Discrete Event Simulation

Repository:

https://github.com/simpx/simpy

Use for:

- queues;
- resources;
- worker capacity;
- supplier confirmation;
- technician allocation;
- support capacity;
- delivery queues.

Confirm the current repository licence at adoption time under DIAL's existing licence-governance policy.

## Mesa — Agent-Based Simulation

Repository:

https://github.com/mesa/mesa

Mesa is an open-source Python agent-based modelling framework with scheduling, spatial modelling, browser visualisation and analysis support. Current documentation identifies the project as Apache-2.0 licensed.

Use for:

- customer behaviour;
- technician behaviour;
- supplier behaviour;
- courier behaviour;
- marketplace dynamics.

## SALib — Sensitivity Analysis

Repository:

https://github.com/SALib/SALib

SALib is MIT licensed and provides Sobol, Morris, FAST and related sensitivity-analysis methods.

Use for identifying which assumptions dominate DIAL's output.

## OR-Tools — Optimisation

Repository:

https://github.com/google/or-tools

Apache-2.0.

Use for:

- assignment;
- routing;
- capacity planning;
- technician/courier allocation;
- supplier optimisation;
- workforce optimisation.

## Pyomo — Mathematical Optimisation

Repository:

https://github.com/Pyomo/pyomo

BSD licensed.

Use for:

- pricing optimisation experiments;
- sourcing optimisation;
- capacity planning;
- staffing models;
- network design.

## SupplyNetPy — Research / Experimental

SupplyNetPy is a newer open-source Python project for high-fidelity supply-chain modelling and discrete-event simulation with stochastic demand, lead times, disruptions and network reporting. It is potentially relevant to DIAL's future supply-chain digital twin but should remain experimental until its maturity and licence are revalidated.

Reference:

https://arxiv.org/abs/2607.09745

---

# 29. Commercial Model Schema

The simulator should represent each branch as a configurable economic model.

```ts
interface CommercialModel {
  branchId: string
  version: string

  demandModel: DemandModel
  supplyModel: SupplyModel
  pricingModel: PricingModel
  paymentModel: PaymentModel
  logisticsModel: LogisticsModel
  labourModel?: LabourModel
  customerModel: CustomerModel
  retentionModel: RetentionModel
  riskModel: RiskModel

  fixedCosts: CostComponent[]
  variableCosts: CostComponent[]
  capitalConstraints: CapitalConstraint[]
}
```

---

# 30. Volume Strategy Simulation

DIAL's commercial thesis is not maximum margin per transaction. It is low-friction economics and volume.

The simulator must therefore compare:

```text
Scenario A
15% contribution margin
10,000 orders/month

Scenario B
7% contribution margin
50,000 orders/month
```

and then layer in:

- payment cost;
- delivery cost;
- return cost;
- guarantee cost;
- support cost;
- WHT exposure where applicable;
- customer acquisition cost;
- working capital;
- infrastructure.

The key output is contribution **after operational load**, not merely markup.

---

# 31. Monte Carlo Model

Variables should be represented as distributions where sufficient historical data exists.

Examples:

```text
delivery_failure_rate
return_rate
supplier_confirmation_time
customer_repeat_rate
order_frequency
support_minutes_per_order
technician_acceptance_rate
technician_churn
payment_method_mix
```

Outputs:

- P10 contribution;
- P50 contribution;
- P90 contribution;
- probability of negative contribution;
- probability of cash shortfall;
- probability of SLA failure.

---

# 32. What-Breaks-First Engine

This should be a first-class simulator feature.

At selected scale levels:

```text
1,000 orders/month
10,000
50,000
100,000
500,000
1,000,000
```

measure:

- queue utilisation;
- worker utilisation;
- supplier capacity;
- technician capacity;
- courier capacity;
- database workload;
- AI cost;
- catalogue-processing capacity;
- support capacity;
- reconciliation capacity;
- working capital;
- cash exposure;
- contribution degradation.

Example output:

```text
DIAL SPARE — 100,000 monthly orders

1. Courier capacity
   Threshold: 72,000
   Utilisation: 94%

2. Supplier confirmation
   Threshold: 83,000
   Queue delay: 6.2 h

3. Support operations
   Threshold: 91,000
   SLA breach risk: 12%

4. Catalogue processing
   Threshold: 130,000

5. Payment infrastructure
   Threshold: 180,000
```

This is the output the original critique was asking for when it asked, "What breaks first?" The revised strategy makes that a formal product capability.

---

# 33. Simulation Optimisation Loop

```text
Current model
   |
Simulation
   |
Bottleneck discovery
   |
Optimisation
   |
Alternative strategy
   |
Simulation again
   |
Compare
   |
Select strategy
```

Example:

> Should DIAL add 10 couriers, one dispatch hub, or improve route optimisation?

The simulator should quantify the expected outcome of each choice.

---

# 34. Command Centre Architecture

The existing plan already specifies a queue-first Command Centre with a unified backlog, SLA clocks and correlation-ID drill-down. This should remain the operational core.

Expand it into five layers:

```text
1. DATA
2. METRICS
3. ALERTING
4. DECISION SUPPORT
5. ACTION
```

---

# 35. Command Centre Data Layer

Sources:

- PostgreSQL;
- DIAL ledger;
- domain events;
- Temporal workflow state;
- BullMQ queues;
- Meilisearch operational metrics;
- AI telemetry;
- Catalogue Factory;
- technician reviews;
- delivery;
- simulation outputs.

---

# 36. Metric Contract

Every important KPI should have an explicit definition.

```ts
interface MetricDefinition {
  id: string
  name: string
  dimensions: string[]
  source: string
  calculation: string
  frequency: string
  owner: string
  thresholds: ThresholdDefinition[]
}
```

This prevents different dashboards from calculating the same KPI differently.

---

# 37. Command Centre Severity

```text
INFO
WARNING
HIGH
CRITICAL
```

Every alert should identify:

- affected branch;
- affected entity;
- current metric;
- target;
- trend;
- probable causes;
- owner;
- recommended action.

---

# 38. Command Centre Action Framework

```ts
interface OperationalAlert {
  id: string
  metricId: string
  severity: Severity
  entityType: string
  entityId: string

  probableCauses: Cause[]
  recommendedActions: ActionDefinition[]

  ownerRole: string
  detectedAt: Date
}
```

Actions may include:

- pause supplier;
- pause trade;
- route queue to another team;
- require four-eyes review;
- trigger reconciliation;
- activate a workflow;
- launch catalogue review;
- initiate technician recruitment.

Actions must be permission-controlled and auditable.

---

# 39. Command Centre Navigation

```text
COMMAND CENTRE
|
+-- Overview
|
+-- Business
|   +-- GMV
|   +-- Revenue
|   +-- Contribution
|   +-- Customers
|   +-- CAC / LTV
|
+-- Branches
|   +-- Spare
|   +-- Tech
|   +-- Fleet
|   +-- Care
|   +-- Vehicle Hub
|   +-- Projects
|
+-- Operations
|   +-- Orders
|   +-- Jobs
|   +-- Delivery
|   +-- Queues
|   +-- Support
|
+-- Supply
|   +-- Suppliers
|   +-- Technicians
|   +-- Capacity
|
+-- Catalogue Factory
|   +-- Ingestion
|   +-- Matching
|   +-- Verification
|   +-- Coverage
|   +-- Fitment
|
+-- Money
|   +-- Ledger
|   +-- Reserves
|   +-- Payouts
|   +-- Reconciliation
|
+-- Intelligence Factory
|   +-- Model health
|   +-- Evaluation
|   +-- Learning
|   +-- Drift
|
+-- Risk
|   +-- Fraud
|   +-- Security
|   +-- Compliance
|   +-- Claims
|
+-- Simulation
|   +-- Scenarios
|   +-- Economics
|   +-- Capacity
|   +-- What breaks first
|
+-- Configuration
    +-- Trades
    +-- Branches
    +-- Policies
    +-- Features
```

---

# 40. Command Centre Drill-Down

Every KPI should drill through:

```text
KPI
 -> Branch
 -> Queue
 -> Entity
 -> Event
 -> Evidence
```

Example:

```text
Tech completion rate
 -> Automotive
 -> Harare South
 -> Brake jobs
 -> Technician
 -> Job
 -> Evidence
 -> Customer review
```

This is why correlation IDs, event IDs and evidence IDs are foundational.

---

# 41. Actual vs Simulated Command Centre

The Command Centre should show real performance next to scenario predictions.

```text
TECHNICIAN UTILISATION

Actual:             71%
Target:             75%
Simulated optimum:  82%

At 90% demand growth:
Expected utilisation: 93%
Expected SLA failure: 17%

Bottleneck:
Electrical technician capacity
```

This transforms simulation from a research tool into a management instrument.

---

# 42. Technical Observability Separation

The three layers should remain distinct:

```text
Prometheus + infrastructure observability
        = technical/system telemetry

Metabase
        = business intelligence / reporting

DIAL Command Centre
        = operational decision + action
```

Prometheus is Apache-2.0 licensed and is a suitable foundation for technical metrics:
https://github.com/prometheus/prometheus

Grafana can be used as an internal operational visualisation layer, but its current repository is AGPL-3.0-only, so it should remain an isolated self-hosted tool rather than being imported into proprietary DIAL application code:
https://github.com/grafana/grafana

---

# 43. Branch and Trade Feature Management

Branch activation should be configuration driven, not source-code deployments.

Candidate open-source tool:

### Unleash
https://github.com/unleash/unleash

Unleash provides feature-management, environments, targeting strategies, canary/gradual rollout and kill-switch capabilities. Current documentation describes local evaluation/caching and multiple activation strategies.

Use flags such as:

```text
branch.dialaspare.enabled
branch.dialatech.enabled
branch.fleet.enabled
branch.care.enabled
branch.vehiclehub.enabled
branch.projects.enabled

trade.automotive.enabled
trade.plumbing.enabled
trade.electrical.enabled
trade.hvac.enabled
trade.welding.enabled
trade.beauty.enabled
```

However:

> **Unleash must not become the authoritative business source of truth.**

DIAL database state remains authoritative for branch/trade certification status. Feature tooling controls rollout.

---

# 44. Configurable Operational Rules

A human-readable rules engine may be useful for non-financial trade behaviours.

Candidate:

### json-rules-engine
https://github.com/CacheControl/json-rules-engine

Its repository describes JSON rules, nested ALL/ANY conditions, priorities and secure evaluation without `eval()`.

Use for:

- matching modifiers;
- non-financial routing;
- trade intake decisions;
- operational conditions;
- notification rules.

Do not move the ledger or authoritative pricing engine into a generic rules engine.

---

# 45. Durable Workflow

Retain Temporal as the workflow engine.

Use it for:

- trade certification;
- technician onboarding;
- branch activation;
- long-running jobs;
- project orchestration;
- payout workflows;
- guarantee windows;
- simulation runs;
- Intelligence Factory pipelines.

Temporal's TypeScript SDK is MIT licensed and provides durable workflow execution:
https://github.com/temporalio/sdk-typescript

Its architecture uses durable workflow history and replay, which fits DIAL's need for long-running operational state.

---

# 46. Catalogue Factory Integration

The Catalogue Factory becomes a first-class Command Centre domain.

```text
Supplier Data
    |
Ingest
    |
Normalise
    |
Match
    |
Human Review
    |
Publish
    |
Meili Index
    |
Customer Search
    |
Order
    |
Fitment Confirmation
    |
Outcome
    |
Intelligence Factory
```

Command Centre metrics:

- records received/day;
- records processed/day;
- auto-match %;
- review %;
- false-match %;
- unmatched %;
- fitment confirmation rate;
- search-no-result rate;
- catalogue freshness;
- demand for missing parts.

The last metric is strategically important: the factory should discover not only which records need repair but **which catalogue gaps are costing DIAL sales**.

---

# 47. Technician Recruitment Architecture

DIAL may launch a trade with zero technicians.

The system should therefore support:

```text
TRADE CERTIFIED
      |
RECRUITMENT MODE
      |
Applicant onboarding
      |
Credential verification
      |
Practical verification
      |
Trade score profile assigned
      |
Probation
      |
Verified
      |
Preferred
```

Recruitment can begin before the customer marketplace is activated.

---

# 48. Branch Certification

Each branch gets its own certification status.

```text
Branch
 |
 +-- Architecture
 +-- Data
 +-- Workflows
 +-- Money
 +-- Security
 +-- AI
 +-- Operations
 +-- Supply
 +-- UX
 +-- Simulation
 +-- Analytics
```

A branch may be:

```text
CERTIFIED + DORMANT
```

This is the correct mechanism for a long-horizon ecosystem build.

---

# 49. Monorepo Expansion

Recommended structure:

```text
dial/
|
+-- apps/
|   +-- customer-android/
|   +-- customer-ios/
|   +-- customer-web/
|   +-- technician-android/
|   +-- supplier-web/
|   +-- admin-web/
|   +-- delivery-android/
|
+-- packages/
|   +-- kernel/
|   +-- trades/
|   +-- branches/
|   +-- job-classes/
|   +-- jobs/
|   +-- matching/
|   +-- scheduling/
|   +-- catalogue/
|   +-- catalogue-factory/
|   +-- suppliers/
|   +-- technicians/
|   +-- technician-scoring/
|   +-- pricing/
|   +-- orders/
|   +-- payments/
|   +-- ledger/
|   +-- delivery/
|   +-- promotions/
|   +-- ai/
|   +-- intelligence-factory/
|   +-- evaluations/
|   +-- command-centre/
|   +-- metrics/
|   +-- alerting/
|   +-- fleet/
|   +-- care/
|   +-- vehicle-hub/
|   +-- projects/
|
+-- services/
|   +-- commercial-simulation/
|   +-- intelligence-worker/
|   +-- catalogue-worker/
|   +-- scoring-worker/
|
+-- infra/
|   +-- temporal/
|   +-- bullmq/
|   +-- prometheus/
|   +-- grafana/
|   +-- unleash/
|   +-- simulation/
|
+-- schemas/
|   +-- events/
|   +-- metrics/
|   +-- training/
|   +-- simulations/
|
+-- docs/
    +-- trade-specifications/
    +-- job-class-specifications/
    +-- simulations/
    +-- intelligence/
    +-- command-centre/
```

---

# 50. Development Sequence

The existing DIAL build sequence starts with shared/identity/ledger/payments, then catalogue/suppliers, orders/delivery/tax, jobs/matching/technicians/pricing, then AI and the experience layer. That sequence remains sound. This document inserts the new platform layers around it.

## Train 0 — DIAL Kernel

Identity, organisations, permissions, states, events, evidence, audit, correlation, configuration.

## Train 1 — Money Spine

Ledger, currency, payments, reserves, reconciliation, tax foundations.

## Train 2 — Universal Job Engine

Job, JobClass, state machine, scope, evidence, variations, outcomes.

## Train 3 — Trade Engine

TradeDefinition, skills, credentials, risk, JobClass profiles, checklist profiles, matching profiles, score profiles.

## Train 4 — Catalogue Factory

Ingestion, normalisation, matching, review, publication and factory dashboard.

## Train 5 — Technician Operating System

Jobs, customers, quotations, scheduling, evidence, compliance, score and business tools.

## Train 6 — Matching / Dispatch

Eligibility, ranking, preferred rematching, courier dispatch.

## Train 7 — Intelligence Factory

Datasets, training, evaluation, deployment, monitoring and outcome learning.

## Train 8 — Commercial Simulation

Deterministic scenarios, Monte Carlo, DES, ABM, optimisation and sensitivity analysis.

## Train 9 — Command Centre

Unified operational data, metrics, alerting, decision support and controlled actions.

## Train 10 — Branch Surfaces

Spare, Tech, Fleet, Care, Vehicle Hub, Projects and other branch interfaces.

---

# 51. Technical Success Criteria

The architecture should ultimately demonstrate:

### Adding a trade

No Kernel rewrite.

### Removing a trade

No historical data loss.

### Adding a JobClass

No new payment engine.

### Adding a branch

No duplicate identity, ledger or notification infrastructure.

### Changing score weights

No application rewrite.

### Training a model

No production schema redesign.

### Running a commercial scenario

No production mutation.

### Activating a branch

Certification + configuration + feature rollout.

### Pausing a branch

No effect on other branches.

---

# 52. Final Architecture

```text
                         DIAL ECOSYSTEM
                              |
                    +---------+---------+
                    |                   |
                DIAL KERNEL       DIAL INTELLIGENCE
                    |                   |
             Universal Services    Intelligence Factory
                    |                   |
                    +---------+---------+
                              |
                       UNIVERSAL ENGINES
                              |
       +----------+-----------+-----------+-----------+
       |          |           |           |           |
     TRADE      JOB         MATCHING    PRICING    CATALOGUE
     ENGINE     ENGINE      ENGINE      ENGINE      FACTORY
       |          |           |           |           |
       +----------+-----------+-----------+-----------+
                              |
                       BUSINESS BRANCHES
                              |
      +---------+---------+---------+---------+---------+
      |         |         |         |         |         |
    Spare     Tech      Fleet      Care      Hub     Projects
                              |
                    DIAL COMMAND CENTRE
                              |
              +---------------+---------------+
              |               |               |
           ACTUAL          INTELLIGENCE      SIMULATION
              |               |               |
              +---------------+---------------+
                              |
                       DECISION SUPPORT
                              |
                         DIAL PEOPLE
```

---

# 53. Strategic Conclusion

The strongest DIAL architecture is not:

> **one application serving multiple businesses.**

It is:

> **one operating system capable of instantiating multiple businesses.**

The Kernel supplies universal rules.

The Trade Engine supplies trade semantics.

The JobClass Engine supplies service semantics.

The Technician Scoring Engine converts completed jobs and customer reviews into continuously improving performance intelligence.

The Catalogue Factory turns supplier information and real-world fitment outcomes into a proprietary data asset.

The Intelligence Factory turns DIAL's operational history into progressively stronger reasoning, prediction and decision support.

The Commercial Simulation Engine lets DIAL test strategic decisions before committing real capital and explicitly identify what will break first.

The Command Centre turns all of that into one operating cockpit.

The Branch System turns those capabilities into separate businesses that can be certified, activated, paused or retired without rebuilding the platform.

That is the architecture that best matches the long-horizon strategy: **build the environment first, make the ecosystem exceptionally deep, then activate branches when capital, partnerships, demand and supply justify them.**

---

# 54. External Open-Source References

The following are candidates for acceleration and architectural reference, not automatic DIAL dependencies. DIAL's existing licence-governance rule remains authoritative and requires re-checking the actual repository licence before adoption.

- SimPy: https://github.com/simpx/simpy
- Mesa: https://github.com/mesa/mesa
- SALib: https://github.com/SALib/SALib
- OR-Tools: https://github.com/google/or-tools
- Pyomo: https://github.com/Pyomo/pyomo
- Temporal TypeScript SDK: https://github.com/temporalio/sdk-typescript
- Unleash: https://github.com/unleash/unleash
- json-rules-engine: https://github.com/CacheControl/json-rules-engine
- Prometheus: https://github.com/prometheus/prometheus
- Grafana: https://github.com/grafana/grafana
- SupplyNetPy research reference: https://arxiv.org/abs/2607.09745



---

# Part III — Consolidated Implementation Doctrine

## A. What is built once

Build once in the Kernel or shared operating services: identity, organisations, permissions, tenancy context, audit, evidence, events, state-machine framework, idempotency, correlation, money primitives, workflow contracts, notification primitives, configuration, generic risk signals and observability contracts.

## B. What is configured per trade

Configure per trade: skills, credentials, risk profile, evidence requirements, JobClasses, pricing profiles, checklist profiles, matching profiles, scheduling profiles, warranty policies, score weights, AI evaluation sets and simulation models.

## C. What is activated per branch

Activate per branch: routes, customer surfaces, admin modules, operational queues, commercial models, feature flags, partner integrations and branch-specific legal/operational policies.

## D. What must never become a second source of truth

External OSS tools can accelerate development or supply operational capabilities, but DIAL remains authoritative for: money, pricing, Job Reserve, customer/technician/supplier records, trade/branch state, fulfilment state, compliance state, Technician Value Score, catalogue truth, AI evaluation state and business KPI definitions.

## E. Core ecosystem loop

```text
REAL-WORLD EVENT
      ↓
DIAL TRANSACTION / JOB / ORDER
      ↓
EVIDENCE + OUTCOME
      ↓
KERNEL EVENTS
      ↓
COMMAND CENTRE METRICS
      ↓
INTELLIGENCE FACTORY + COMMERCIAL SIMULATION
      ↓
INSIGHT / MODEL / BOTTLENECK
      ↓
CONTROLLED DECISION
      ↓
WORKFLOW / CONFIGURATION CHANGE
      ↓
BETTER DIAL OPERATIONS
```

## F. Final build philosophy

The long development horizon should be used to create a system that is:

- architecturally modular;
- commercially modelled;
- operationally observable;
- continuously learning;
- data-compounding;
- branch-independent;
- trade-independent at the Kernel level;
- investor-demonstrable;
- partnership-ready; and
- capable of adding or retiring branches without destabilising unrelated parts of the ecosystem.

The objective is not merely a finished application. It is a **certified, extensible DIAL operating environment** from which multiple businesses can be activated when the commercial opportunity is ready.
