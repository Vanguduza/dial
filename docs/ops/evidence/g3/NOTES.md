# G3 evidence notes — Phase 3 native (not G3)

**Gate:** Internal TestFlight / Play internal builds complete Spare checkout on **staging gateway**; contract tests green; screenshot matrix web ∥ Android ∥ iOS for disclosure + EcoCash|COD CTAs.

**Status (2026-08-16):** Eng advancing — **not G3**. G2 eng-exception unblocks sequencing; store/signing/staging URL still human.

## Sequencing

| Dependency | Status |
| --- | --- |
| G2 eng-exception (pretend EcoCash `eco_sb_*`) | **green** — see `docs/ops/evidence/g2/NOTES.md` |
| G2 live/production EcoCash | **open** |
| Staging gateway URL (ENH-011) | **blocked_on_human** |
| Play internal / TestFlight install + checkout | **pending** |
| Release signing keystore / Apple cert | **blocked_on_human** (vault names in `docs/ops/phase3-release-signing.md`) |

## Screenshot matrix (web ∥ Android ∥ iOS)

| Screen | Web (G2 evidence) | Android | iOS |
| --- | --- | --- | --- |
| Spare browse USD | [`spare-browse-desktop.png`](../g2/spare-browse-desktop.png) · [`spare-browse-mobile.png`](../g2/spare-browse-mobile.png) | _pending device_ | _pending device_ |
| Cart USD | [`spare-cart-desktop.png`](../g2/spare-cart-desktop.png) · [`spare-cart-mobile.png`](../g2/spare-cart-mobile.png) | _pending_ | _pending_ |
| Disclosure + EcoCash\|COD CTAs | [`spare-checkout-ctas-desktop.png`](../g2/spare-checkout-ctas-desktop.png) · [`spare-checkout-ctas-mobile.png`](../g2/spare-checkout-ctas-mobile.png) | _pending_ (`testTag`/`accessibilityIdentifier`: `cpa-review-ack`, `pay-ecocash`, `pay-cod`) | _pending_ |
| Pay done (COD) | [`spare-cod-after-desktop.png`](../g2/spare-cod-after-desktop.png) · [`spare-cod-after-mobile.png`](../g2/spare-cod-after-mobile.png) | _pending_ | _pending_ |
| Pay done (EcoCash) | signed-in API `eco_sb_*` (`scripts/g2-signed-in-ecocash-api.mts`) | _pending_ | _pending_ |

Native UI sources implement CPA ack + EcoCash|COD buttons (contract: `pd20CustomerMobile.test.ts` Phase3-prep).

## Contract tests (Windows CI)

```powershell
pnpm --filter @dial/gateway-web exec node --import tsx --test src/lib/spare/pd20CustomerMobile.test.ts
```

Last run this session: **5/5 pass** (PD20 + Phase3-prep + store drafts + API parity).

## Native HTTP contract probe (loopback — not G3)

Script: `apps/gateway-web/scripts/g3-native-client-checkout.mts`  
Evidence: [`native-client-checkout.json`](./native-client-checkout.json)

| Rail | Client prefix | Status | `eco_sb_*` | leaks |
| --- | --- | --- | --- | --- |
| COD | `android-*` | 200 ok | n/a | 0 |
| EcoCash | `android-*` | 200 ok | yes | 0 |
| COD | `ios-*` | 200 ok | n/a | 0 |
| EcoCash | `ios-*` | 200 ok | yes | 0 |

`native_contract_rails_ok=true` on loopback — **does not exit G3** (staging URL + device install + screenshots still required).

## Gateway URL (key-drop-in)

| Client | Local | Staging (G3 requires) |
| --- | --- | --- |
| Android | flavor `local` → `10.0.2.2:3000` | flavor `staging` + `-Pdial.gateway.baseUrl=` or `DIAL_GATEWAY_BASE_URL` |
| iOS | `GatewayBaseUrl.resolve()` → localhost | env / plist; `resolveForInternalTrack()` rejects loopback |

Empty staging URL → Android `DIAL_GATEWAY_URL_CONFIGURED=false` (fail-closed).

## Anti-stub reminders

- Emulator-only loopback / empty gateway ≠ G3 exit.
- EcoCash|COD must complete against sandbox ERP rails (G2 eng-exception OK for sequencing dogfood).
- Web G2 screenshots do **not** substitute for native store evidence.

## Related

- `docs/ops/phase3-native-store-readiness.md`
- `docs/ops/phase3-release-signing.md`
- `docs/ops/phase3-privacy-data-safety-draft.md`
