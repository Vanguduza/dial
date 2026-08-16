# Customer iOS — Dial a Spare (PD8 + PD20)

**Path:** `apps/customer-ios`  
**Lock:** C-5 native **SwiftUI** — **no Expo / React Native / CMP customer UI**.  
**UX donor:** [tunacosgun/eCommerce](https://github.com/tunacosgun/eCommerce) patterns only.  
**ERP SoR:** same gateway APIs as Android (`/api/auth/*`, `/api/search/spare`, `/api/spare/{checkout,orders,returns,garage}`, grocery).

## Layout

| Path | Role |
| --- | --- |
| `Package.swift` + `Sources/DialCustomerCore` | SPM library — DialGatewayClient |
| `Tests/DialCustomerCoreTests` | XCTest — run on macOS: `swift test` |
| `App/DialCustomerApp.swift` | SwiftUI shell — Spare / Orders / Garage / Grocery |

## Thin vertical (PD20 deepen)

1. Sign-in → `dial_session` cookie (never body `userId`/`role`)  
2. Spare browse USD → checkout EcoCash|COD → ERP order  
3. Orders / track / returns / garage consent  
4. Grocery USD browse + EcoCash|COD (no liquor)

## Build / test

```bash
cd apps/customer-ios
swift test                    # macOS / Linux with Swift 5.9+
xcodegen generate             # regenerates DialCustomer.xcodeproj from project.yml
```

Committed `DialCustomer.xcodeproj` is the archive/export target (`ExportOptions.plist`). Signing uses `APPLE_DEVELOPMENT_TEAM` / distribution cert from vault — no invented certs in git.


CI host without Swift: Node contract `apps/gateway-web/src/lib/spare/pd20CustomerMobile.test.ts`.

Simulator gateway: `GatewayBaseUrl.resolve()` → env `DIAL_GATEWAY_BASE_URL` → Info.plist `DialGatewayBaseURL` → `http://127.0.0.1:3000`.

Phase 3 prep (not G3): set staging URL via env or plist — `GatewayBaseUrl.resolveForInternalTrack()` rejects loopback (TestFlight). See `docs/ops/phase3-native-store-readiness.md`.

## Out of scope

Liquor · Expo · S99

