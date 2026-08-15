# Customer Android — Dial a Spare (PD5 + PD20)

**Path:** `apps/customer-android`  
**Lock:** C-5 native Jetpack Compose — **no Expo / React Native / CMP customer UI**.  
**UX donor:** [CoolMallKotlin](https://github.com/Joker-x-dev/CoolMallKotlin) patterns only (catalog/cart/checkout screens).  
**Module shape:** Now in Android–style `:app` + `:core:network`.  
**ERP SoR:** gateway-web APIs — same money path as web (`@dial/payments`).

## Thin vertical (PD20 deepen)

1. Sign-in → `dial_session` cookie (never body `userId`/`role`)  
2. Spare browse USD → `GET /api/search/spare`  
3. Cart USD → EcoCash | COD → `POST /api/spare/checkout` → place ERP order  
4. Orders / track / returns (`payableFromAi=false`) / garage (consent)  
5. Grocery USD browse + EcoCash|COD (no liquor)

## Build

```bash
cd apps/customer-android
./gradlew :core:network:test
./gradlew :app:assembleDebug   # requires Android SDK
```

Emulator gateway default: `BuildConfig.DIAL_GATEWAY_BASE_URL` = `http://10.0.2.2:3000` (host Next.js).

Windows CI without SDK: `apps/gateway-web/src/lib/spare/pd20CustomerMobile.test.ts`.

## Out of scope

Promo/referral share (PD21+) · liquor · Expo · S99
