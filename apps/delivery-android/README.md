# Delivery Android — PD7

**Path:** `apps/delivery-android`  
**Lock:** C-5 Jetpack Compose — **no Expo**.  
**UX donor:** foodhub-compose rider patterns only.  
**Job SoR:** `@dial/delivery` + `DeliveryDispatchWorkflow` (Temporal-shaped) — not Fleetbase.  
**Maps SoR:** MapLibre (admin `/admin/delivery/track` pins from `postCourierLocation`) — not Google/Mapbox (D-44).

## Thin vertical

1. Sign-in → `dial_session`  
2. Availability → seed/accept|reject offer  
3. Transit + post location (Harare)  
4. POD + COD USD minor reconcile  

## Build

```bash
cd apps/delivery-android
./gradlew :core:network:test
./gradlew :app:assembleDebug   # requires Android SDK
```

Gateway: `BuildConfig.DIAL_GATEWAY_BASE_URL` = `http://10.0.2.2:3000`.
