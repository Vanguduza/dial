# Phase 3 prep — Native store readiness (not G3)

**Status:** Eng advancing under **G2 eng-exception** sequencing (pretend/sandbox EcoCash). **Do not claim G3** until internal TestFlight/Play builds complete Spare checkout on staging + screenshot matrix.

**Locks:** C-5 (no Expo), D-57 EcoCash|COD, D-47 session cookie SoR.

**Sequencing:** Founder G2 EcoCash exception (`docs/ops/ecocash-pretend-sandbox.md`) unblocks Phase 3 eng work. Staging checkout must still hit sandbox ERP rails (COD + EcoCash-pretend/`eco_sb_*` or portal sandbox) — emulator-only fixture hosts ≠ G3.

## Gateway base URL (key-drop-in)

| Client | Local default | Staging / internal-track |
| --- | --- | --- |
| Android | flavor `local` → `http://10.0.2.2:3000` (`DIAL_GATEWAY_URL_CONFIGURED=true`) | flavor `staging` + `-Pdial.gateway.baseUrl=…` or env `DIAL_GATEWAY_BASE_URL`; empty → `DIAL_GATEWAY_URL_CONFIGURED=false` (fail-closed, no invented host) |
| iOS | `GatewayBaseUrl.resolve()` → `http://127.0.0.1:3000` | env `DIAL_GATEWAY_BASE_URL` or Info.plist `DialGatewayBaseURL`; `resolveForInternalTrack()` returns nil on loopback/empty (TestFlight must set staging HTTPS) |

Empty staging URL = misconfigured build — ops fills when ENH-011 / vault staging host exists. **No invented production hosts in repo.**

```powershell
# Android staging APK (URL from ops — never commit secrets)
cd apps/customer-android
./gradlew :app:assembleStagingDebug -Pdial.gateway.baseUrl=https://YOUR_STAGING_GATEWAY
```

Native-shaped HTTP probe (Windows, no SDK):  
`pnpm --filter @dial/gateway-web exec tsx scripts/g3-native-client-checkout.mts`  
Evidence: `docs/ops/evidence/g3/` — loopback local ≠ G3.

Contract CI (no SDK): `apps/gateway-web/src/lib/spare/pd20CustomerMobile.test.ts` Phase3-prep asserts.

## Store-readiness checklist (internal track only)

- [ ] Release signing keystore / Apple distribution cert documented in vault — [`phase3-release-signing.md`](./phase3-release-signing.md)
- [x] Privacy policy + data-safety form drafts linked (`docs/ops/phase3-privacy-data-safety-draft.md`)
- [ ] Crash reporting sink chosen (ops) — wire when keys present
- [ ] Screenshot matrix: disclosure + EcoCash|COD CTAs on Android **and** iOS devices (web cells reused from G2; native device cells pending)
- [ ] Builds hit **staging gateway** (sandbox rails from G2 eng-exception or live G2) — emulator fixture host alone ≠ G3
- [ ] Play internal testing / TestFlight install completes Spare checkout EcoCash **and** COD

## Explicit non-claims

- Not Play Store / App Store public listing (Phase 12)
- Not G3 green without store evidence above (G2 eng-exception ≠ G3)
- Technician / delivery Android store = later phases
- Live EcoCash portal keys still human — eng-exception pretend path OK for sequencing dogfood only
- Native HTTP contract on loopback ≠ internal-track install evidence

## Related

- `apps/customer-android/README.md`
- `apps/customer-ios/README.md`
- `docs/ops/phase3-store-listing-drafts.md`
- `docs/ops/phase3-privacy-data-safety-draft.md`
- `docs/ops/phase3-release-signing.md`
- `docs/ops/evidence/g3/NOTES.md`
- Completion Plan Phase 3 / G3
