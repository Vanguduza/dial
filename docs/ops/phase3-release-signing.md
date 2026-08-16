# Phase 3 — Release signing pipeline (internal track; not G3)

**Status:** Eng runbook for Play internal testing + TestFlight.  
**Not G3** until signed builds install and complete Spare checkout on **staging gateway** (non-loopback).

## Vault names only (never commit keystores/certs)

| Platform | Vault artifact | Env / property name |
| --- | --- | --- |
| Android upload keystore | `.jks` or `.keystore` file | `DIAL_ANDROID_UPLOAD_KEYSTORE` (path in vault) |
| Android keystore password | — | `DIAL_ANDROID_KEYSTORE_PASSWORD` |
| Android key alias | — | `DIAL_ANDROID_KEY_ALIAS` |
| Android key password | — | `DIAL_ANDROID_KEY_PASSWORD` |
| Apple distribution cert + profile | `.p12` / `.mobileprovision` in vault | `DIAL_APPLE_DISTRIBUTION_CERT` |
| App Store Connect API key (optional CI) | `.p8` in vault | `DIAL_APP_STORE_CONNECT_API_KEY` |

Repo contains **no** keystore bytes — only flavor/URL wiring and this runbook.

## Android — Play internal testing

**Prerequisites:** Android SDK; staging gateway URL from ENH-011 / vault (`DIAL_GATEWAY_BASE_URL`).

```powershell
cd apps/customer-android

# Staging debug (dogfood on emulator/device against ops staging host)
./gradlew :app:assembleStagingDebug -Pdial.gateway.baseUrl=https://YOUR_STAGING_GATEWAY

# Release bundle (after vault keystore env vars set on CI runner — names only here)
# ./gradlew :app:bundleStagingRelease -Pdial.gateway.baseUrl=https://YOUR_STAGING_GATEWAY
```

| Flavor | `DIAL_GATEWAY_URL_CONFIGURED` | G3 note |
| --- | --- | --- |
| `local` | true (10.0.2.2:3000) | Local dogfood only — not G3 |
| `staging` + empty URL | **false** (fail-closed UI) | Prevents accidental fixture host |
| `staging` + ops URL | true | Required for internal-track evidence |

Upload `.aab` to Play Console → **Internal testing** track. Screenshot matrix: `docs/ops/evidence/g3/NOTES.md`.

## iOS — TestFlight

**Prerequisites:** Xcode; Apple distribution cert in vault; staging URL via env or Info.plist `DialGatewayBaseURL`.

```bash
cd apps/customer-ios
export DIAL_GATEWAY_BASE_URL=https://YOUR_STAGING_GATEWAY   # ops — never commit
open App/DialCustomerApp.xcodeproj   # when Xcode project scaffold present
# Archive → Distribute → TestFlight (internal group)
```

`GatewayBaseUrl.resolveForInternalTrack()` returns **nil** for loopback/empty URLs — use for CI guard that blocks accidental G3 claims on simulator defaults.

Simulator/local: `GatewayBaseUrl.resolve()` → env → plist → `http://127.0.0.1:3000`.

## Contract CI (no SDK on Windows)

```powershell
pnpm --filter @dial/gateway-web exec node --import tsx --test src/lib/spare/pd20CustomerMobile.test.ts
```

## Explicit non-claims

- Public Play / App Store listing = Phase 12
- Technician / delivery store apps = later phases
- G3 green requires staging checkout EcoCash **and** COD on **installed** internal builds — web evidence alone ≠ G3

## Related

- `apps/customer-android/README.md`
- `apps/customer-ios/README.md`
- `docs/ops/phase3-native-store-readiness.md`
