# Technician Android — PD9

**Path:** `apps/technician-android`  
**Lock:** C-5 Jetpack Compose — **no Expo**.  
**UX donor:** Now in Android module layout.  
**Job SoR:** `@dial/jobs` via gateway `/api/tech/technician`.  
**Slots:** Cal.com (fixture when `CALCOM_*` unset) — book UI also on `/tech/book`.  
**Money:** Take-Home preview uses `@dial/payments` WHT 30% (D-50) — drafts only.

## Thin vertical

1. Sign-in → `dial_session`  
2. Seed assigned job (Cal.com fixture slot + `rate_card` quote)  
3. Checklist runner (automotive / emergency)  
4. Evidence upload  
5. Take-Home WHT preview  

## Build

```bash
cd apps/technician-android
./gradlew :core:network:test
./gradlew :app:assembleDebug   # requires Android SDK
```

Gateway: `BuildConfig.DIAL_GATEWAY_BASE_URL` = `http://10.0.2.2:3000`.
