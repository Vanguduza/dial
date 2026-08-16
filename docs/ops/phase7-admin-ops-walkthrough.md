# Phase 7 — Admin A–P ops walkthrough (not G7)

**Status:** Launch-critical queue Playwright recon **green** (30 PNGs). CC Simulated watermark + payout blocked evidenced. Module K (HR/Payroll-ZW) **CERTIFIED–DORMANT** with explicit shell on `/admin/hr`. **G7 open** until full A–P walkthrough sign-off (modules B–P beyond launch-critical subset).

## Launch-critical queues (G7 anti-stub)

| Module | Route | Evidence |
| --- | --- | --- |
| E Orders | `/admin/orders` | `admin-orders-queue` |
| H Money | `/admin/money/escrow` | `admin-escrow-sandbox` |
| I FDMS | `/admin/fdms` | `admin-fdms-day-ops` |
| E Dispatch | `/admin/delivery/dispatch` | MapLibre assignment board |
| B Factory | `/admin/catalogue/factory` | REST queue refresh |
| J Disputes | `/admin/disputes` | `admin-disputes-queue` |
| L Legal T&Cs | `/admin/compliance/legal` | versioned terms + acceptance |
| A Command Centre | `/admin/command-centre` | Simulated watermark; `autoPay=false` |
| K HR | `/admin/hr` | **DORMANT** banner (founder sign-off) |

## Run recon

Prereq: gateway `:3000`, `INTERNAL_API_SECRET` in root `.env` (never log values).

```bash
pnpm --filter @dial/gateway-web exec node --import tsx scripts/g7-admin-ops-recon.mts
```

Output: `docs/ops/evidence/g7/g7-admin-ops-recon.json` + PNGs per queue × viewport (desktop/tablet/small).

## Checklist sign-off table (ticket)

| Queue | Desktop | Tablet | Mobile | Durable refresh | Sign-off |
| --- | --- | --- | --- | --- | --- |
| Orders | walked | walked | walked | INTERNAL_API_SECRET | walked |
| Escrow | walked | walked | walked | | walked |
| FDMS day | walked | walked | walked | | walked |
| Dispatch | walked | walked | walked | | walked |
| Factory | walked | walked | walked | | walked |
| Disputes | walked | walked | walked | | walked |
| Legal T&Cs | walked | walked | walked | | walked |
| Command Centre | walked | walked | walked | Simulated watermark + payout blocked | walked |
| Module K dormant | walked | walked | walked | explicit DORMANT | **signed** |

Fill from `g7-admin-ops-recon.json` → `checklistSignOff` after green recon run.
