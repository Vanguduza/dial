# Key-drop-in readiness matrix

**Standing:** Founder supplies secrets later. Eng shapes must be complete so **plugging Pack §6 / `.env.example` keys requires zero further coding**. Rule: `.cursor/rules/dial-key-drop-in.mdc`. Overview: [README.md](./README.md). Complements ENH-030 + Completion Plan anti-stub (fail-closed ≠ done, but shapes must be key-ready).

**Mode:** `DIAL_INTEGRATION_MODE=fixture|sandbox|live`. Sandbox defaults to inline vendor shapes unless `*_SANDBOX_HTTP=1` (documented in `.env.example`).

| Group | Shape ready? | Fail-closed? | Docs URL | Residual gap |
| --- | --- | --- | --- | --- |
| paynow | **yes** | yes | [Paynow initiate](https://developers.paynow.co.zw/docs/paynow/initiate_transaction/) · [hash](https://developers.paynow.co.zw/docs/paynow/generating_hash/) | Ops fill `PAYNOW_*`; optional RESULT_URL path alias |
| contipay | **yes** | yes | Stitch §2 REST shape (`api-sandbox.contipay.co.zw`) | Merchant approval / live contract; not Spare G2 CTA (EcoCash\|COD) |
| ecocash | **yes** | yes | [developers.ecocash.co.zw](https://developers.ecocash.co.zw) (sandbox base in adapter) | **G2 eng-exception:** pretend Pack §6 keys → `eco_sb_*` (`docs/ops/ecocash-pretend-sandbox.md`); portal keys + `ECOCASH_SANDBOX_HTTP=1` for real HTTP; live still founder |
| paypal | **yes** | yes | [Orders v2](https://developer.paypal.com/docs/api/orders/v2/) · [webhooks](https://developer.paypal.com/api/rest/webhooks/rest/) | Not Spare G2 required CTA; webhook→ledger bridged |
| escrow | **yes** | yes | Partner HTTP `/v1/holds` (Pack / Stitch) | Live partner **ENH-020**; sandbox inline `escrow_sb_*` when Pack §6 set + `PSP_ESCROW_SANDBOX_HTTP` unset |
| fdms | **yes** | yes | In-house Virtual Gateway (D-59); ZIMRA field-map **ENH-022** | Ops device credentials; `FDMS_SANDBOX_HTTP=1` for outbound |
| meili | **yes** | yes | [Meilisearch docs](https://www.meilisearch.com/docs) | Compose defaults; Factory via indexer + `runPhase4PrepFactoryCsvPublishThinVertical`; local Meili may be down |
| maps | **yes** | yes | [Nominatim](https://nominatim.org/release-docs/latest/api/Search/) · [OSRM](http://project-osrm.org/docs/v5.24.0/api/#route-service) · [VROOM](https://github.com/vroom-project/vroom/blob/master/docs/API.md) | **ENH-013 local compose** (`docker-compose.maps.yml` + `pnpm maps:prepare`); DialMap on admin/customer track; live mbtiles still ops if Planetiler extract missing |
| supabase | **yes** | yes | [GoTrue / Auth](https://supabase.com/docs/reference/javascript/auth-signinwithpassword) | Pack §7 migrations `0000`–`0015`; `pnpm db:migrate` + CI `durable-schema`; sandbox/live **reads** hydrate from PostgREST (`get*Durable`) |
| temporal | **yes** | yes | [Temporal docs](https://docs.temporal.io/) · ops [`workers-temporal-redis.md`](../ops/workers-temporal-redis.md) | Probe + `startDeliveryDispatch` fail-closed without address/`INTERNAL_API_SECRET`; **G5** needs real Temporal history |
| redis | **yes** | yes | [Redis](https://redis.io/docs/latest/) / BullMQ · ops [`workers-temporal-redis.md`](../ops/workers-temporal-redis.md) | Compose `REDIS_URL`; Factory publish via indexer needs Redis in sandbox |
| whatsapp | **yes** | yes | [Cloud API webhooks](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/) · [mark read](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/mark-message-as-read) | Gateway `phase9PrepOps.test.ts`: 11 Flow registry + checkout buttons; Meta template IDs **ENH-021**; `WA_SANDBOX_HTTP=1` for Graph |
| internal | **yes** | yes | Pack §6 `INTERNAL_API_SECRET` | Heartbeat escalation notify + Temporal start + admin confirm-SLA board |
| litellm | **yes** | yes | [LiteLLM](https://docs.litellm.ai/) → Gemini (D-61) | Optional until AI paths exercised; Command Centre `autoPay=false` |
| grocery (P10 prep) | **yes** | yes | Branch plan food path; Meili `grocery_offers_v1`; `phase10PrepOps.test.ts` | Food spine `g10Claimed=false`; B2B informal hide; **no liquor**; G10 after G5/G8 |
| tech checklists (P6 prep) | **42 seeds + HTTP dogfood** | n/a | `DIAL_Diagnostic_Checklist_Library.md` · [`phase6-tech-jobs-dogfood.md`](../ops/phase6-tech-jobs-dogfood.md) | `phase6PrepOps.test.ts` + `g6-technician-android-dogfood.mts`; **G6** device PNG open (G3) |
| admin launch queues (P7 prep) | **recon script** | n/a | [`phase7-admin-ops-walkthrough.md`](../ops/phase7-admin-ops-walkthrough.md) | 9 launch-critical queues × 3 viewports; **G7** full A–P still open |
| native gateway (P3 prep) | **yes** | n/a | `docs/ops/phase3-native-store-readiness.md` + `phase3-store-listing-drafts.md` | Android flavors + iOS GatewayBaseUrl; G2 eng-exception sequences Phase 3 eng; **not G3** until store evidence |
| delivery Temporal (P5 prep) | **yes** | yes | `docs/ops/phase5-delivery-temporal-dogfood.md` · maps [`maps-tier2-compose.md`](../ops/maps-tier2-compose.md) | `path:temporal` when address+secret; offline pack URLs; gateway `phase5PrepOps.test.ts`; **not G5** |
| hardening (P12 prep) | **docs** | n/a | `docs/ops/phase12-hardening-dogfood-checklist.md` | Checklist only; Appendix C / S99 = human |
| admin K/G/P (P7 prep) | **yes** | n/a | Domain registry + `/admin/hr` `/admin/pricing` `/admin/analytics` | Shells status-only while dormant; Metabase `METABASE_SITE_URL` / `METABASE_EMBED_SECRET` Pack §6; **not G7** |

## Webhook contract (all PSP / WA / FDMS)

1. Adapter **verify** signature (or vendor verify) — fail closed without secret outside fixture.
2. `claimProcessedEventDurable` / `processed_events` **before** mutate.
3. Money rails: `admitPspWebhookEvent` → `completePspCaptureSettlement` when intent resolves (`findPaymentIntentForWebhook`).
4. Escrow: `applyJobReserveWebhook` via `findJobReserveForWebhook`.

## Not claimed

- G2 live/production EcoCash — still founder portal keys; eng-exception may sequence Phase 3+ (`G2: eng-exception`).
- G3/G5 green — dependency on G2; shapes/key-drop-in only.
- G4 green (two sandbox suppliers → Meili searchable) — Phase 4 prep shapes only (confirm-SLA board + co-op durable + migration `0005`).
- G6 green — device Android PNG still required (HTTP/Kotlin substitute ≠ exit).
- G7 green — launch-queue recon + CC Simulated watermark/payout blocked; full A–P still open.
- G8 sandbox green — matrix + webhook duplicate + FDMS day + WHT evidenced; live Paynow/ZIMRA/EcoCash/escrow still ENH-020/022 + Pack §6.
- G9 live — ENH-021 human.
- Live escrow partner (ENH-020), Meta templates (ENH-021), ZIMRA field-map refine (ENH-022).

Last refreshed: 2026-08-16 (G2 eng-exception; Phase 3 current; P4–P11 gateway fixture CI; Docker-free eng-safe code backlog exhausted; no live gates newly green).
