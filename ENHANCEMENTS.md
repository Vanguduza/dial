# Enhancements

Planned and accepted **engineering / process** enhancements for DIAL. This is a living backlog â€” not a second product SoR and **not** a place to reopen locks (C-5, D-38â€¦D-61).

**Maintenance:** update in the same PR that accepts, starts, or completes an item (Blueprint Â§8.0.2). Dev Manager keeps the queue honest.

**Status values:** `proposed` Â· `accepted` Â· `in_progress` Â· `done` Â· `deferred` Â· `rejected`

---

## Accepted / in flight

| ID | Enhancement | Status | Notes |
| --- | --- | --- | --- |
| ENH-001 | **Ticket hygiene â†’ first thin vertical** (E2a preferred or E1a) with DoD + owner before parallel trains | `done` | E2a = [#1](https://github.com/Vanguduza/dial/issues/1); S10 green â†’ auto S11 |
| ENH-006 | **Autonomous Dev Manager loop** â€” prefer/lock defaults; no founder wait; escalate only true OPENs; **stage auto-advance on green** through S90 | `done` | Runbook + workplan STATE â€” S90 eng complete 2026-08-13; S99 still human |
| ENH-030 | **API key-drop-in adapters** â€” Pack/Stitch HTTP shapes + fixture/sandbox/live mode; per-vendor webhooks | `done` | S91 â€” `docs/integrations/README.md` |
| ENH-031 | **Local compose + Temporal worker host** â€” Redis/Meili/Temporal; in-process DeliveryDispatchWorkflow | `done` | S92 â€” `docker-compose.yml` + `@dial/worker-temporal` |
| ENH-032 | **Supabase Auth + search-indexer** â€” GoTrue client scaffold; Meili outbox consumer | `done` | S93 â€” fixture CI; sandbox needs Redis/Meili/Supabase env |
| ENH-033 | **BullMQ + Temporal client** â€” queue host + DeliveryDispatch start path | `done` | S94 â€” `@dial/queues` + `@temporalio/client` |
| ENH-034 | **FDMS outbox drain + Supabase session bridge** | `done` | S95 â€” tax drain + sign-in password path |
| ENH-035 | **Promptfoo CI smoke + FDMS day workers** | `done` | S96 â€” `eval:smoke`; open/close day via Gateway |
| ENH-036 | **FDMS day BullMQ + admin API** | `done` | S97 â€” `QUEUE_FDMS_DAY` + `/api/admin/fdms/day` |
| ENH-037 | **Queue worker host + health expand** | `done` | S98 â€” `@dial/worker-queues`; health queues/fiscalDay |
| ENH-038 | **LiteLLM ping + Meili bootstrap** | `done` | S100 â€” health litellm + `pnpm bootstrap:search` |
| ENH-039 | **Temporal SDK worker + shared webhook idempotency** | `done` | S101 â€” `@temporalio/worker` path + `claimProcessedEvent` |
| ENH-040 | **WA/PSP shared idempotency + durable processed_events** | `done` | S102 â€” admitâ†’shared; Supabase REST claim path |
| ENH-041 | **Maps distance fixture bridge + shared webhook smoke** | `done` | S103 â€” deliveryâ†’adapter-maps; gateway smoke |
| ENH-042 | **ContiPay/EcoCash fixtures + COD USD settle evidence** | `done` | S104 â€” adapter-psp tests |
| ENH-043 | **Paynow redirect + escrow hold/release stubs** | `done` | S105 â€” ConfirmPayment fixture + instructRelease |
| ENH-044 | **Meta WA template registry + Cloud send** | `done` | S106 â€” `WA_TEMPLATE_*` env override + fixture send |
| ENH-045 | **FDMS submitReceipt shape + day queue drain** | `done` | S107 â€” agency classes + queueâ†’process |
| ENH-046 | **PayPal Orders fixture + escrow capture webhook** | `done` | S108 â€” checkoutnow + escrow.captureâ†’paid |
| ENH-047 | **VROOM plan + maps ETA on delivery jobs** | `done` | S109 â€” planDeliveryWithVroom + createDeliveryJobWithMaps |
| ENH-048 | **B2B informal leak=0 + search health** | `done` | S110 â€” countInformalB2bLeaks + integrations.search |
| ENH-049 | **Chatwoot handoff id contract + support ticket** | `done` | S111 â€” erpTicketId/inbox/contact + FLOW_SUPPORT_TICKET |
| ENH-050 | **Consent audit + referral promo_credit only** | `done` | S112 â€” listConsentAudit + assertReferralRewardNonCash |
| ENH-051 | **Returns claim ERP stub refund_or_replace** | `done` | S113 â€” ReturnClaim + resolveReturnClaim (no AI money) |
| ENH-052 | **Money outbox drain â†’ fiscal side-effects** | `done` | S114 â€” drainMoneyOutbox links FiscalReceiptQueued |
| ENH-053 | **Admin money outbox API + health depth** | `done` | S115 â€” `/api/admin/money/outbox` + health moneyOutbox |
| ENH-054 | **Worker money outbox drain + side-effects worker** | `done` | S116 â€” runMoneyOutboxDrain + startOutboxSideEffectsWorker |
| ENH-055 | **ContiPay/EcoCash webhook durable smoke** | `done` | S117 â€” claimProcessedEventDurable + bad-sig 401 |
| ENH-056 | **PayPal/FDMS webhook durable smoke** | `done` | S118 â€” durable claim + sandbox fail-closed |
| ENH-057 | **Paynow webhook durable + SoR bridge** | `done` | S119 â€” fixture referenceâ†’capture + bad hash 401 |
| ENH-058 | **WhatsApp webhook durable + HMAC smoke** | `done` | S120 â€” challenge + claimProcessedEventDurable + 401/503 |
| ENH-059 | **Escrow PSP webhook durable smoke** | `done` | S121 â€” `/api/webhooks/escrow` + bad-sig/fail-closed |
| ENH-060 | **Maps health ping on integrations** | `done` | S122 â€” pingMapsHealth Nominatim/OSRM fixture |
| ENH-061 | **FDMS Gateway health ping** | `done` | S123 â€” pingFdmsHealth fixture day + sandbox fail-closed |
| ENH-062 | **Meili search health ping expand** | `done` | S124 â€” pingMeiliHealth on search.meili |
| ENH-063 | **Redis/queues health ping** | `done` | S125 â€” pingQueuesHealth on queues.health |
| ENH-064 | **Temporal health expand** | `done` | S126 â€” pingTemporalHealth namespace/taskQueue |
| ENH-065 | **LiteLLM health model list** | `done` | S127 â€” pingLiteLlm models + sandbox fail-closed |
| ENH-066 | **Integration readiness + ready flag** | `done` | S128 â€” checklist doc + health `ready`/`probes` |
| ENH-067 | **WhatsApp Cloud health ping** | `done` | S129 â€” pingWhatsAppHealth + ready probe |
| ENH-068 | **PSP health ping aggregate** | `done` | S130 â€” pingPspHealth rails + ready probe |
| ENH-069 | **Internal API secret health probe** | `done` | S131 â€” pingInternalApiHealth + ready probe |
| ENH-070 | **`.env.example` â†” health groups sync** | `done` | S132 â€” keys + WA_TEMPLATE_* + checklist table |
| ENH-071 | **Admin integrations readiness UI** | `done` | S133 â€” `/admin/integrations` ready/probes |
| ENH-072 | **Gateway OpenAPI skeleton** | `done` | S134 â€” health + webhooks + `/api/openapi` |
| ENH-073 | **OpenAPI + readiness discovery links** | `done` | S135 â€” admin + README gateway table |
| ENH-074 | **README + integrations package table accuracy** | `done` | S136 â€” layout refresh + package name smoke |
| ENH-075 | **OpenAPI IntegrationsProbes schema** | `done` | S137 â€” required probe keys + group label enum |
| ENH-076 | **Health probes from INTEGRATION_PROBE_KEYS** | `done` | S138 â€” buildIntegrationsProbes SoR in route |
| ENH-077 | **Shared INTEGRATION_ENV_GROUPS** | `done` | S139 â€” env group SoR for health + .env.example |
| ENH-078 | **Document INTEGRATION_ENV_GROUPS SoR** | `done` | S140 â€” README + OpenAPI x-dial-sor |
| ENH-079 | **Admin readiness SoR hint + OpenAPI CTA** | `done` | S141 â€” `/admin/integrations` UI |
| ENH-080 | **Cost-health OpenAPI CTA + SoR hint** | `done` | S142 â€” parity with readiness UI |
| ENH-081 | **Health labels = INTEGRATION_ENV_GROUPS only** | `done` | S143 â€” fixture smoke locks label SoR |
| ENH-082 | **Sandbox health label SoR lock** | `done` | S144 â€” sandbox mode same label order |
| ENH-083 | **Live health label SoR lock** | `done` | S145 â€” live mode same label order |
| ENH-084 | **INTEGRATION_ENV_GROUP_LABELS helper** | `done` | S146 â€” derived label tuple + unit lock |
| ENH-085 | **Document envGroupLabels SoR** | `done` | S147 â€” README + OpenAPI x-dial-sor |
| ENH-086 | **Admin hint: ENV_GROUP_LABELS** | `done` | S148 â€” integrations + cost-health UI |
| ENH-087 | **Root README envGroupLabels SoR** | `done` | S149 â€” INTEGRATION_ENV_GROUP_LABELS |
| ENH-088 | **.env.example envGroupLabels SoR** | `done` | S150 â€” header cites label helper |
| ENH-089 | **Health note includes label tuple** | `done` | S151 â€” JSON note cites labels |
| ENH-090 | **OpenAPI note describes labels** | `done` | S152 â€” IntegrationsHealth.note |
| ENH-091 | **README health note contract** | `done` | S153 â€” groups labels= documented |
| ENH-092 | **Admin UI truncated health note** | `done` | S154 â€” parse note + truncate helper |
| ENH-093 | **Cost-health truncated health note** | `done` | S155 â€” stub fetches note + truncate |
| ENH-094 | **README admin note truncation** | `done` | S156 â€” INTEGRATIONS_HEALTH_NOTE_UI_MAX |
| ENH-095 | **OpenAPI healthNoteUiMax SoR** | `done` | S157 â€” x-dial-sor + note description |
| ENH-096 | **Root README note truncation** | `done` | S158 â€” INTEGRATIONS_HEALTH_NOTE_UI_MAX |
| ENH-097 | **Admin hint: HEALTH_NOTE_UI_MAX** | `done` | S159 â€” integrations + cost-health |
| ENH-098 | **README cites healthNoteUiMax** | `done` | S160 â€” x-dial-sor.healthNoteUiMax |
| ENH-099 | **.env.example HEALTH_NOTE_UI_MAX** | `done` | S161 â€” header cites truncation SoR |
| ENH-100 | **OpenAPI healthNoteUiMax export lock** | `done` | S162 â€” served fragment matches constant |
| ENH-101 | **buildIntegrationsHealthNote helper** | `done` | S163 â€” mode + labels note SoR |
| ENH-102 | **Health route uses note builder** | `done` | S164 â€” single note SoR |
| ENH-103 | **Document buildIntegrationsHealthNote** | `done` | S165 â€” README + OpenAPI note |
| ENH-104 | **OpenAPI x-dial-sor.healthNote** | `done` | S166 â€” pointer to note builder |
| ENH-105 | **Root README note builder** | `done` | S167 â€” buildIntegrationsHealthNote |
| ENH-106 | **.env.example note builder SoR** | `done` | S168 â€” buildIntegrationsHealthNote |
| ENH-107 | **Admin hint: note builder** | `done` | S169 â€” integrations + cost-health |
| ENH-108 | **OpenAPI healthNote export lock** | `done` | S170 â€” served fragment matches builder |
| ENH-109 | **Admin note-builder UI cross-link** | `done` | S171 â€” note-builder-sor-hint |
| ENH-110 | **README note-builder-sor-hint** | `done` | S172 â€” admin cross-link documented |
| ENH-111 | **OpenAPI info.description note builder** | `done` | S173 â€” buildIntegrationsHealthNote |
| ENH-112 | **Root README note-builder-sor-hint** | `done` | S174 â€” admin cross-link cited |
| ENH-113 | **S135 note-builder-sor-hint parity** | `done` | S175 â€” both admin pages locked |
| ENH-114 | **Note-builder SoR pointer constants** | `done` | S176 â€” HINT_ID + DOCS exports |
| ENH-115 | **.env.example note-builder-sor-hint** | `done` | S177 â€” HINT_ID + DOCS cited |
| ENH-116 | **OpenAPI noteBuilderHint SoR** | `done` | S178 â€” x-dial-sor.noteBuilderHint |
| ENH-117 | **Admin UI HINT_ID data-testid** | `done` | S179 â€” import constant for test id |
| ENH-118 | **OpenAPI noteBuilderHint export lock** | `done` | S180 â€” served fragment matches HINT_ID |
| ENH-119 | **README cites HINT_ID + DOCS** | `done` | S181 â€” integrations README |
| ENH-120 | **Root README HINT_ID + DOCS** | `done` | S182 â€” root README cites constants |
| ENH-121 | **OpenAPI noteBuilderDocs SoR** | `done` | S183 â€” x-dial-sor.noteBuilderDocs |
| ENH-122 | **OpenAPI docs path = DOCS export** | `done` | S184 â€” served docs lock |
| ENH-123 | **Admin UI cites DOCS constant** | `done` | S185 â€” note-builder hint copy |
| ENH-124 | **.env.example noteBuilderDocs** | `done` | S186 â€” OpenAPI key cited |
| ENH-125 | **README noteBuilderDocs** | `done` | S187 â€” integrations README |
| ENH-126 | **Root README noteBuilderDocs** | `done` | S188 â€” root README |
| ENH-127 | **OpenAPI description noteBuilderDocs** | `done` | S189 â€” info.description |
| ENH-128 | **Sandbox ready=false incomplete probes** | `done` | S190 â€” no REDIS_URL |
| ENH-129 | **Live ready=false incomplete probes** | `done` | S191 â€” no REDIS_URL |
| ENH-130 | **OpenAPI x-dial-sor HINT+DOCS keys** | `done` | S192 â€” served SoR keys |
| ENH-131 | **Fixture readyâ‰ groups configured** | `done` | S193 â€” ready=true incomplete groups |
| ENH-132 | **ready vs groups SoR docs** | `done` | S194 â€” README + OpenAPI |
| ENH-133 | **Health note mode variance** | `done` | S195 â€” fixtureâ‰ sandbox/live note |
| ENH-134 | **OpenAPI webhook sig+idempotency** | `done` | S196 â€” tag + x-dial-sor keys |
| ENH-135 | **OpenAPI webhook no-secret smoke** | `done` | S197 â€” ban sk_live/service_role/â€¦ |
| ENH-136 | **Served OpenAPI webhook SoR keys** | `done` | S198 â€” signature + idempotency |
| ENH-137 | **Root README readyâ‰ groups** | `done` | S199 â€” readyVsGroups cite |
| ENH-138 | **.env.example readyâ‰ groups** | `done` | S200 â€” readyVsGroups cite |
| ENH-139 | **README webhook OpenAPI SoR** | `done` | S201 â€” signature + idempotency keys |
| ENH-140 | **Admin readyâ‰ groups hint** | `done` | S202 â€” READY_VS_GROUPS_HINT_ID |
| ENH-141 | **Served webhook 200 idempotent** | `done` | S203 â€” OpenAPI smoke |
| ENH-142 | **OpenAPI desc webhook SoR** | `done` | S204 â€” info.description |
| ENH-143 | **Cost-health readyâ‰ groups** | `done` | S205 â€” hint parity |
| ENH-144 | **OpenAPI readyVsGroupsHint** | `done` | S206 â€” HINT_ID key |
| ENH-145 | **README READY_VS_GROUPS_HINT** | `done` | S207 â€” docs cite constant |
| ENH-149 | **Fixture zero configured still ready** | done | S211 - ready vs groups extreme |
| ENH-150 | **Served readyVsGroupsHint lock** | `done` | S212 — disk==served |
| ENH-151 | **Served webhooks tag lock** | `done` | S213 — claimProcessedEvent |
| ENH-152 | **Admin HINT_ID testid parity** | `done` | S214 — both admin pages |
| ENH-153 | **Checklist ready vs groups** | `done` | S215 — pre-sandbox |
| ENH-154 | **Served ready schema desc** | `done` | S216 — independent of groups |
| ENH-155 | **Served opaque body SoR** | `done` | S217 — processed_events |
| ENH-156 | **Empty-env snapshots SoR** | `done` | S218 — unit helper |
| ENH-157 | **.env fixture ready cite** | `done` | S219 — S211 callout |
| ENH-158 | **Admin no literal testids** | `done` | S220 — export-only |
| ENH-159 | **Served webhookSignature lock** | done | S221 — disk==served |
| ENH-160 | **Served webhookIdempotency lock** | `done` | S222 — disk==served |
| ENH-161 | **Empty-env fixture note labels** | `done` | S223 — labels stable |
| ENH-162 | **Root README S211 cite** | `done` | S224 — zero configured |
| ENH-163 | **Served readyVsGroups lock** | `done` | S225 — disk==served |
| ENH-164 | **Served OpenAPI no secrets** | `done` | S226 — GET /api/openapi |
| ENH-165 | **Served webhook 401 SoR** | `done` | S227 — signature fail |
| ENH-166 | **Empty-env note==builder** | `done` | S228 — route SoR |
| ENH-167 | **.env S211 cite** | `done` | S229 — configured=false |
| ENH-168 | **Served SoR key bundle lock** | `done` | S230 — multi-key |
| ENH-169 | **Served info.description lock** | done | S231 — disk==served |
| ENH-170 | **Served opaque body lock** | `done` | S232 — disk==served |
| ENH-171 | **README S211 zero-configured** | `done` | S233 — docs cite |
| ENH-172 | **Served webhooks tag lock** | `done` | S234 — disk==served |
| ENH-173 | **Served healthNote lock** | `done` | S235 — disk==served |
| ENH-174 | **Webhook 503 fail-closed SoR** | `done` | S236 — all webhook POSTs |
| ENH-175 | **Served mode enum lock** | `done` | S237 — three modes |
| ENH-176 | **Sandbox vs fixture note** | `done` | S238 — mode semantics |
| ENH-177 | **Served path set lock** | `done` | S239 — coverage |
| ENH-178 | **Webhook body $ref SoR** | `done` | S240 — opaque contract |
| ENH-179 | **Served healthNoteUiMax lock** | done | S241 — disk==served |
| ENH-180 | **Served noteBuilderDocs lock** | `done` | S242 — disk==served |
| ENH-181 | **Live==sandbox note builder** | `done` | S243 — mode semantics |
| ENH-182 | **Served probes required SoR** | `done` | S244 — probe keys |
| ENH-183 | **Sandbox no-Redis fail** | `done` | S245 — queues probe |
| ENH-184 | **Fixture no-Redis ready** | `done` | S246 — mode contrast |
| ENH-185 | **Served noteBuilderHint lock** | `done` | S247 — disk==served |
| ENH-186 | **Served envGroups lock** | `done` | S248 — disk==served |
| ENH-187 | **Served envGroupLabels lock** | `done` | S249 — disk==served |
| ENH-188 | **Live no-Redis fail** | `done` | S250 — queues probe |
| ENH-189 | **Served probes properties SoR** | done | S251 — probe keys |
| ENH-190 | **Groups label enum SoR** | `done` | S252 — served enum |
| ENH-191 | **Sandbox no-internal-secret fail** | `done` | S253 — internal probe |
| ENH-192 | **Fixture no-internal-secret ok** | `done` | S254 — mode contrast |
| ENH-193 | **Served probes SoR pointer** | `done` | S255 — disk==served |
| ENH-194 | **Served docs SoR pointer** | `done` | S256 — disk==served |
| ENH-195 | **Live no-internal-secret fail** | `done` | S257 — internal probe |
| ENH-196 | **Groups item required SoR** | `done` | S258 — OpenAPI |
| ENH-197 | **Health operationId lock** | `done` | S259 — OpenAPI |
| ENH-198 | **Served OpenAPI identity lock** | `done` | S260 — title/version |
| ENH-199 | **IntegrationsHealth.required SoR** | done | S261 — ready/mode/probes/groups |
| ENH-200 | **Sandbox webhook fail-closed** | `done` | S262 — no INTERNAL_API_SECRET / FDMS key |
| ENH-201 | **Fixture webhook accept without secret** | `done` | S263 — ContiPay fixture |
| ENH-202 | **OpenAPI servers localhost lock** | `done` | S264 — http://localhost:3000 |
| ENH-203 | **OpenAPI tags SoR** | `done` | S265 — health/webhooks/admin |
| ENH-204 | **OpenAPI skeleton operationId** | `done` | S266 — getOpenApiSkeleton |
| ENH-205 | **Sandbox PSP webhook fail-closed** | `done` | S267 — no PSP_WEBHOOK_SECRET |
| ENH-206 | **Fixture FDMS accept without key** | `done` | S268 — mode contrast |
| ENH-207 | **InternalApiSecret OpenAPI scheme** | `done` | S269 — header x-internal-secret |
| ENH-208 | **Admin money outbox security SoR** | `done` | S270 — InternalApiSecret on GET/POST |
| ENH-209 | **ContiPay OpenAPI operationId** | done | S271 — webhookContipay |
| ENH-210 | **FDMS OpenAPI operationId** | `done` | S272 — webhookFdms |
| ENH-211 | **PSP legacy OpenAPI operationId** | `done` | S273 — webhookPspLegacy deprecated |
| ENH-212 | **WhatsApp OpenAPI operationIds** | `done` | S274 — challenge + POST |
| ENH-213 | **Daily ZiG OpenAPI security** | `done` | S275 — InternalApiSecret + ops |
| ENH-214 | **EcoCash OpenAPI operationId** | `done` | S276 — webhookEcocash |
| ENH-215 | **Paynow OpenAPI operationId** | `done` | S277 — webhookPaynow |
| ENH-216 | **PayPal OpenAPI operationId** | `done` | S278 — webhookPaypal |
| ENH-217 | **Escrow OpenAPI operationId** | `done` | S279 — webhookEscrow |
| ENH-218 | **Admin FDMS day security SoR** | `done` | S280 — InternalApiSecret on GET/POST |
| ENH-219 | **Daily ZiG GET fail-closed** | done | S281 — no INTERNAL_API_SECRET |
| ENH-220 | **ContiPay signature header SoR** | `done` | S282 — x-contipay-signature |
| ENH-221 | **WhatsApp hub signature header** | `done` | S283 — x-hub-signature-256 |
| ENH-222 | **WebhookOpaqueBody schema lock** | `done` | S284 — object + processed_events |
| ENH-223 | **All admin paths InternalApiSecret** | `done` | S285 — OpenAPI security sweep |
| ENH-224 | **Daily ZiG POST fail-closed** | `done` | S286 — no INTERNAL_API_SECRET |
| ENH-225 | **ContiPay 401 signature SoR** | `done` | S287 — OpenAPI response |
| ENH-226 | **WhatsApp 401 HMAC SoR** | `done` | S288 — OpenAPI response |
| ENH-227 | **WhatsApp hub challenge params** | `done` | S289 — mode/token/challenge |
| ENH-228 | **Admin OpenAPI path set lock** | `done` | S290 — served==disk /api/admin/* |
| ENH-229 | **FDMS day GET fail-closed** | done | S291 — no INTERNAL_API_SECRET |
| ENH-230 | **ContiPay 503 fail-closed SoR** | `done` | S292 — OpenAPI response |
| ENH-231 | **WhatsApp POST 503 fail-closed** | `done` | S293 — OpenAPI response |
| ENH-232 | **Canonical webhook 503 text** | `done` | S294 — sandbox/live misconfig |
| ENH-233 | **Daily ZiG wrong-secret 401** | `done` | S295 — no secret echo |
| ENH-234 | **FDMS day POST fail-closed** | `done` | S296 — no INTERNAL_API_SECRET |
| ENH-235 | **FDMS day wrong-secret 401** | `done` | S297 — no secret echo |
| ENH-236 | **Daily ZiG OpenAPI 503 text** | `done` | S298 — INTERNAL_API_SECRET unset |
| ENH-237 | **ContiPay 503 served==disk** | `done` | S299 — OpenAPI lock |
| ENH-238 | **WhatsApp 503 served==disk** | `done` | S300 — OpenAPI lock |
| ENH-239 | **Money outbox wrong-secret 401** | done | S301 — no secret echo |
| ENH-240 | **Paynow 503 served==disk** | `done` | S302 — OpenAPI lock |
| ENH-241 | **EcoCash 503 served==disk** | `done` | S303 — OpenAPI lock |
| ENH-242 | **FDMS webhook 503 served==disk** | `done` | S304 — OpenAPI lock |
| ENH-243 | **PSP webhook 503 served==disk** | `done` | S305 — OpenAPI lock |
| ENH-244 | **Escrow 503 served==disk** | `done` | S306 — OpenAPI lock |
| ENH-245 | **PayPal 503 served==disk** | `done` | S307 — OpenAPI lock |
| ENH-246 | **Money outbox OpenAPI 401** | `done` | S308 — missing/invalid secret |
| ENH-247 | **Webhook 503 served==disk sweep** | `done` | S309 — all POST paths |
| ENH-248 | **Money outbox POST wrong-secret 401** | `done` | S310 — no secret echo |
| ENH-249 | **Paynow 401 served==disk** | done | S311 — OpenAPI lock |
| ENH-250 | **EcoCash 401 served==disk** | `done` | S312 — OpenAPI lock |
| ENH-251 | **ContiPay 401 served==disk** | `done` | S313 — OpenAPI lock |
| ENH-252 | **FDMS webhook 401 served==disk** | `done` | S314 — OpenAPI lock |
| ENH-253 | **WhatsApp POST 401 served==disk** | `done` | S315 — Bad HMAC |
| ENH-254 | **Escrow 401 served==disk** | `done` | S316 — OpenAPI lock |
| ENH-255 | **PayPal 401 served==disk** | `done` | S317 — OpenAPI lock |
| ENH-256 | **PSP webhook 401 served==disk** | `done` | S318 — OpenAPI lock |
| ENH-257 | **Webhook 401 served==disk sweep** | `done` | S319 — all POST paths |
| ENH-258 | **FDMS day OpenAPI 401** | `done` | S320 — missing/invalid secret |
| ENH-259 | **Daily ZiG OpenAPI 401** | done | S321 — missing/invalid secret |
| ENH-260 | **All admin OpenAPI 401 sweep** | `done` | S322 — internal secret |
| ENH-261 | **WhatsApp hub 403 SoR** | `done` | S323 — verify token mismatch |
| ENH-262 | **ContiPay 200 idempotent SoR** | `done` | S324 — signature verified |
| ENH-263 | **Canonical webhook 200 text** | `done` | S325 — idempotent signature verified |
| ENH-264 | **WhatsApp 403 served==disk** | `done` | S326 — OpenAPI lock |
| ENH-265 | **ContiPay 200 served==disk** | `done` | S327 — OpenAPI lock |
| ENH-266 | **Webhook 200 served==disk sweep** | `done` | S328 — all POST paths |
| ENH-267 | **Daily ZiG 401 served==disk** | `done` | S329 — GET/POST |
| ENH-268 | **Money outbox 401 served==disk** | `done` | S330 — GET/POST |
| ENH-269 | **FDMS day 401 served==disk** | done | S331 — GET/POST |
| ENH-270 | **Paynow 200 served==disk** | `done` | S332 — OpenAPI lock |
| ENH-271 | **EcoCash 200 served==disk** | `done` | S333 — OpenAPI lock |
| ENH-272 | **WhatsApp POST 200 served==disk** | `done` | S334 — OpenAPI lock |
| ENH-273 | **OpenAPI servers description** | `done` | S335 — Local gateway-web |
| ENH-274 | **OpenAPI servers served==disk** | `done` | S336 — full servers array |
| ENH-275 | **FDMS day GET 200 served==disk** | `done` | S337 — Fiscal day snapshot |
| ENH-276 | **Health 200 no-secret copy** | `done` | S338 — OpenAPI response |
| ENH-277 | **WhatsApp GET 200 Challenge echo** | `done` | S339 — served==disk |
| ENH-278 | **OpenAPI tags names served==disk** | `done` | S340 — admin/health/webhooks |
| ENH-279 | **OpenAPI 3.0.3 lock** | done | S341 — openapi field |
| ENH-280 | **ContiPay HMAC summary lock** | `done` | S342 — ContiPay HMAC webhook |
| ENH-281 | **InternalApiSecret served==disk** | `done` | S343 — full scheme object |
| ENH-282 | **OpenAPI schemas key set** | `done` | S344 — Health/Probes/OpaqueBody |
| ENH-283 | **securitySchemes key set** | `done` | S345 — InternalApiSecret only |
| ENH-284 | **OpenAPI version served==disk** | `done` | S346 — 3.0.3 |
| ENH-285 | **ContiPay summary served==disk** | `done` | S347 — OpenAPI lock |
| ENH-286 | **IntegrationsHealth required served==disk** | `done` | S348 — schema lock |
| ENH-287 | **InternalApiSecret header name** | `done` | S349 — x-internal-secret |
| ENH-288 | **components keys served==disk** | `done` | S350 — schemas+securitySchemes |
| ENH-289 | **Paynow summary served==disk** | done | S351 — SHA512 notification |
| ENH-290 | **WhatsApp POST summary served==disk** | `done` | S352 — Meta Cloud API HMAC |
| ENH-291 | **FDMS webhook summary served==disk** | `done` | S353 — Gateway acknowledge |
| ENH-292 | **OpenAPI info.title served==disk** | `done` | S354 — DIAL Gateway |
| ENH-293 | **OpenAPI info.version served==disk** | `done` | S355 — 0.1.0 |
| ENH-294 | **EcoCash summary served==disk** | `done` | S356 — EcoCash HMAC webhook |
| ENH-295 | **PayPal summary served==disk** | `done` | S357 — OpenAPI lock |
| ENH-296 | **Escrow summary served==disk** | `done` | S358 — OpenAPI lock |
| ENH-297 | **WhatsApp GET summary served==disk** | `done` | S359 — Meta hub challenge |
| ENH-298 | **OpenAPI info pair served==disk** | `done` | S360 — title+version |
| ENH-299 | **PSP summary served==disk** | done | S361 — Legacy generic PSP/escrow shim |
| ENH-300 | **Health summary served==disk** | `done` | S362 — Integration readiness |
| ENH-301 | **OpenAPI skeleton summary served==disk** | `done` | S363 — Serve this OpenAPI |
| ENH-302 | **Webhook POST summaries sweep** | `done` | S364 — served==disk |
| ENH-303 | **Money outbox GET summary** | `done` | S365 — Money outbox depth |
| ENH-304 | **Money outbox POST summary** | `done` | S366 — Drain money outbox |
| ENH-305 | **FDMS day GET summary served==disk** | `done` | S367 — Fiscal day state |
| ENH-306 | **Daily ZiG GET summary served==disk** | `done` | S368 — Active Daily ZiG |
| ENH-307 | **Admin GET summaries sweep** | `done` | S369 — served==disk |
| ENH-308 | **Admin POST summaries sweep** | `done` | S370 — served==disk |
| ENH-309 | **Path operationIds served==disk** | done | S371 — full path/method sweep |
| ENH-310 | **ContiPay operationId served==disk** | `done` | S372 — webhookContipay |
| ENH-311 | **WhatsApp POST operationId served==disk** | `done` | S373 — webhookWhatsapp |
| ENH-312 | **x-dial-sor keys served==disk** | `done` | S374 — key set lock |
| ENH-313 | **OpenAPI top-level keys served==disk** | `done` | S375 — key set lock |
| ENH-314 | **x-dial-sor values served==disk** | `done` | S376 — deepEqual values |
| ENH-315 | **WhatsApp GET operationId served==disk** | `done` | S377 — webhookWhatsappChallenge |
| ENH-316 | **Paynow operationId served==disk** | `done` | S378 — webhookPaynow |
| ENH-317 | **FDMS webhook operationId served==disk** | `done` | S379 — webhookFdms |
| ENH-318 | **OpenAPI top-level exact key set** | `done` | S380 — components|info|openapi|paths|servers|tags |
| ENH-319 | **EcoCash operationId served==disk** | `done` | S381 — webhookEcocash |
| ENH-320 | **PayPal operationId served==disk** | `done` | S382 — webhookPaypal |
| ENH-321 | **Escrow operationId served==disk** | `done` | S383 — webhookEscrow |
| ENH-322 | **PSP operationId served==disk** | `done` | S384 — webhookPspLegacy |
| ENH-323 | **Webhook POST operationIds sweep** | `done` | S385 — served==disk |
| ENH-324 | **Admin GET operationIds served==disk** | `done` | S386 — admin path GET sweep |
| ENH-325 | **Admin POST operationIds served==disk** | `done` | S387 — admin path POST sweep |
| ENH-326 | **getIntegrationsHealth operationId** | `done` | S388 — served==disk |
| ENH-327 | **getOpenApiSkeleton operationId** | `done` | S389 — served==disk |
| ENH-328 | **Path operationIds non-empty** | `done` | S390 — served sweep |
| ENH-329 | **adminFdmsDayGet operationId** | `done` | S391 — locked |
| ENH-330 | **adminMoneyOutboxGet operationId** | `done` | S392 — locked |
| ENH-331 | **adminFxDailyZigGet operationId** | `done` | S393 — locked |
| ENH-332 | **adminFdmsDayPost operationId** | `done` | S394 — locked |
| ENH-333 | **adminMoneyOutboxDrain operationId** | `done` | S395 — locked |
| ENH-334 | **adminFxDailyZigPost operationId** | `done` | S396 — locked |
| ENH-335 | **Admin operationIds sweep** | `done` | S397 — served==disk |
| ENH-336 | **Tags names sorted served==disk** | `done` | S398 — sorted names |
| ENH-337 | **Servers url served==disk** | `done` | S399 — url lock |
| ENH-338 | **info.description served==disk** | `done` | S400 — description lock |
| ENH-339 | **Servers description served==disk** | `done` | S401 — description lock |
| ENH-340 | **Tags descriptions served==disk** | `done` | S402 — by-name map |
| ENH-341 | **Path count served==disk** | `done` | S403 — path count |
| ENH-342 | **openapi version string served==disk** | `done` | S404 — 3.0.3 |
| ENH-343 | **info.title served==disk** | `done` | S405 — title lock |
| ENH-344 | **info.version served==disk** | `done` | S406 — version lock |
| ENH-345 | **schemas key set served==disk** | `done` | S407 — lock |
| ENH-346 | **securitySchemes key set served==disk** | `done` | S408 — lock |
| ENH-347 | **WebhookOpaqueBody schema served==disk** | `done` | S409 — lock |
| ENH-348 | **InternalApiSecret scheme served==disk** | `done` | S410 — lock |
| ENH-349 | **IntegrationsHealth schema served==disk** | `done` | S411 — lock |
| ENH-350 | **IntegrationsProbes schema served==disk** | `done` | S412 — lock |
| ENH-351 | **components top-level keys served==disk** | `done` | S413 — lock |
| ENH-352 | **InternalApiSecret apiKey header lock** | `done` | S414 — lock |
| ENH-353 | **WebhookOpaqueBody additionalProperties** | `done` | S415 — lock |
| ENH-354 | **IntegrationsHealth required fields** | `done` | S416 — ok|ready|mode|probes|groups |
| ENH-355 | **IntegrationsProbes required keys** | `done` | S417 — lock |
| ENH-356 | **all schemas deepEqual disk** | `done` | S418 — lock |
| ENH-357 | **securitySchemes deepEqual disk** | `done` | S419 — lock |
| ENH-358 | **info object keys served==disk** | `done` | S420 — lock |
| ENH-359 | **info deepEqual disk** | `done` | S421 — lock |
| ENH-360 | **components deepEqual disk** | `done` | S422 — lock |
| ENH-361 | **servers deepEqual disk** | `done` | S423 — lock |
| ENH-362 | **tags deepEqual disk** | `done` | S424 — lock |
| ENH-363 | **full OpenAPI deepEqual disk** | `done` | S425 — lock |
| ENH-364 | **paths deepEqual + admin 503 OpenAPI** | `done` | S426 — FDMS/money 503 docs |
| ENH-365 | **path operation count locked** | `done` | S427 — lock |
| ENH-366 | **webhook POST 401 documented** | `done` | S428 — lock |
| ENH-367 | **admin paths all document 503** | `done` | S429 — lock |
| ENH-368 | **x-dial-sor key count locked** | `done` | S430 — lock |
| ENH-369 | **x-dial-sor keys sorted** | `done` | S431 — lock |
| ENH-370 | **webhook POST 200 idempotent** | `done` | S432 — lock |
| ENH-371 | **path keys sorted served==disk** | `done` | S433 — lock |
| ENH-372 | **admin paths all document 401** | `done` | S434 — lock |
| ENH-373 | **response status codes match disk** | `done` | S435 — lock |
| ENH-374 | **WhatsApp GET challenge OpenAPI** | `done` | S436 — hub params + 200/403 |
| ENH-375 | **ContiPay responses served==disk** | `done` | S437 — lock |
| ENH-376 | **Paynow responses served==disk** | `done` | S438 — lock |
| ENH-377 | **tags count locked** | `done` | S439 — lock |
| ENH-378 | **servers count locked** | `done` | S440 — lock |
| ENH-379 | **EcoCash responses served==disk** | `done` | S441 — lock |
| ENH-380 | **FDMS webhook responses served==disk** | `done` | S442 — lock |
| ENH-381 | **WhatsApp POST responses served==disk** | `done` | S443 — lock |
| ENH-382 | **health integrations responses** | `done` | S444 — lock |
| ENH-383 | **openapi path responses served==disk** | `done` | S445 — lock |
| ENH-384 | **PayPal responses served==disk** | `done` | S446 — lock |
| ENH-385 | **Escrow responses served==disk** | `done` | S447 — lock |
| ENH-386 | **PSP responses served==disk** | `done` | S448 — lock |
| ENH-387 | **admin FDMS day responses** | `done` | S449 — lock |
| ENH-388 | **admin money outbox responses** | `done` | S450 — lock |
| ENH-389 | **admin daily-zig responses** | `done` | S451 — lock |
| ENH-390 | **webhook POST responses sweep** | `done` | S452 — lock |
| ENH-391 | **admin path responses sweep** | `done` | S453 — lock |
| ENH-392 | **ContiPay parameters served==disk** | `done` | S454 — lock |
| ENH-393 | **WhatsApp POST parameters** | `done` | S455 — lock |
| ENH-394 | **Paynow parameters served==disk** | `done` | S456 — lock |
| ENH-395 | **webhook POST parameters sweep** | `done` | S457 — lock |
| ENH-396 | **requestBody WebhookOpaqueBody refs** | `done` | S458 — lock |
| ENH-397 | **admin InternalApiSecret only** | `done` | S459 — lock |
| ENH-398 | **tags admin|health|webhooks** | `done` | S460 — lock |
| ENH-399 | **Paynow Hash header locked** | `done` | S461 — lock |
| ENH-400 | **ContiPay signature header** | `done` | S462 — lock |
| ENH-401 | **WhatsApp hub signature header** | `done` | S463 — lock |
| ENH-402 | **webhook POST tags webhooks** | `done` | S464 — lock |
| ENH-403 | **admin path tags admin only** | `done` | S465 — lock |
| ENH-404 | **OpenAPI micro-band pause** — return STATE to S90→S99 spine | `done` | Founder: no invent past workplan; S99 human |
| ENH-405 | **Product-depth band PD1–PD4** authored in workplan (Auth→Meili→Spare→PSP; G1 waits) | `done` | Auto-advance within band only; no S466+ invent |
| ENH-406 | **PD1 Auth depth** — live Supabase Auth + profiles/RLS + `/api/auth/me` | `done` | [#21](https://github.com/Vanguduza/dial/issues/21); fixture CI; sandbox/live fail-closed |
| ENH-407 | **PD2 Search depth** — Meili spare_offers_v1 + Factory publish + B2B filter | `done` | [#22](https://github.com/Vanguduza/dial/issues/22); searchOffersAsync; admin publish |
| ENH-408 | **PD3 Spare depth** — browse/PDP/cart/checkout against session search | `done` | [#23](https://github.com/Vanguduza/dial/issues/23); USD browse; EcoCash\|COD |
| ENH-409 | **PD4 PSP sandbox** — Paynow/EcoCash adapter spine + webhook settle | `done` | [#24](https://github.com/Vanguduza/dial/issues/24); money-path audit |
| ENH-410 | **G1 Groceries thin vertical** — grocery_offers_v1 → USD browse → EcoCash\|COD → Job Reserve → delivery | `done` | [#25](https://github.com/Vanguduza/dial/issues/25); food/pantry only; money-path-G1 |
| ENH-411 | **Product-depth band PD5–PD9** authored (Android → supplier-web → delivery-android → iOS → technician) | `done` | Workplan §1b; S99 stays launch-only |
| ENH-412 | **PD5 Customer Android** — Compose Spare thin vertical vs gateway APIs | `done` | [#26](https://github.com/Vanguduza/dial/issues/26); thin vertical green; expand polish deferred |
| ENH-413 | **PD6 Supplier-web** — Pack §9.4 onboard/costs/heartbeat/confirm/statements | `done` | [#27](https://github.com/Vanguduza/dial/issues/27); `@dial/suppliers` |
| ENH-414 | **PD7 Delivery Android** — offer/POD/COD + MapLibre admin track | `done` | [#28](https://github.com/Vanguduza/dial/issues/28); `@dial/delivery` SoR |
| ENH-415 | **PD8 Customer iOS** — SwiftUI Spare browse/cart/EcoCash\|COD | `done` | [#29](https://github.com/Vanguduza/dial/issues/29); DialCustomerCore |
| ENH-416 | **PD9 Technician Android** — jobs/checklist/evidence/Cal.com/`rate_card`/WHT | `done` | [#30](https://github.com/Vanguduza/dial/issues/30); `@dial/jobs` |
| ENH-417 | **Product-depth band PD10–PD12** authored (admin CC → FDMS → WA Flows) | `done` | Workplan §1b; eng next ≠ S99 |
| ENH-418 | **PD10 Admin money / dispatch / Command Centre** | `done` | [#31](https://github.com/Vanguduza/dial/issues/31); D-54 Simulated≠pay |
| ENH-419 | **PD11 FDMS Virtual Gateway sandbox** — day + agency receipts | `done` | [#32](https://github.com/Vanguduza/dial/issues/32); D-59 no printer |
| ENH-420 | **PD12 Meta WA Flows sandbox** — Spare + grocery food Cloud API | `done` | [#33](https://github.com/Vanguduza/dial/issues/33); D-40/D-57; no Baileys/liquor |
| ENH-421 | **Product-depth band PD13–PD15** authored (tech-web → grocery web deepen → Catalogue Factory admin) | `done` | Pack §9 gaps; eng next ≠ S99 |
| ENH-422 | **PD13 tech-web Pack §9.3** — guide/emergency/book/status | `done` | [#34](https://github.com/Vanguduza/dial/issues/34); rate_card; no AI payable |
| ENH-423 | **PD14 Grocery web deepen** — slot + cart + checkout + track | `done` | [#35](https://github.com/Vanguduza/dial/issues/35); D-57/D-49; no liquor |
| ENH-424 | **PD15 Catalogue Factory admin** — CSV→approve→Meili + demand-gap | `done` | [#36](https://github.com/Vanguduza/dial/issues/36); D-53/D-49; no AI auto-publish |
| ENH-425 | **Product-depth band PD16–PD18** authored (promos → Intelligence → spare deepen) | `done` | Pack §9.5/§9.2/D-54 gaps; eng next ≠ S99 |
| ENH-426 | **PD16 Promotions & referrals admin** — PLATFORM/FLASH/REFERRAL + SUPPLIER_COOP | `done` | D-42; no cash-out; `/admin/promotions` |
| ENH-427 | **PD17 Intelligence Factory shadow/promote** — Promptfoo + human gates | `done` | D-54/D-56 audit; `/admin/intelligence/factory` |
| ENH-428 | **PD18 Spare-web deepen** — orders/returns/garage + Sold by | `done` | Pack §9.2; D-57/D-58 |
| ENH-429 | **Product-depth band PD19–PD20** authored (admin Trade/Value Score → mobile deepen) | `done` | Pack §9.5/§9.6 gaps; eng next ≠ S99 |
| ENH-430 | **PD19 Admin Trade/JobClass + Value Score** — lifecycle + disputes; no money path | `done` | Pack §9.5 / D-53; `/admin/trades` |
| ENH-431 | **PD20 Customer mobile deepen** — Android+iOS orders/returns/garage + grocery | `done` | Pack §9.6; C-5; no Expo |
| ENH-432 | **Product-depth band PD21–PD23** authored (promo/tech mobile → ZiG/cost → WHT/sim) | `done` | Pack §9 gap audit after PD20; eng next ≠ S99 |
| ENH-433 | **PD21 Customer mobile promo/referral + tech deep-link** — D-42 no cash-out | `done` | Pack §9.6; `/api/promo`; C-5 |
| ENH-434 | **PD22 Admin Daily ZiG + Cost & health** — spend thresholds + kill-switch; IMTT opex | `done` | Pack §9.5; D-57/D-60 |
| ENH-435 | **PD23 Admin Compliance/WHT + Commercial Simulation** — remittance; Simulated≠pay | `done` | Pack §9.5/D-53/D-54; D-50 |
| ENH-436 | **Product-depth band PD24–PD25** authored (Projects/legal → tech Value Score) | `done` | Pack §9 gap audit after PD23; eng next ≠ S99 |
| ENH-437 | **PD24 Admin Projects toggle + legal compliance hub** — C-3 gates; §3.8 T&Cs | `done` | Pack §9.5 residual; `/admin/projects` + `/admin/compliance/legal` |
| ENH-438 | **PD25 Technician Android Value Score + ITF263** — factors; Take-Home; D-50 | `done` | Pack §9.7 / D-53; Compose |
| ENH-439 | **Product-depth band PD26–PD28** authored (home → EPC → delivery deepen) | `done` | Pack §9 gap audit after PD25; eng next ≠ S99 |
| ENH-440 | **PD26 Gateway home Shop\|Services** — Welcome-back; responsive lanes | `done` | Pack §9.1; `/home` + `/api/home` |
| ENH-441 | **PD27 Spare Select Vehicle / Browse EPC** — chassis join; USD; D-49 | `done` | Pack §9.2 / C-6; `/spare/entry` |
| ENH-442 | **PD28 Delivery availability + offline packs** — MapLibre Harare/Bulawayo | `done` | Pack §9.8 / D-44; Compose |
| ENH-443 | **Product-depth band PD29–PD30** authored (ETA/stops → tech camera) | `done` | Pack §9 gap audit after PD28; eng next ≠ S99 |
| ENH-444 | **PD29 Delivery ETA + stops / VROOM** — OSRM banner; navigate; re-optimise | `done` | Pack §9.8 / D-44; Compose |
| ENH-445 | **PD30 Technician mock-location + camera** — geofence check-in; overlay queue | `done` | Pack §9.7 / 2B-29; Compose |
| ENH-446 | **Product-depth band PD31–PD32** authored (BT print → COD float) | `done` | Pack §9 gap audit after PD30; eng next ≠ S99 |
| ENH-447 | **PD31 Technician Bluetooth ESC/POS print** — ops ticket; not ZIMRA SoR | `done` | Pack §9.7 / D-46 / D-40a; Compose |
| ENH-448 | **PD32 Delivery COD float-limit warning** — warn + ack gate; USD minor | `done` | Pack §9.8 / D-7; Compose |
| ENH-449 | **Pack §9 residual band closed** after PD32 — polish/expand next | `done` | eng next ≠ S99; no OpenAPI invent |
| ENH-450 | **PD33 Staging dogfood recon** — Spare+grocery+WA; B2B cart 403 | `done` | [#37](https://github.com/Vanguduza/dial/issues/37); dial-webapp-recon |
| ENH-451 | **Product-depth PD34** authored (B2B grocery + take-rate admin) | `done` | Wave 3 leftovers; eng next ≠ S99 |
| ENH-452 | **PD43 Spare CPA §7.5 disclosure** — review-before-pay EcoCash\|COD | `done` | Pack §9.2 / v4 §7.5; web + native |
| ENH-453 | **PD44 Grocery CPA disclosure** — same gate; food only | `done` | Pack §9 grocery; no liquor |
| ENH-454 | **PD45 Support + consent admin** — ERP tickets + consent audit | `done` | ENH-049/050 ops UX; Chatwoot ≠ SoR |
| ENH-455 | **Pack gap audit after PD42** authored PD43–PD45 | `done` | eng next ≠ S99 |
| ENH-456 | **PD46 Supplier co-op spend UX** — record spend + statement; D-42 | `done` | Pack §9.4/§9.5 |
| ENH-457 | **PD47 Command Centre recommended actions** — D-54 autoPay=false | `done` | MetricContract severity→actions |

| ENH-002 | **Responsive web UX DoD** on all Next.js tickets (desktop + mobile, shared design-tokens, cross-viewport QA) | `accepted` | Blueprint Â§8.0.1; wire into ticket templates as web apps land |
| ENH-003 | **Living root docs** auto-maintained in every meaningful PR | `accepted` | `README` / `CHANGELOG` / `ENHANCEMENTS` / `BUGS` â€” Â§8.0.2 |
| ENH-004 | **Production AI multi-step** via `packages/ai` capabilities + LiteLLMâ†’Gemini + Temporal/BullMQ (no prod agent host/adapter) | `accepted` | **D-61** â€” capability pipeline only; grill + `dial-ai-capability-review` before scaffold; no peer AI kernel |
| ENH-005 | **Development Prime** mandatory Build **harness** (`prime-agent`, MIT) â€” install before workspace bootstrap; hosts Dev Manager | `in_progress` | **D-61** â€” injected: `.prime/agent/` Auto + `/dev-manager` sync + workplan idle ban; Windows `scripts/start-dial-dev-manager-prime.ps1`; Cursor bridge Auto; **Windows handshake patch** `scripts/patch-prime-agent-windows-handshake.mjs` (WMIC start-id; #748/#1077); **reject** prod Prime adapter / alternate frameworks |

---

## Proposed (Plan residuals â€” process / Build quality)

| ID | Enhancement | Status | Notes |
| --- | --- | --- | --- |
| ENH-010 | **Machine-strict DoD / PR gates** â€” CI or bot checks that tracer matrix evidence cells and feature DoD are not blank on merge of epic PRs | `proposed` | Complements D-52 human + `dial-tracer-slice`; does not replace human sign-off |
| ENH-011 | **Playwright / `dial-webapp-recon` viewport matrix** (desktop + mobile) in CI or staging smoke | `in_progress` | **PD37** local Chromium path green (harness + optional localhost); remote staging URL still optional |
| ENH-012 | **KMP `packages/mobile-shared`** for non-UI shared logic (Blueprint I-1) | `proposed` | Does **not** reopen C-5; no CMP customer UI |
| ENH-013 | Self-hosted **Nominatim / OSRM / VROOM** Tier-2 siblings (Blueprint I-2 / D-44) | `proposed` | After maps/delivery spine scaffolds |

---

## Phase 0 commercial / ops tracks (parallel â€” not eng substitutes)

Track here so Build does not forget them; they **block customer-open**, not T0 scaffolding. Detail: Pack Â§4, Appendix C / Blueprint Â§8.1.

| ID | Track | Status | Notes |
| --- | --- | --- | --- |
| ENH-020 | PSP escrow partner contract (Paynow-first ask per D-60 / C-4) | `proposed` | Ops / legal |
| ENH-021 | Meta WABA + approved template IDs | `proposed` | Ops launch gate (D-60) |
| ENH-022 | ZIMRA virtual FDMS / Gateway credentials | `proposed` | D-59 in-house Gateway default |
| ENH-023 | POTRAZ / cross-border AI transfer authorisation where required | `proposed` | Parallel to live photoâ†’foreign model |

---

## Done

| ID | Enhancement | Completed | Notes |
| --- | --- | --- | --- |
| ENH-000 | T0 monorepo foundation (pnpm/turbo/CI, gateway shell, design-tokens, shared money types, promotions package wire-up) | 2026-08-11 | See `CHANGELOG.md` |

---

## Rejected (do not revive without new D-log)

| ID | Idea | Why rejected |
| --- | --- | --- |
| â€” | Expo/RN customer shell | C-5 |
| â€” | Marketplace-wide principal / DIAL-owned stock | D-49 / D-58 |
| â€” | Baileys / unofficial WhatsApp | D-40 |
| â€” | Google/Mapbox as map/distance SoR | D-44 |
| â€” | AI writing payable amounts | v4 Â§4.1 / non-negotiables |
| â€” | Peer `dial-ai-kernel` / Kernel self-host / S24 local-first inference / Prime as prod or parallel Factory SoR / prod agent adapter or alternate prod agent framework | D-61 |

When rejecting a new proposal, add a row here with the lock ID cited.



