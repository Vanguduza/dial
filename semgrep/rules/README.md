# DIAL Semgrep custom rules (D-48)

In-repo rules for D-47 hygiene. Wired by `.github/workflows/semgrep.yml` job **`semgrep-dial`** (hard-fail).

| Rule ID | Intent |
| --- | --- |
| `dial.no-body-identity` | No AuthZ from body/query `userId` / `email` / `role` |
| `dial.no-client-secrets` | No `NEXT_PUBLIC_` / `VITE_` secret patterns |
| `dial.webhook-missing-signature-verify` | Heuristic: webhook handlers should verify signatures |
| `dial.no-unofficial-whatsapp` | Ban `baileys` / `whatsapp-web.js` (D-40) |
| `dial.no-raw-sql-concat` | Ban dangerous raw SQL string concat |

Run locally:

```bash
semgrep scan --config semgrep/rules --error --metrics=off .
```

Community packs (`p/typescript`, etc.) run in a separate advisory job and do not soft-fail the dial gate.
