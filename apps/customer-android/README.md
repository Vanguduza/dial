# Customer Android — Dial a Spare (PD5)

**Path:** `apps/customer-android`  
**Lock:** C-5 native Jetpack Compose — **no Expo / React Native / CMP customer UI**.  
**UX donor:** [CoolMallKotlin](https://github.com/Joker-x-dev/CoolMallKotlin) patterns only (catalog/cart/checkout screens).  
**Module shape:** Now in Android–style `:app` + `:core:network`.  
**ERP SoR:** gateway-web APIs (`/api/auth/*`, `/api/search/spare`, `/api/spare/checkout`) — same money path as web (`@dial/payments`).

## Thin vertical

1. Sign-in → `dial_session` cookie (never body `userId`/`role`)  
2. Spare browse USD → `GET /api/search/spare`  
3. Cart USD → EcoCash | COD → `POST /api/spare/checkout`

## Build

```bash
cd apps/customer-android
./gradlew :core:network:test
./gradlew :app:assembleDebug   # requires Android SDK
```

Emulator gateway default: `BuildConfig.DIAL_GATEWAY_BASE_URL` = `http://10.0.2.2:3000` (host Next.js).

## Out of scope (later tickets)

PD6 supplier-web · PD7 delivery-android · iOS · liquor · Expo
