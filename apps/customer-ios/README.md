# Customer iOS — Dial a Spare (PD8)

**Path:** `apps/customer-ios`  
**Lock:** C-5 native **SwiftUI** — **no Expo / React Native / CMP customer UI**.  
**UX donor:** [tunacosgun/eCommerce](https://github.com/tunacosgun/eCommerce) patterns only.  
**ERP SoR:** same gateway APIs as PD5 Android (`/api/auth/*`, `/api/search/spare`, `/api/spare/checkout`).

## Layout

| Path | Role |
| --- | --- |
| `Package.swift` + `Sources/DialCustomerCore` | SPM library — DialGatewayClient (cookie session, USD browse, EcoCash\|COD) |
| `Tests/DialCustomerCoreTests` | XCTest — run on macOS: `swift test` |
| `App/DialCustomerApp.swift` | SwiftUI shell (sign-in → browse → checkout) — wire as Xcode app target against DialCustomerCore |

## Thin vertical

1. Sign-in → `dial_session` cookie (never body `userId`/`role`)  
2. Spare browse USD → `GET /api/search/spare`  
3. Cart USD → EcoCash | COD → `POST /api/spare/checkout`

## Build / test

```bash
cd apps/customer-ios
swift test                    # macOS / Linux with Swift 5.9+
```

CI host without Swift: Node contract `apps/gateway-web/src/lib/spare/pd8IosContract.test.ts` locks the same API parity.

Simulator gateway: `DIAL_GATEWAY_BASE_URL=http://127.0.0.1:3000`.

## Out of scope

PD9 technician-android · S99 · liquor · Expo
