# Phase 6 — Tech / jobs dogfood (not G6)

**Status:** Checklist 42 seeds + web book/emergency green; technician Android HTTP contract + Kotlin unit tests green. **G6 open** — device PNG blocked on G3 signing.

## Evidence paths

| Layer | Artifact | Gate |
| --- | --- | --- |
| **T** | `phase6PrepOps.test.ts` — 42 seeds, book, emergency, capability audit citation | prep |
| **T** | `DialTechnicianClientTest.kt` — full checklist→evidence→ITF263→Take-Home | prep |
| **S** | `g6-technician-android-dogfood.mts` → `docs/ops/evidence/g6/technician-android-dogfood.json` | prep |
| **A** | Technician Android device screenshot / signed build | **open** (G3 signing) |
| **D-56** | `docs/agent-audits/ai-capability-G6-intake-2026-08-16.md` | prep |

## Run (gateway on :3000)

```bash
pnpm --filter @dial/gateway-web test -- src/lib/tech/phase6PrepOps.test.ts
cd apps/technician-android && ./gradlew :core:network:test
pnpm --filter @dial/gateway-web exec node --import tsx scripts/g6-technician-android-dogfood.mts
```

Start gateway with root `.env`: `pnpm --filter @dial/gateway-web exec node --import tsx scripts/dev-with-root-env.mts`

## G6 exit still requires

- Tech Android **device** checklist+evidence PNG (Play internal / emulator signed — G3)
- Full T+P+S+**A** evidence bundle per Completion Plan anti-stub
