# DIAL AI KERNEL + PRIME AGENT
## Private, Self-Improving ERP Intelligence Architecture

### Technical Architecture, Integration Strategy, Security Model and Continuous-Learning Framework

> **Superseded as SoR by D-61 companion; proposal archive only.**  
> Locked absorb: `DIAL_AI_Kernel_Prime_Agent_Adopted.md` · Eval: `DIAL_AI_Kernel_Prime_Agent_Feasibility_Evaluation.md` · Authority: `DIAL_Consolidated_Plan_v4.md` (**D-61**). Do not implement this document as written (peer AI kernel / local-first S24 inference / parallel eval SoR rejected).

**Status:** Proposal archive (non-SoR) — superseded by **D-61**  
**Primary Objective:** Build a private, internally controlled AI capability for Dial ERP  
**Prime Agent Role:** Agent execution, reasoning, recursive subagents, skills and continuous improvement support  
**System of Record:** Dial/Supabase/PostgreSQL  
**Production AI Control Plane:** Dial AI Kernel  
**Prime Agent Deployment:** Self-hosted private execution node on Samsung Galaxy S24 using Termux  
**External Personal-Data Export:** Strictly prohibited

---

# 1. Executive Architecture Decision

Dial AI shall be designed as an **internal ERP intelligence platform**, not as a general-purpose cloud AI assistant.

The AI subsystem exists to:

1. Troubleshoot operational and technical problems.
2. Analyse internal ERP data.
3. Identify patterns, anomalies and inefficiencies.
4. Recommend improvements.
5. Learn from historical ERP activity.
6. Improve workflows and decision support.
7. Assist users in understanding internal business information.
8. Continuously improve Dial's own recommendations, skills and agent behaviour.
9. Assist developers in improving the Dial software.
10. Generate simulations, forecasts and what-if analyses using internal data.

It shall **not**:

- export personal information to external AI providers;
- use external AI services as a hidden data-processing mechanism;
- become the System of Record;
- independently alter authoritative ERP records;
- independently change financial, payroll, inventory, accounting or other authoritative transactions;
- autonomously deploy production code;
- acquire unrestricted database credentials;
- possess unrestricted shell access to the production environment;
- treat its own memories, conclusions or recommendations as authoritative business truth.

The fundamental architecture is therefore:

```text
                         DIAL PLATFORM
                              |
        +---------------------+---------------------+
        |                     |                     |
        v                     v                     v
   DIAL CLIENTS          DIAL ERP CORE        DIAL AI PLATFORM
 Web / Android / POS           |                     |
                              |               +-----+------+
                              |               |            |
                              v               v            v
                         SUPABASE /        AI KERNEL   AI MEMORY
                         POSTGRES             |            |
                             |                |            |
                             |                v            |
                             |          AGENT REGISTRY     |
                             |                |            |
                             |                v            |
                             |        PRIME AGENT RUNTIME  |
                             |                |            |
                             |                v            |
                             |          SPECIALISED AGENTS
                             |                |
                             +----------------+
```

The most important principle is:

> **Prime Agent is an intelligence/execution component. Dial is the authoritative system.**

---

# 2. The Four Fundamental Layers

The architecture should be divided into four major layers.

## Layer 1 — System of Record

This is Dial's authoritative data layer.

Primary components:

- PostgreSQL
- Supabase
- ERP domain services
- transactional APIs
- authentication
- row-level security
- audit logs
- immutable transaction history

This layer owns:

- customers;
- suppliers;
- employees;
- products;
- inventory;
- sales;
- purchases;
- invoices;
- payments;
- accounting;
- production;
- maintenance;
- assets;
- work orders;
- projects;
- permissions;
- organisational configuration.

Prime Agent must **never become a replacement for this layer**.

---

# 3. Non-Negotiable SOR Rule

Prime Agent must never be treated as a System of Record.

This means Prime Agent must not become the authoritative source for:

- customer records;
- employee records;
- supplier records;
- financial balances;
- inventory quantities;
- invoices;
- payments;
- production quantities;
- asset states;
- maintenance history;
- permissions;
- accounting entries;
- business configuration.

The authoritative flow is always:

```text
Agent Recommendation
        |
        v
Dial Kernel
        |
        v
Validation / Policy
        |
        v
Authorised ERP Service
        |
        v
PostgreSQL / SOR
```

Never:

```text
Prime Agent
     |
     v
Prime Memory
     |
     v
"Truth"
```

Prime's memory can contain **working knowledge**, but it does not supersede ERP records.

---

# 4. Layer 2 — Dial AI Kernel

The Dial AI Kernel is the production-grade control plane.

It should be implemented as a first-class Dial subsystem rather than hidden inside Prime Agent.

Its responsibilities are:

### Agent orchestration

Determine:

- which agent should handle a problem;
- whether multiple agents are required;
- whether a subagent should be created;
- whether the task is synchronous or asynchronous;
- when a task should stop.

### Security

Determine:

- what data the agent can access;
- what tools it can call;
- whether personal information is involved;
- whether external networking is allowed;
- whether the task can modify data;
- whether human approval is required.

### Context management

Provide agents with:

- relevant ERP context;
- business rules;
- current state;
- historical context;
- organisational knowledge;
- previous troubleshooting results.

### Memory management

Control:

- what is remembered;
- where it is stored;
- how long it is retained;
- whether it is authoritative;
- whether it contains personal information.

### Evaluation

Determine:

- whether an answer is sufficiently reliable;
- whether evidence supports the conclusion;
- whether the recommendation conflicts with business rules;
- whether human approval is necessary.

### Continuous improvement

Manage:

- candidate skills;
- learned patterns;
- agent performance;
- failed recommendations;
- successful workflows;
- improvement proposals.

---

# 5. Layer 3 — Prime Agent Runtime

Prime Agent becomes a **private agent execution engine** beneath the Dial Kernel.

Prime Agent is particularly useful because its architecture provides:

- Recursive Language Models;
- persistent IPython execution;
- programmatic subagent invocation;
- executable Python skills;
- durable continual-harness state;
- background sessions;
- persistent goals;
- heartbeats;
- schedules;
- autonomous execution;
- agent-to-agent communication;
- JSON/RPC interfaces.

These capabilities are explicitly described in the current Prime Agent repository.

However, Prime Agent must be treated as an **untrusted execution engine from the perspective of Dial's business authority**.

Therefore:

```text
                 DIAL KERNEL
                      |
                 Security Gate
                      |
                Runtime Adapter
                      |
                PRIME AGENT
                      |
       +--------------+--------------+
       |              |              |
      RLM          Subagents       Skills
       |
    Python/IPython
```

Prime executes.

Dial decides.

---

# 6. Layer 4 — Development AI

A separate development deployment of Prime Agent should be used to help build Dial.

This deployment may have substantially greater privileges than production because it works against a development repository.

Recommended architecture:

```text
Developer
    |
    v
IDE / Terminal
    |
    +----------------+
    |                |
    v                v
Cursor/IDE       Prime Agent
                     |
          +----------+----------+
          |          |          |
       Coding    Architecture  Testing
       Agent       Agent        Agent
          |          |          |
          +----------+----------+
                     |
                     v
                Dial Codebase
```

Prime Agent is particularly suitable for:

- repository exploration;
- architectural analysis;
- code generation;
- debugging;
- test generation;
- refactoring;
- documentation;
- database migration review;
- security auditing;
- API analysis;
- dependency analysis;
- performance investigations;
- creating Dial skills;
- analysing previous development failures.

The current Prime Agent documentation explicitly positions it for coding and research workflows and allows it to work in the current project directory, run commands and modify files.

Development Prime Agent should therefore be considered a **development tool**, not part of the production SOR.

---

# 7. Samsung S24 Prime Agent Node

The Samsung Galaxy S24 running Termux becomes the initial **private Dial AI execution node**.

Conceptually:

```text
                    DIAL SERVER
                         |
                 Private connection
                         |
                         v
                SAMSUNG S24 / TERMUX
                         |
                 +-------+-------+
                 |               |
           Prime Agent       Dial Agent
             Runtime          Adapter
                 |
          +------+------+
          |             |
         RLM        Subagents
          |
       IPython
```

The S24 should be regarded as:

> **A private AI worker/execution node, not the authoritative backend.**

This distinction is extremely important.

---

# 8. Why the S24 Architecture Works

The S24 can provide:

- persistent Linux-like userland through Termux;
- Python execution;
- local filesystem;
- background processes;
- private networking;
- local model inference where practical;
- Prime Agent runtime;
- specialised Python skills;
- persistent agent state.

However, the S24 should initially be treated as a **development, experimental and private AI node**, not as the only production availability target.

Mobile devices have limitations involving:

- battery;
- thermal throttling;
- Android process lifecycle;
- memory pressure;
- network interruptions;
- storage;
- background execution;
- device availability;
- physical reliability.

Therefore the architecture must support moving the same Prime Agent runtime to a dedicated Linux server later.

The interface between Dial and Prime must consequently be network/service based rather than hard-coded around the S24.

---

# 9. Prime Runtime Adapter

Dial should not directly depend on Prime Agent's internal APIs.

Create a Dial abstraction:

```text
DialAgentRuntime
```

with operations conceptually equivalent to:

```text
startAgent()
resumeAgent()
pauseAgent()
executeTask()
delegateTask()
sendMessage()
getStatus()
getResult()
stopAgent()
```

Prime then implements:

```text
PrimeAgentRuntimeAdapter
```

Architecture:

```text
Dial Kernel
     |
     v
Dial Agent Runtime Interface
     |
     +------------------------+
     |                        |
     v                        v
Prime Agent Adapter      Future Runtime
     |                        |
     v                        v
Prime Agent              Alternative
```

This prevents Prime Agent from becoming a hard architectural dependency.

If Prime changes dramatically, Dial does not need to be rebuilt around its internals.

---

# 10. Prime Agent Should Never Have Direct Database Authority

This is one of the most important security decisions.

Do NOT configure:

```text
Prime Agent
    |
    +--> PostgreSQL superuser
```

Do:

```text
Prime Agent
    |
    v
Dial Kernel
    |
    v
Capability API
    |
    v
Authorised ERP Service
    |
    v
PostgreSQL
```

The agent should request a capability.

For example:

```text
inventory.read
production.analytics
maintenance.history.read
sales.analytics
supplier.performance.read
```

The Kernel determines whether the requesting agent has permission.

---

# 11. Tool and Capability Bus

Dial should implement a central Tool Registry.

Example:

```text
Dial Tool Registry

inventory.get_stock()
inventory.get_movements()
production.get_daily_output()
production.get_downtime()
maintenance.get_history()
maintenance.get_failure_patterns()
finance.get_cost_summary()
sales.get_margin_analysis()
procurement.get_supplier_performance()
hr.get_workforce_metrics()
analytics.detect_anomaly()
knowledge.search()
```

The AI does not receive SQL credentials.

Instead:

```text
Agent
 |
 | "I need production downtime"
 |
 v
Dial Tool Registry
 |
 v
production.get_downtime()
 |
 v
Authorised database query
 |
 v
Sanitised result
 |
 v
Agent
```

This is the core mechanism that makes the privacy model enforceable.

---

# 12. Personal Data Protection Architecture

The requirement is stronger than simply saying:

> "Don't send personal data to the AI."

It must be enforced technically.

The system should classify information into at least:

### Class A — Public

Information that may safely be exposed externally.

### Class B — Internal

Business information that should remain inside Dial.

### Class C — Sensitive

Information requiring additional permissions.

### Class D — Personal/Confidential

Personally identifiable information and highly sensitive organisational data.

Examples:

- employee identities;
- phone numbers;
- addresses;
- personal financial information;
- payroll;
- customer contact information;
- supplier contact information;
- personal identification documents.

Production AI should default to:

```text
External network = DENY
Personal data = DENY
Unapproved data export = DENY
```

---

# 13. Local-First Model Strategy

Because the requirement is that personal information must not leave Dial, the safest architecture is:

```text
Dial Database
      |
      v
Dial Kernel
      |
      v
Prime Agent
      |
      v
Local/private model
```

rather than:

```text
Dial Database
      |
      v
Prime Agent
      |
      v
Cloud LLM
```

If a cloud model is ever used, Dial must implement a formal **Data Egress Gateway**.

The gateway should:

1. inspect the payload;
2. classify data;
3. detect personal information;
4. remove prohibited fields;
5. reject prohibited requests;
6. log the decision;
7. require explicit policy permission.

The default should be **deny**.

---

# 14. Prime Agent Provider Independence

Prime Agent currently supports subscription/API-key providers and other provider configurations.

For Dial production, provider selection must be subordinate to Dial's privacy architecture.

Recommended hierarchy:

### Tier 1

Local model running on the S24.

### Tier 2

Private model server on infrastructure controlled by Dial.

### Tier 3

Private/internal inference server on the same trusted network.

### Tier 4

External model provider only for explicitly permitted, non-personal, appropriately sanitised information.

The production Kernel should therefore never assume:

```text
"LLM = external API"
```

Instead:

```text
LLM Provider Interface
        |
        +--- Local S24 Model
        |
        +--- Private Model Server
        |
        +--- Internal Model Cluster
        |
        +--- Approved External Provider
```

---

# 15. Specialised Dial Agents

Prime Agent should be used to build and execute specialised agents.

The initial registry should include:

## Diagnostic Agent

Purpose:

- troubleshoot ERP issues;
- identify anomalous behaviour;
- correlate logs;
- analyse system failures;
- recommend corrective actions.

It should not directly modify production configuration.

---

## Production Intelligence Agent

Purpose:

- analyse production;
- identify bottlenecks;
- analyse downtime;
- detect trends;
- forecast production;
- recommend improvements.

---

## Maintenance Intelligence Agent

Purpose:

- analyse equipment history;
- detect recurring failures;
- analyse downtime;
- recommend preventive maintenance;
- analyse spare-part consumption;
- identify reliability trends.

---

## Inventory Intelligence Agent

Purpose:

- identify slow-moving stock;
- identify stock-outs;
- identify excess stock;
- analyse consumption patterns;
- recommend reorder levels;
- identify abnormal movements.

---

## Commercial Intelligence Agent

Purpose:

- analyse sales;
- analyse margins;
- identify profitable products;
- identify unprofitable transactions;
- analyse quotation performance;
- recommend pricing strategies.

It should recommend pricing rather than automatically overwrite approved prices.

---

## Financial Intelligence Agent

Purpose:

- internal financial analysis;
- expense analysis;
- cash-flow analysis;
- cost analysis;
- anomaly detection;
- management reporting.

It must not independently post accounting transactions.

---

## Procurement Intelligence Agent

Purpose:

- supplier performance;
- purchase price analysis;
- lead-time analysis;
- procurement forecasting;
- supplier risk;
- purchase optimisation.

---

## Workforce/Technician Intelligence Agent

Purpose:

- internal productivity analysis;
- work-order completion analysis;
- training recommendations;
- maintenance performance analysis;
- skill-gap identification.

Because this domain involves personal information, access should be tightly controlled.

---

## ERP Improvement Agent

This is one of the most important agents.

Its purpose is to identify:

- inefficient workflows;
- repetitive user actions;
- failed processes;
- confusing UI;
- recurring errors;
- database bottlenecks;
- integration failures;
- opportunities for automation.

It generates:

```text
Improvement Proposal
```

rather than directly changing production.

---

# 16. Agent Composition

Agents should be composable.

For example:

```text
User:
"Why did production fall last month?"

              |
              v
       Operations Agent
              |
      +-------+-------+
      |       |       |
      v       v       v
Production  Maintenance  Inventory
 Agent       Agent        Agent
      |       |       |
      +-------+-------+
              |
              v
        Root Cause Agent
              |
              v
       Evidence Report
```

Prime's recursive subagent architecture is well suited to this pattern. Its `rlm(...)` mechanism can create child agents and programmatically combine their results.

The Dial Kernel should still control:

- which agents may collaborate;
- what information they receive;
- how long they run;
- whether they may create additional agents;
- their resource budget.

---

# 17. Agent Sandboxing

Prime Agent itself explicitly states that its worker/kernel processes are **not a security sandbox** and that model-generated Python and project commands run with user permissions.

Therefore Dial production must add its own isolation.

Every production agent should receive:

```text
Agent Sandbox
 |
 +-- Tool permissions
 +-- Dataset permissions
 +-- Memory permissions
 +-- Network permissions
 +-- Execution limits
 +-- Time limits
 +-- Token limits
 +-- Write permissions
 +-- Personal-data policy
```

For example:

```yaml
agent: maintenance_agent

permissions:
  equipment.read: true
  maintenance.read: true
  inventory.spares.read: true
  production.analytics: true

write:
  maintenance.recommendation.create: true

financial:
  access: false

payroll:
  access: false

external_network:
  access: false

personal_data:
  access: restricted
```

---

# 18. Prime Skills Become Dial Skills

Prime Agent's executable skills are an important architectural feature.

Dial should create a controlled skill registry.

Example:

```text
dial-skills/
    production/
        analyse-downtime/
        production-forecast/
        capacity-analysis/

    maintenance/
        failure-analysis/
        spare-analysis/
        preventive-maintenance/

    commercial/
        margin-analysis/
        quote-analysis/
        pricing-analysis/

    inventory/
        demand-analysis/
        reorder-analysis/
        stock-anomaly/

    system/
        log-analysis/
        performance-analysis/
        security-audit/
```

Each skill should contain:

```text
skill metadata
required permissions
allowed data
inputs
outputs
execution limits
validation rules
version
owner
confidence
test cases
```

Skills should be versioned.

---

# 19. Continuous Learning Architecture

Dial should not allow uncontrolled self-modification.

Instead:

```text
Operational Data
       |
       v
Pattern Detection
       |
       v
Candidate Insight
       |
       v
Evidence Validation
       |
       v
Confidence Assessment
       |
       v
Candidate Knowledge
       |
       v
Evaluation
       |
       v
Approved Knowledge
```

This creates a distinction between:

### Observation

"What happened?"

### Hypothesis

"Why might it have happened?"

### Recommendation

"What should we do?"

### Learned rule

"This pattern repeatedly predicts X."

### Authoritative business rule

"This is an approved Dial business rule."

These must never be conflated.

---

# 20. Three Memory Classes

## Operational Memory

Current state.

Examples:

- current stock;
- current production;
- current equipment status;
- current open work orders.

This should primarily remain in the ERP/SOR.

---

## Episodic AI Memory

What the AI previously investigated.

Examples:

- previous troubleshooting;
- previous recommendations;
- previous diagnostic reasoning;
- previous simulations;
- outcomes of recommendations.

This can live in an AI memory store but must reference authoritative ERP records rather than replacing them.

---

## Organisational Knowledge

Validated patterns and reusable knowledge.

Examples:

```text
"Machine type X operating under condition Y
has historically experienced failure Z."

"Supplier A historically has a longer lead time
than the configured nominal lead time."

"Product category B experiences seasonal demand."
```

This knowledge should have:

```text
source
evidence
confidence
created_at
validated_at
version
status
```

---

# 21. Prime's Continual Harness and Dial Learning

Prime Agent's continual harness is particularly valuable as an architectural reference.

Prime describes the harness as storing:

- supplemental prompts;
- memories;
- skill descriptions;
- reusable subagent specifications;

and allowing evidence-backed refinement with recorded snapshots/rollback.

Dial should adapt this idea.

Instead of allowing arbitrary AI self-modification:

```text
Prime / Agent
      |
      v
Candidate Lesson
      |
      v
Dial Evaluation Engine
      |
      +--> accepted
      |
      +--> rejected
      |
      +--> needs review
      |
      v
Versioned Dial Knowledge
```

Every learned improvement should therefore be:

- reviewable;
- versioned;
- attributable;
- reversible;
- testable.

---

# 22. Self-Learning Must Be Evidence-Based

The system should never learn:

> "The AI thinks this is true."

It should learn:

> "Repeated ERP observations support this conclusion with a defined confidence."

For example:

```text
Observation count: 47
Historical failures: 12
Pattern occurrence: 9
Correlation confidence: 87%
Recommendation success rate: 81%
Status: Candidate Knowledge
```

This is substantially safer than unrestricted model self-modification.

---

# 23. Agent Evaluation Engine

Dial should maintain an evaluation framework.

Each agent should be measured on:

- accuracy;
- usefulness;
- false-positive rate;
- false-negative rate;
- recommendation success;
- user acceptance;
- time saved;
- cost saved;
- data-policy violations;
- hallucination rate;
- tool-call efficiency.

Example:

```text
Maintenance Agent

Diagnosis accuracy       87%
Recommendation success  78%
False positives          9%
Average response time    14 s
Human overrides          12%
Policy violations        0
```

The Kernel can use these metrics to determine whether an agent should be:

```text
ACTIVE
LIMITED
UNDER_REVIEW
DISABLED
```

---

# 24. The Improvement Loop

The complete self-improvement cycle should be:

```text
             ERP ACTIVITY
                   |
                   v
             Event Stream
                   |
                   v
            Analytics Engine
                   |
                   v
            Pattern Detection
                   |
                   v
             Agent Analysis
                   |
                   v
             Candidate Insight
                   |
                   v
              Simulation
                   |
                   v
              Evaluation
                   |
          +--------+--------+
          |                 |
       SUCCESS           FAILURE
          |                 |
          v                 v
   Candidate Knowledge   Rejection
          |
          v
      Validation
          |
          v
   Approved Knowledge
          |
          v
   Improved Agent/Skill
```

This creates the **continuous learning journey of Dial** without allowing uncontrolled self-modification.

---

# 25. Simulation Before Operational Change

The AI should increasingly use simulation before making recommendations.

For example:

```text
Current stock policy
       |
       v
Simulation
       |
       +-- scenario A
       +-- scenario B
       +-- scenario C
       |
       v
Compare outcomes
       |
       v
Recommendation
```

Similarly:

```text
Maintenance interval:
500 h
      |
      +-- simulate 400 h
      +-- simulate 450 h
      +-- simulate 500 h
      +-- simulate 600 h
      |
      v
Expected failure/cost analysis
```

Prime's persistent Python environment makes it useful for computational experimentation and data analysis, but the resulting simulations remain **decision-support outputs**, not authoritative ERP transactions. Prime's RLM architecture explicitly uses persistent Python/IPython as its programmatic environment.

---

# 26. Human Approval Gates

Certain operations should always require human approval.

Examples:

- accounting postings;
- payroll changes;
- employee disciplinary actions;
- inventory write-offs;
- major price changes;
- customer credit changes;
- supplier changes;
- deletion of records;
- production configuration;
- system configuration;
- deployment of production code.

The AI should instead produce:

```text
Recommendation
+
Evidence
+
Expected Impact
+
Confidence
+
Risks
+
Proposed Action
```

Then:

```text
Human
   |
Approve / Reject / Modify
   |
   v
Dial ERP
```

---

# 27. AI Should Be Read-Heavy and Write-Light

The default production posture should be:

```text
READ       ALLOWED
ANALYSE    ALLOWED
SIMULATE   ALLOWED
RECOMMEND  ALLOWED
LEARN      CONTROLLED

WRITE      RESTRICTED
DELETE     DENIED
DEPLOY     DENIED
ALTER SOR  CONTROLLED
```

This makes the AI an **intelligence layer rather than an uncontrolled automation layer**.

---

# 28. S24 Communication Architecture

The S24 should not expose Prime Agent directly to the public internet.

Instead:

```text
Internet
   X
   |
Firewall
   |
Dial Backend
   |
Authenticated Private Channel
   |
Samsung S24
   |
Termux
   |
Prime Agent
```

The Prime endpoint should preferably be:

- private;
- authenticated;
- encrypted;
- allow-listed;
- rate limited;
- monitored.

The S24 should initiate the outbound connection where practical rather than exposing an arbitrary inbound service.

A secure persistent tunnel can therefore be preferable to opening a public Prime Agent port.

---

# 29. S24 Failure Must Not Affect the ERP SOR

This is another mandatory architectural property.

If the S24 dies:

```text
Prime Agent DOWN
       |
       X
       |
Dial ERP
       |
       v
CONTINUES OPERATING
```

The ERP must remain functional.

Users may temporarily lose:

- AI analysis;
- troubleshooting;
- recommendations;
- background learning.

But they must never lose:

- transactions;
- inventory;
- accounting;
- authentication;
- ERP records;
- business workflows.

Therefore:

> **AI failure must degrade intelligence, not core ERP availability.**

---

# 30. AI Availability Model

The system should behave like this:

```text
             DIAL ERP
                |
        +-------+-------+
        |               |
   Core Services     AI Services
        |               |
     Required        Optional
        |               |
     Always up       Can fail
```

This is one of the strongest arguments for keeping Prime Agent outside the SOR.

---

# 31. Supabase Integration

Supabase should continue handling:

- authentication;
- PostgreSQL;
- Row Level Security;
- storage;
- realtime functionality;
- normal APIs;
- transactional operations;
- Edge Functions for short-lived tasks.

Supabase's current documentation explicitly describes Edge Functions as short-lived server-side TypeScript/Deno functions and recommends moving heavy long-running jobs to background workers.

The hosted platform also has finite function duration/resource limits.

Therefore:

```text
Supabase Edge Function
       |
       v
Create AI Job
       |
       v
AI Job Queue
       |
       v
Dial Kernel
       |
       v
Prime Agent / S24
```

The Edge Function does not attempt to host the persistent Prime runtime.

---

# 32. Self-Hosted Supabase

If Dial is self-hosted, Supabase itself can be deployed using Docker. Supabase documents Docker as its standard self-hosting approach.

The eventual infrastructure could therefore become:

```text
PRIVATE DIAL INFRASTRUCTURE

+---------------------------------------------------+
|                                                   |
|                  Dial Network                     |
|                                                   |
|  +-------------+       +----------------------+  |
|  | Supabase    |       | Dial AI Kernel       |  |
|  |             |       |                      |  |
|  | PostgreSQL  |<----->| Agent Manager        |  |
|  | Auth        |       | Policy Engine        |  |
|  | API         |       | Tool Registry        |  |
|  +-------------+       | Memory               |  |
|                        +----------+-----------+  |
|                                   |              |
+-----------------------------------|--------------+
                                    |
                         Secure private channel
                                    |
                                    v
                            Samsung S24
                              Termux
                                |
                          Prime Agent
```

The S24 is therefore an extension of the trusted AI environment, not a separate SaaS provider.

---

# 33. Repository Structure

A recommended Dial repository:

```text
dial/
│
├── apps/
│   ├── android/
│   ├── web/
│   └── admin/
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   └── policies/
│
├── packages/
│   ├── dial-core/
│   ├── dial-domain/
│   ├── dial-ai-kernel/
│   ├── dial-agent-sdk/
│   ├── dial-agent-runtime/
│   ├── dial-tools/
│   ├── dial-memory/
│   ├── dial-learning/
│   ├── dial-evaluation/
│   └── dial-security/
│
├── agents/
│   ├── diagnostic/
│   ├── production/
│   ├── maintenance/
│   ├── inventory/
│   ├── commercial/
│   ├── finance/
│   ├── procurement/
│   └── improvement/
│
├── skills/
│   ├── analytics/
│   ├── diagnostics/
│   ├── simulation/
│   └── reporting/
│
├── prime-runtime/
│   ├── adapter/
│   ├── config/
│   ├── skills/
│   └── deployment/
│
├── policies/
│   ├── data-classification/
│   ├── agent-permissions/
│   ├── network/
│   └── approval/
│
└── infrastructure/
    ├── docker/
    ├── networking/
    └── monitoring/
```

---

# 34. Development vs Production Prime Agent

There should be two distinct Prime deployments.

## Development Prime

Purpose:

- build Dial;
- modify source code;
- run tests;
- inspect repositories;
- research architecture;
- generate skills;
- diagnose development problems.

Potentially broad permissions.

---

## Production Prime

Purpose:

- ERP troubleshooting;
- internal analytics;
- recommendation generation;
- simulations;
- knowledge extraction;
- controlled learning.

Strict permissions.

They should not share unrestricted state.

---

# 35. Prime Agent Is Not the Dial Kernel

This distinction must remain explicit throughout implementation.

```text
PRIME AGENT

Execution engine
RLM
Python
Subagents
Skills
Persistent sessions
Background execution
```

versus:

```text
DIAL KERNEL

Security
Permissions
Agent registry
Business context
Memory policy
Data policy
Tool authorization
Learning governance
Evaluation
Approval
Audit
```

Prime should be replaceable.

The Dial Kernel should not be.

---

# 36. Prime Agent Is Not the SOR

The formal architecture rule should be:

> **No Prime Agent state may be required for the correctness of an ERP transaction.**

If Prime disappears, Dial must still know:

- what stock exists;
- what invoices exist;
- what payments exist;
- what employees exist;
- what orders exist;
- what assets exist;
- what production occurred.

Those facts live in the SOR.

Prime may remember:

> "I previously analysed this machine and found a recurring failure pattern."

But the underlying machine history remains in Dial.

---

# 37. Prime Agent Is Not the Business Rule Authority

The same principle applies to business logic.

Example:

Prime may recommend:

```text
"Reorder level should probably be increased."
```

But the authoritative rule remains:

```text
inventory.reorder_level
```

inside Dial.

AI can recommend a change.

Dial determines whether the change becomes official.

---

# 38. Prime Agent's Role in Continuous Improvement

Prime should be particularly valuable in four continuous-improvement loops.

## Loop A — Business Improvement

```text
ERP data
   ↓
Pattern
   ↓
AI analysis
   ↓
Recommendation
   ↓
Simulation
   ↓
Management decision
```

## Loop B — Agent Improvement

```text
Agent result
   ↓
Evaluation
   ↓
Failure analysis
   ↓
Candidate skill/prompt improvement
   ↓
Testing
   ↓
New version
```

## Loop C — ERP Improvement

```text
User behaviour
   ↓
Workflow analysis
   ↓
Bottleneck detection
   ↓
Improvement proposal
   ↓
Development task
   ↓
Testing
   ↓
Release
```

## Loop D — Developer Improvement

```text
Codebase
   ↓
Prime development agent
   ↓
Tests / analysis
   ↓
Improvement
   ↓
Pull request / review
   ↓
Production
```

---

# 39. AI Improvement Must Not Become AI Authority

The fundamental philosophy is:

```text
AI observes
     ↓
AI analyses
     ↓
AI proposes
     ↓
AI tests/simulates
     ↓
Human/System validates
     ↓
Dial adopts
```

Not:

```text
AI observes
     ↓
AI decides
     ↓
AI changes ERP
```

---

# 40. Recommended Initial Implementation Phases

## Phase 1 — Development Prime

Install Prime Agent on the development environment.

Create:

- Dial development harness;
- architecture instructions;
- coding skills;
- testing skills;
- security skills;
- documentation skills.

Goal:

**Use Prime to help build Dial.**

---

## Phase 2 — S24 Prime Node

Install Termux and the Prime Agent runtime on the S24.

Establish:

- private network;
- secure authentication;
- process supervision;
- persistent storage;
- logging;
- controlled startup;
- battery optimisation configuration;
- network recovery;
- health checks.

Goal:

**Create a private AI worker without connecting it directly to the SOR.**

---

## Phase 3 — Dial Agent Adapter

Build:

```text
DialAgentRuntime
PrimeAgentRuntimeAdapter
```

Goal:

**Dial can launch and communicate with Prime without depending on Prime internals.**

---

## Phase 4 — Dial Tool Bus

Implement:

```text
Tool Registry
Capability Registry
Permission Engine
Data Classification
```

Goal:

**Prime receives business capabilities instead of database credentials.**

---

## Phase 5 — First Specialist Agents

Start with:

1. Diagnostic Agent
2. Analytics Agent
3. Maintenance Agent
4. Production Agent
5. Inventory Agent
6. ERP Improvement Agent

Do not initially grant autonomous write privileges.

---

## Phase 6 — Memory

Implement:

```text
Operational context
Episodic AI memory
Organisational knowledge
```

with strict separation from the SOR.

---

## Phase 7 — Learning Engine

Implement:

```text
Observation
→ Hypothesis
→ Recommendation
→ Evaluation
→ Candidate Knowledge
→ Approval
→ Versioned Knowledge
```

---

## Phase 8 — Simulation

Introduce:

- what-if analysis;
- forecasting;
- optimisation;
- scenario comparison;
- recommendation simulation.

---

## Phase 9 — Controlled Automation

Only after sufficient evaluation should selected agents receive limited write capabilities.

Even then:

```text
Agent
 ↓
Policy
 ↓
Validation
 ↓
Approval where necessary
 ↓
ERP API
 ↓
SOR
```

---

# 41. Long-Term Architecture

The mature Dial platform should eventually resemble:

```text
                         DIAL
                          |
          +---------------+---------------+
          |                               |
      ERP CORE                       AI PLATFORM
          |                               |
       SOR                           DIAL KERNEL
          |                               |
          |                  +------------+------------+
          |                  |            |            |
          |                Agents       Memory      Learning
          |                  |            |            |
          |                  +------------+------------+
          |                               |
          |                         Tool Registry
          |                               |
          |                       Runtime Adapter
          |                               |
          |                         PRIME AGENT
          |                               |
          |              +----------------+----------------+
          |              |                |                |
          |             RLM           Subagents          Skills
          |              |
          |          Python/IPython
          |
          +-----------------------------------------------+
```

---

# 42. Final Architectural Principles

The following principles should become permanent Dial architecture rules.

### Principle 1 — SOR supremacy

PostgreSQL/Dial remains the authoritative source of ERP truth.

### Principle 2 — Prime is never SOR

Prime Agent state, memory and conclusions never replace ERP records.

### Principle 3 — Kernel supremacy

The Dial Kernel controls production AI permissions and orchestration.

### Principle 4 — Capability over credentials

Agents receive tools and capabilities, not unrestricted database credentials.

### Principle 5 — Private by default

Production AI should operate entirely inside the trusted Dial environment.

### Principle 6 — No personal-data export

Personal information must not leave the controlled Dial environment.

### Principle 7 — Local-first inference

Local/private models should be preferred for production AI.

### Principle 8 — AI failure must not break ERP

If Prime or the AI subsystem fails, Dial ERP continues operating.

### Principle 9 — Recommendations before automation

AI should initially recommend rather than autonomously modify authoritative state.

### Principle 10 — Evidence before learning

The AI learns only from validated evidence and measurable outcomes.

### Principle 11 — Version everything

Skills, knowledge, policies, agent definitions and learning improvements must be versioned.

### Principle 12 — Reversible learning

Every learned change must be reviewable and reversible.

### Principle 13 — Prime remains replaceable

Dial's Kernel must not become structurally dependent on Prime Agent internals.

### Principle 14 — Development and production are separate trust domains

Development Prime may have repository-level permissions; Production Prime must have controlled ERP capabilities.

### Principle 15 — Intelligence is additive

AI enhances Dial's capabilities but does not become the foundation upon which core transactional correctness depends.

---

# 43. Target Outcome

The ultimate objective is not to build:

> "An ERP with a chatbot."

The objective is to build:

> **An ERP with an internal intelligence system capable of continuously understanding, analysing, troubleshooting, simulating, learning from and recommending improvements to the organisation—without surrendering control of its information or authoritative business state to an external AI service.**

Prime Agent is valuable because its RLM, persistent execution, recursive subagents, skills, durable harness, background sessions and continual-improvement mechanisms provide much of the **agent execution machinery** needed to pursue this vision.

Dial must provide the parts Prime does not own:

```text
                    DIAL
                     |
              +------+------+
              |             |
           ERP/SOR       AI Kernel
              |             |
              |       +-----+-----+
              |       |           |
              |    Security     Memory
              |       |           |
              |       +-----+-----+
              |             |
              |        Agent Registry
              |             |
              |        Tool Registry
              |             |
              |       Learning Engine
              |             |
              |       Prime Adapter
              |             |
              +-------------+
                            |
                       PRIME AGENT
                            |
                    RLM / Skills /
                    Subagents /
                    Persistent
                    Execution
                            |
                       S24 / Termux
```

**In this architecture, Prime Agent is the engine—not the driver, not the database, not the ERP, and not the authority.**

The **Dial Kernel is the driver**.

The **Dial ERP/SOR is the authority**.

The **Prime Agent S24 node is the private execution worker**.

The **AI learning system is the mechanism for continuous improvement**.

And the entire system is designed so that Dial can eventually replace the S24 with a dedicated private Linux worker, multiple AI workers or a local AI cluster without redesigning the ERP itself.