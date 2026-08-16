# Phase 3 — Store listing drafts (internal track; not G3)

**Status:** Eng draft placeholders for privacy / data-safety / screenshot matrix.  
**Not G3** until builds install on Play internal / TestFlight and complete Spare checkout against staging.

## Vault names only (no secrets in git)

| Artifact | Vault / ops name (example) | In-repo |
| --- | --- | --- |
| Android upload keystore | `DIAL_ANDROID_UPLOAD_KEYSTORE` | never commit |
| Apple distribution cert | `DIAL_APPLE_DISTRIBUTION_CERT` | never commit |
| Staging gateway URL | `DIAL_GATEWAY_BASE_URL` / ENH-011 | flavors + Info.plist keys only |

## Privacy / data-safety (draft outline)

Full questionnaire: [`phase3-privacy-data-safety-draft.md`](./phase3-privacy-data-safety-draft.md).

Link targets when ops publishes drafts (do not invent legal text here):

- Privacy policy URL (staging): _ops fills_ — field inventory: [`phase3-privacy-data-safety-draft.md`](./phase3-privacy-data-safety-draft.md)
- Data-safety form fields: session cookie AuthN; order/payment metadata; garage vehicle consent; no body `userId`/role (D-47)
- Crash sink: _ops chooses_ (wire when keys present)
- Release signing runbook: [`phase3-release-signing.md`](./phase3-release-signing.md)

## Screenshot matrix template (web ∥ Android ∥ iOS)

| Screen | Web evidence | Android | iOS |
| --- | --- | --- | --- |
| Spare browse USD | `docs/ops/evidence/g2/spare-browse-desktop.png` / `spare-browse-mobile.png` | _pending device_ | _pending device_ |
| Cart USD | `spare-cart-desktop.png` / `spare-cart-mobile.png` | _pending_ | _pending_ |
| Disclosure + EcoCash\|COD CTAs | `spare-checkout-ctas-desktop.png` / `spare-checkout-ctas-mobile.png` | CTA strings in `DialApp.kt` (`Pay EcoCash`, `Cash on delivery (USD)`) — device PNG pending | CTA strings in `DialCustomerApp.swift` — device PNG pending |
| Pay done (COD) | `spare-cod-after-desktop.png` / `spare-cod-after-mobile.png` | native HTTP probe `android_cod` | native HTTP probe `ios_cod` |
| Pay done (EcoCash) | signed-in API `eco_sb_*` | native HTTP probe `android_ecocash` | native HTTP probe `ios_ecocash` |

Native HTTP evidence: `docs/ops/evidence/g3/native-client-checkout.json` (loopback ≠ G3).

## Contract tests (Windows CI without SDKs)

```powershell
pnpm --filter @dial/gateway-web exec node --import tsx --test src/lib/spare/pd20CustomerMobile.test.ts
pnpm --filter @dial/gateway-web exec tsx scripts/g3-native-client-checkout.mts
```

## Related

- `docs/ops/phase3-native-store-readiness.md`
- `docs/ops/phase3-privacy-data-safety-draft.md`
- `docs/ops/ecocash-pretend-sandbox.md` (G2 eng-exception sequencing)
