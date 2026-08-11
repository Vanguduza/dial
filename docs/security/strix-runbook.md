# Strix staging runbook (D-48)

Executable procedure for [usestrix/strix](https://github.com/usestrix/strix) (Apache-2.0) against **authorized DIAL staging only**. Complements Semgrep/Checkov and **does not** replace D-47 IDOR/RLS CI, Appendix A.1 webhook tests, or Appendix C compliance gates.

Canonical toolchain: [`DIAL_Security_Toolchain.md`](../../DIAL_Security_Toolchain.md). Workflow: [`.github/workflows/strix-staging.yml`](../../.github/workflows/strix-staging.yml).

---

## 1. Preconditions

| Requirement | Notes |
| --- | --- |
| Written authorisation | Only systems DIAL owns or has permission to test |
| Staging URL | Ephemeral or long-lived **staging** — not production gateway, not live PSP/FDMS |
| Docker | Required for Strix sandboxes (local or runner) |
| BYOK LLM | `STRIX_LLM` + `LLM_API_KEY` (or provider-equivalent); prefer alignment with DIAL AI policy (e.g. Gemini via LiteLLM) — still **out of** `packages/ai` product brain |
| No production secrets | Never put live Paynow/ContiPay/EcoCash/PayPal/FDMS/WA tokens in the Strix job env |
| CI gate | Repository Actions variable `STRIX_ENABLED=true` before the workflow will install/run Strix |

### Explicitly out of scope

- Production Job Reserve / ledger / customer PII stores  
- Live Meta WhatsApp Cloud API production numbers  
- Real FDMS activation / fiscal production endpoints  
- Third-party production hosts (PayPal, bank, Meta) as `--target`

---

## 2. Secrets & variables

Configure on the GitHub repo (or local shell) — **names only** here:

| Name | Where | Purpose |
| --- | --- | --- |
| `STRIX_LLM` | Actions secret / env | LiteLLM-style model id, e.g. `gemini/gemini-2.0-flash` |
| `LLM_API_KEY` | Actions secret / env | Provider API key for BYOK |
| `LLM_API_BASE` | Optional | Local OpenAI-compatible base (Ollama, etc.) |
| `STRIX_ENABLED` | Actions **variable** | Must be `true` for CI to run the scan (fail-closed otherwise) |

Do **not** invent or commit values. Do **not** print `.env*`.

---

## 3. Local install & first scan

```bash
# Install CLI (needs Docker running)
curl -sSL https://strix.ai/install | bash

export STRIX_LLM="gemini/gemini-2.0-flash"   # example — use your BYOK provider
export LLM_API_KEY="…"                       # never commit

# Staging URL only — replace with real staging host when available
strix -n \
  --target "https://staging.example.invalid" \
  --scan-mode quick \
  --instruction "Focus on IDOR, authZ bypass, and webhook signature abuse. No production PSP/FDMS."
```

Scan modes: `quick` (CI-ish), `standard`, `deep` (pre-release). Non-interactive `-n` exits non-zero when vulnerabilities are reported — suitable for release-train gates later.

White-box (optional, still staging-oriented):

```bash
strix -n --target ./ --scan-mode quick --instruction "Focus on AuthZ helpers and webhook verify*."
```

---

## 4. GitHub Actions (`workflow_dispatch`)

1. Ensure secrets `STRIX_LLM` and `LLM_API_KEY` exist (workflow **fails** if missing — no silent stub success).  
2. Set repository variable `STRIX_ENABLED=true` when staging is real.  
3. Actions → **strix-staging** → Run workflow:  
   - `target`: `https://<your-staging-host>`  
   - `scan_mode`: `quick` \| `standard` \| `deep`  
   - `instruction`: optional focus string  
4. Workflow rejects production-like hostnames and common third-party PSP/Meta hosts heuristically.

Until staging exists: leave `STRIX_ENABLED` unset; dispatch still fails closed after secret checks with a pointer to this runbook (not a green echo).

---

## 5. What to file as findings

Open issues / hardening tickets for **validated** items, especially:

| Class | File when |
| --- | --- |
| IDOR / BOLA | Object access without ownership check (`jobs`, `orders`, `vehicles`, `promo_credits`, `delivery_*`) |
| AuthZ bypass | Role/identity taken from body/query; missing `assertResourceAccess` |
| Webhook abuse | Accept without signature or idempotency |
| Injection | SQLi / command injection with PoC |
| Secret exposure | Client-visible `service_role` / PSP / WA / FDMS material |

**Do not** treat Strix output as clearing:

- Pack Appendix A.1 deterministic webhook/IDOR tests  
- RLS policy CI  
- Appendix C / §8.1 legal-ops gates  
- Money SoR / FDMS compliance

Tag findings with `d-48` / `strix` and link the staging URL + scan mode (no secrets in tickets).

---

## 6. Never against production

| Do | Don't |
| --- | --- |
| Staging / ephemeral preview URLs | Production API or admin |
| Test PSP / sandbox keys | Live escrow / Job Reserve |
| Synthetic users | Real customer data dumps |
| Stop on unexpected prod routing | “Just one quick prod check” |

If a scan might reach production money rails, **abort** and rotate any exposed staging credentials.

---

## 7. Relation to other D-48 tools

```text
Threat Dragon (planning) → Semgrep dial rules (PR hard-fail) → Checkov HIGH+ (PR)
                         → Renovate (deps) → Strix (this runbook, staging only)
```

Agent audits remain in `docs/agent-audits/` + `.cursor/skills/dial-*`.
