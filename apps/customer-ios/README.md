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
```

CI host without Swift: Node contract `apps/gateway-web/src/lib/spare/pd20CustomerMobile.test.ts`.

Simulator gateway: `DIAL_GATEWAY_BASE_URL=http://127.0.0.1:3000`.

## Out of scope

Liquor · Expo · S99

