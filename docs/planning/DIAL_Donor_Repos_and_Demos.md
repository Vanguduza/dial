# DIAL donor repositories and demos

**Date:** 2026-08-17

**D-38 lock.** Donors exist so DIAL does not design storefronts from scratch. Use each donor’s **look, layout, screens, features, and workflows**. Customise copy/branding for DIAL. **Wire every action to DIAL APIs.** Do **not** adopt donor backends, ledgers, auth providers, or payment stacks as system of record. Money = `amountMinor` + DIAL packages. WhatsApp = official Cloud API only.

**How to read demo labels.** **Live demo** = hosted site, GitHub Pages, Vercel, Play Store, or APK host. **README / screenshots** = no hosted product UI; the official repo README, docs, or video is the honest look. **Unverified** means this pass could not confirm HTTP success (timeout, 404, or block) — the official URL is still listed.

**Count:** 75 named rows (unique donor × surface grouping).

**Hard ban:** one shared DIAL `AppShell` skin across Spare, Tech, Grocery, Supplier, Delivery, Account. Each customer branch keeps its locked donor identity.

## Contents

- [1. Surfaces with no storefront UX donor](#no-donor)
- [2. D-38 storefront and native UX donors](#d38)
- [3. Dial Laundry — laundry-specific UX donors](#laundry)
- [4. Delivery, maps, and dispatch (not D-38 storefronts)](#delivery)
- [5. Schema-only and rejected-as-SoR (named so they are not confused with D-38)](#schema-reject)
- [6. Secondary / ops — experience tools and D-46 complements (not D-38 storefronts)](#ops)

## Extra official URLs (same donors)

- FixItNow GitHub homepage also lists [fix-it-now-chi-beige.vercel.app](https://fix-it-now-chi-beige.vercel.app/) (404 on this pass — unverified). Server/API homepage: [fixitnow-v1.vercel.app](https://fixitnow-v1.vercel.app/).
- Mercur also publishes a full-stack click-through at [demo.mercurjs.com](https://demo.mercurjs.com/).
- CoolMallKotlin README GIFs: [README_EN.md](https://github.com/Joker-x-dev/CoolMallKotlin/blob/main/README_EN.md).

## 1. Surfaces with no storefront UX donor

These DIAL surfaces are intentionally not cloned from a marketplace donor. Do not FixItNow-skin admin, and do not invent a WhatsApp UI kit.

| Branch / app | Donor | Role | Repo | Demo | Licence | How DIAL uses it |
| --- | --- | --- | --- | --- | --- | --- |
| WhatsApp (Cloud API + Flows) | None — official Cloud API only (D-40) | none (no UX donor) | [Meta WhatsApp Cloud API docs](https://developers.facebook.com/docs/whatsapp) | [README / screenshots — Cloud API + Flows docs (not a UX kit)](https://developers.facebook.com/docs/whatsapp/cloud-api) | Proprietary API | Official Cloud API + Flows only. EcoCash + COD as buttons (D-57). No Baileys / unofficial clients. Not FixItNow. |
| Admin (`admin-web`) | In-repo queue-first IA (Pack §9.5 / v4 §6.17) | none (no UX donor) | [In-repo Pack §9.5 (this monorepo)](https://github.com/Vanguduza/dial) | [README / screenshots — Pack §9.5 + D-46 complements below](https://github.com/Vanguduza/dial/blob/main/DIAL_Development_Agent_Pack.md) | DIAL in-repo | Queue-first modules A–P. Do not copy FixItNow admin-dashboard. D-46 (CSV, Tracktor, Plane, bull-board, Schedule-X) are complements only. |
| Account (`/account/*`) | None — follows entry branch chrome | none (no UX donor) | [In-repo Donor Parity Roadmap §10](https://github.com/Vanguduza/dial/blob/main/docs/planning/DIAL_Donor_Parity_Roadmap.md) | [README / screenshots — docs/planning/DIAL_Donor_Parity_Roadmap.md §10](https://github.com/Vanguduza/dial/blob/main/docs/planning/DIAL_Donor_Parity_Roadmap.md) | n/a | Not a sixth storefront. Chrome follows Spare (Mercur) or Tech (FixItNow) entry, or a minimal door. Promo credit: D-42, no cash-out. |
| Gateway door (`/`, `/home`) | None — neutral Shop \| Services chooser | none (no UX donor) | [In-repo Pack §9.1](https://github.com/Vanguduza/dial/blob/main/DIAL_Development_Agent_Pack.md) | [README / screenshots — DIAL_Development_Agent_Pack.md §9.1](https://github.com/Vanguduza/dial/blob/main/DIAL_Development_Agent_Pack.md) | n/a | Auth-first door stays neutral. Destinations are branded. Magic UI + Rive are flourishes only (see D-38 table), not a storefront identity. |

## 2. D-38 storefront and native UX donors

Locked stitch kit (v4 §6.2.1 / Pack §9 / donor-identity rule). Pattern look, screens, and workflows onto DIAL APIs. Never adopt donor backends, ledgers, auth, or payments as system of record.

| Branch / app | Donor | Role | Repo | Demo | Licence | How DIAL uses it |
| --- | --- | --- | --- | --- | --- | --- |
| Spare web (primary); Grocery web (IA + food collections); Laundry (multivendor pattern) | Mercur B2C marketplace storefront | primary UX donor | [mercurjs/b2c-marketplace-storefront](https://github.com/mercurjs/b2c-marketplace-storefront) | [Live demo — b2c.mercurjs.com](https://b2c.mercurjs.com/) | MIT family (confirm storefront LICENSE at clone) | Multi-vendor catalog, seller pages, cart/checkout chrome. Grocery reuses marketplace IA with food tokens — not a new food repo this cycle. DIAL APIs + Meili remain SoR. |
| Spare web | Your Next Store | secondary | [yournextstore/yournextstore](https://github.com/yournextstore/yournextstore) | [Live demo — demo.yournextstore.com](https://demo.yournextstore.com/) | Confirm at clone (v4 polish option; not primary) | Visual polish for PDP/cart only. Not the Spare primary donor. Do not adopt YNS checkout/payments as SoR. |
| Spare web | Nimara ecommerce | secondary | [mirumee/nimara-ecommerce](https://github.com/mirumee/nimara-ecommerce) | [Live demo — demo.nimara.store (unverified: HTTP 500 on 2026-08-17)](https://demo.nimara.store/) | BSD-family (confirm at clone) | Alternate visual polish to Your Next Store. Pattern screens only; DIAL catalogue/checkout SoR. |
| Spare web | Medusa DTC starter | secondary | [medusajs/dtc-starter](https://github.com/medusajs/dtc-starter) | [Product site — medusajs.com (no dedicated dtc-starter hosted demo)](https://medusajs.com/) | MIT | PDP / cart / checkout interaction patterns. Not Medusa as commerce or money SoR. |
| Tech web (primary); Laundry (Services hub peer) | FixItNow | primary UX donor | [AyanSujon/FixItNow](https://github.com/AyanSujon/FixItNow) | [Live demo — fixitnow-client.vercel.app (README Live Project)](https://fixitnow-client.vercel.app/) | Missing LICENSE (recreate / founder UI-copy override; no donor backend) | Orange home-services marketplace: discover → book → rate. Wire to DIAL Job Reserve + rate_card. Do not copy Stripe/SSLCommerz/JWT/Mongo. |
| Tech web | NearServe | secondary | [Pranit-DC/nearserve](https://github.com/Pranit-DC/nearserve) | [Live demo — nearserve.vercel.app](https://nearserve.vercel.app/) | MIT (confirm at Gate 1 paste) | Local-trades discovery polish. Companion only — FixItNow stays primary. Strip Google Maps if studying screens. |
| Tech web | Homezy | secondary | [PrashantJaybhaye/homezy](https://github.com/PrashantJaybhaye/homezy) | [Live demo — homezy-mu.vercel.app](https://homezy-mu.vercel.app/) | Confirm at Gate 1 (no paste until SPDX) | Calm booking visuals. Companion only. Recreate; do not vendor backend/payments. |
| Supplier web; Laundry plant portal | Mercur vendor-panel | primary UX donor | [mercurjs/vendor-panel](https://github.com/mercurjs/vendor-panel) | [Live demo — vendor.mercurjs.com](https://vendor.mercurjs.com/) | MIT family (repo archived; panel now also in mercurjs/mercur) | Seller catalog, orders, payouts, onboarding IA. Wire to @dial/suppliers. Not Mercur/Medusa as order SoR. |
| Customer Android (Spare + Grocery paths) | CoolMallKotlin | primary UX donor | [Joker-x-dev/CoolMallKotlin](https://github.com/Joker-x-dev/CoolMallKotlin) | [Live demo — Pgyer APK (not Play Store)](https://www.pgyer.com/CoolMallKotlinProdRelease) | MIT | Compose catalog / cart / orders. Recreate shopping UX; DIAL gateway APIs. No Expo. README also has GIFs. |
| Customer Android | Dukkan | secondary | [Dukkan-ITI/Dukkan](https://github.com/Dukkan-ITI/Dukkan) | [README / screenshots — no Play Store listing for this student repo](https://github.com/Dukkan-ITI/Dukkan/blob/develop/README.md) | Confirm at Gate 1 | Alternate Compose storefront flows. Strip Shopify/Paymob/Google Maps; DIAL APIs only. |
| Customer iOS (Spare + Grocery paths) | tunacosgun/eCommerce | primary UX donor | [tunacosgun/eCommerce](https://github.com/tunacosgun/eCommerce) | [README / screenshots — no App Store listing found](https://github.com/tunacosgun/eCommerce) | MIT (README badge; confirm LICENSE at clone) | SwiftUI shopping: browse, cart, orders. Recreate; DIAL APIs. Do not adopt Firebase/Stripe as SoR. |
| Customer iOS | Pow | secondary | [EmergeTools/Pow](https://github.com/EmergeTools/Pow) | [README / screenshots — SwiftUI transition library](https://github.com/EmergeTools/Pow) | MIT | Micro-interaction polish only — not a storefront. |
| Technician Android (architecture); Delivery Android (modules) | Now in Android | primary UX donor | [android/nowinandroid](https://github.com/android/nowinandroid) | [Live demo — Google Play listing](https://play.google.com/store/apps/details?id=com.google.samples.apps.nowinandroid) | Apache-2.0 | Offline-first module skeleton (job cache, evidence queue). Tech workflows still FixItNow-shaped; money = DIAL Take-Home + WHT. |
| Technician Android | Android Compose samples (Jetsnack / Reply / Jetcaster) | secondary | [android/compose-samples](https://github.com/android/compose-samples) | [README / screenshots — Android Developers sample catalog](https://developer.android.com/develop/ui/compose/samples) | Apache-2.0 | Material 3 motion polish. Not a product storefront donor. |
| Delivery Android (primary); Grocery / Laundry courier screens | foodhub-compose (rider flavour) | primary UX donor | [furqanullah717/foodhub-compose](https://github.com/furqanullah717/foodhub-compose) | [README / screenshots + YouTube series (no Play Store for this tutorial repo)](https://www.youtube.com/playlist?list=PL0pXjGnY7PORsStPOklvOMPOTXoS1-bkP) | Apache-2.0 | Rider offer / run / POD / COD chrome. Strip Google Maps → MapLibre; strip Stripe/Firebase money. Job engine = packages/delivery. |
| Web primitives (Tech copied set; Spare/Grocery must not inherit Tech orange) | shadcn/ui | library | [shadcn-ui/ui](https://github.com/shadcn-ui/ui) | [Live demo — ui.shadcn.com](https://ui.shadcn.com/) | MIT | Radix + Tailwind primitives vendored in-repo. Inside donor-patterned screens — not a substitute for Mercur/FixItNow storefronts. |
| Gateway welcome / marketing flourishes only | Magic UI | secondary | [magicuidesign/magicui](https://github.com/magicuidesign/magicui) | [Live demo — magicui.design](https://magicui.design/) | MIT | Gateway welcome-back flourishes only. Not Spare/Tech/Grocery storefront identity. |
| Cross-app tokens (admin / native / print — not shared customer storefront skin) | Style Dictionary | library | [amzn/style-dictionary](https://github.com/amzn/style-dictionary) | [Live demo — styledictionary.com](https://styledictionary.com/) | Apache-2.0 | packages/design-tokens JSON → Tailwind / Swift / Compose. Not one DIAL storefront brand across branches. |
| Gateway / home motion | Rive (official runtimes) | library | [rive-app/rive-react](https://github.com/rive-app/rive-react) | [Live demo — rive.app](https://rive.app/) | Runtime OK (proprietary editor; official runtimes) | Same .riv greeting/host asset on web/Android/iOS. Optional. Not a storefront donor. |

## 3. Dial Laundry — laundry-specific UX donors

From DIAL_Laundry_Consolidated_Blueprint.md Part C. Mature laundry OSS is scarce. Prefer Dial a Tech + grocery dual-slot + Spare agency spine; absorb laundry repos as screen donors only. FixItNow, Mercur, foodhub, PicPeak, Cal.com, and Schedule-X are listed in their primary sections and reused here.

| Branch / app | Donor | Role | Repo | Demo | Licence | How DIAL uses it |
| --- | --- | --- | --- | --- | --- | --- |
| Dial Laundry (P0 research) | Lavandaria | primary UX donor | [HSousa1987/Lavandaria](https://github.com/HSousa1987/Lavandaria) | [README / screenshots — no hosted demo found](https://github.com/HSousa1987/Lavandaria) | MIT | Kg + itemized orders, condition-photo verification, status lifecycle. Pattern only — not money SoR. |
| Dial Laundry (P1) | Dry-Drop | secondary | [JordanCJ7/Dry-Drop](https://github.com/JordanCJ7/Dry-Drop) | [Live demo — GitHub homepage InfinityFree](https://drydrop.infinityfreeapp.com/) | MIT | PHP laundry pickup/delivery scheduling, COD, customer/admin dashboards. Screen flows only. |
| Dial Laundry (P1) | Daya Laundry | secondary | [ahmadnurhidayat/laundry](https://github.com/ahmadnurhidayat/laundry) | [Live demo — laundry.beyondyou.my.id (README deploy URL)](https://laundry.beyondyou.my.id/) | Check SPDX at Gate 1 | Per-kg / per-item POS, public track token, thermal receipt layout. Fiscal truth = DIAL FDMS, not the donor receipt engine. |
| Dial Laundry (P1 POS) | we-laundry-client | secondary | [hxxtae/we-laundry-client](https://github.com/hxxtae/we-laundry-client) | [Live demo — welaundry.netlify.app](https://welaundry.netlify.app/) | Apache-2.0 (verify) | Dry-shop POS intake UX. Strip foreign payments; DIAL APIs. |
| Dial Laundry (Park — screen sketch) | Sunshine Laundrymat | secondary | [nrobbyjay/sunshinelaundrymat](https://github.com/nrobbyjay/sunshinelaundrymat) | [README / screenshots — WIP; no hosted demo found](https://github.com/nrobbyjay/sunshinelaundrymat) | MIT | Immature wash/fold + P/D boilerplate. Sketch only. |
| Dial Laundry (Park) | WashWise | secondary | [MrPatt025/WashWise](https://github.com/MrPatt025/WashWise) | [README / screenshots — no hosted demo found](https://github.com/MrPatt025/WashWise) | Claims MIT (verify) | Park / likely reject as SoR. Low-maturity laundromat SaaS — not Dial job SoR. |
| Dial Laundry / Tech dispatch boards (P1) | Open Field Scheduling | secondary | [clawnify/open-fieldservice](https://github.com/clawnify/open-fieldservice) | [README / screenshots — local demo only (localhost:5174)](https://github.com/clawnify/open-fieldservice) | MIT (verify) | FSM dispatch UI study. Immature stars. Not delivery job SoR (D-45). |
| Dial Laundry POS ticket UI | opensourcepos | secondary | [opensourcepos/opensourcepos](https://github.com/opensourcepos/opensourcepos) | [Product site — opensourcepos.org](https://www.opensourcepos.org/) | MIT (+ footer retention clause) | Retail ticket UI study only. REJECT as runtime / agency FDMS SoR. |
| Dial Laundry (REJECT runtime) | Smart Laundry Basket | rejected-as-SoR | [sureshalluru/smart_laundry](https://github.com/sureshalluru/smart_laundry) | [README / screenshots — optional UX screenshots only with counsel](https://github.com/sureshalluru/smart_laundry) | Elastic-2.0 (not OSI) | ELv2 + Google Maps + Stripe defaults. Reject as self-host marketplace runtime. Optional park screenshots with counsel. |

## 4. Delivery, maps, and dispatch (not D-38 storefronts)

D-44 / D-45 / D-45a. Courier Android UX is foodhub-compose (section 2). Job engine stays in-repo. Maps = MapLibre + Nominatim + OSRM + VROOM — not Google/Mapbox as SoR.

| Branch / app | Donor | Role | Repo | Demo | Licence | How DIAL uses it |
| --- | --- | --- | --- | --- | --- | --- |
| Delivery dispatch (packages/delivery + Temporal) | AWS Last Mile Hyperlocal | algorithm donor | [aws-samples/aws-last-mile-delivery-hyperlocal](https://github.com/aws-samples/aws-last-mile-delivery-hyperlocal) | [README / screenshots — no hosted product demo (sample repo)](https://github.com/aws-samples/aws-last-mile-delivery-hyperlocal) | MIT-0 | Reimplement offer → accept/reject → requeue + ranking into Temporal. Do not run AWS IoT/Step Functions/Dynamo as SoR. |
| Delivery / admin / customer track maps | MapLibre GL JS + Native | library | [maplibre/maplibre-gl-js](https://github.com/maplibre/maplibre-gl-js) | [Live demo — maplibre.org](https://maplibre.org/) | BSD-3-Clause | Client map SoR (D-44). Native: maplibre-native. Not a storefront donor. |
| Delivery Android maps | maplibre-compose | library | [maplibre/maplibre-compose](https://github.com/maplibre/maplibre-compose) | [README / screenshots — MapLibre Compose docs](https://maplibre.org/maplibre-compose/) | BSD | Compose bindings for courier map. Replace donor Google Maps. |
| Geocoding sibling | Nominatim | ops sibling | [osm-search/Nominatim](https://github.com/osm-search/Nominatim) | [Live demo — nominatim.openstreetmap.org](https://nominatim.openstreetmap.org/) | GPL-2.0 (server) | Self-host geocode sibling. Pin/landmark — not Google Geocoding as SoR. |
| Drive-time / distance | OSRM | ops sibling | [Project-OSRM/osrm-backend](https://github.com/Project-OSRM/osrm-backend) | [Live demo — map.project-osrm.org](https://map.project-osrm.org/) | BSD-2-Clause | Self-host drive-time bands + ETA (Blueprint I-2). |
| Multi-stop VRP (post-accept) | VROOM | ops sibling | [VROOM-Project/vroom](https://github.com/VROOM-Project/vroom) | [README / screenshots — no public hosted VRP playground as product demo](https://github.com/VROOM-Project/vroom) | BSD-2-Clause | Courier + tech multi-stop after accept. Not who gets the job. |
| Delivery VRP alternate (not offer-cycle) | jsprit | secondary | [graphhopper/jsprit](https://github.com/graphhopper/jsprit) | [README / screenshots](https://github.com/graphhopper/jsprit) | Apache-2.0 | Keep as VRP alternate if VROOM fails. Reject as offer-engine. |
| Delivery Android (MIT secondary mention in stitch bake-off) | Deliverr | secondary | [kaaneneskpc/Deliverr](https://github.com/kaaneneskpc/Deliverr) | [README / screenshots](https://github.com/kaaneneskpc/Deliverr) | MIT | Another Compose food-delivery flavour. foodhub-compose remains D-44 primary. |
| Delivery product pattern (AGPL — never job SoR) | Fleetbase + Navigator | rejected-as-SoR | [fleetbase/fleetbase](https://github.com/fleetbase/fleetbase) | [Product site — fleetbase.io](https://www.fleetbase.io/) | AGPL-3.0 | Study Fleet-Ops lifecycle + Navigator POD/QR. Do not fork into monorepo; do not run as job engine (D-45). |
| Delivery Navigator app (AGPL reference) | Fleetbase Navigator | rejected-as-SoR | [fleetbase/navigator-app](https://github.com/fleetbase/navigator-app) | [README / screenshots — RN courier app (C-5: pattern only, not customer shell)](https://github.com/fleetbase/navigator-app) | AGPL-3.0 | POD, QR, issue/fuel reports. Reference-only. Courier app is native Kotlin + foodhub patterns. |
| Delivery stack-shape (AGPL — immature) | Witylogix | rejected-as-SoR | [wityliti/witylogix](https://github.com/wityliti/witylogix) | [README / screenshots](https://github.com/wityliti/witylogix) | AGPL-3.0 | Closest infra rhyme (BullMQ + OSRM). Pattern/workflow only — never runtime SoR. |

## 5. Schema-only and rejected-as-SoR (named so they are not confused with D-38)

These appear in v4 / stitch / Pack. They are either catalogue/promo schema references or explicit non-donors (licence, Expo/RN, second money engine).

| Branch / app | Donor | Role | Repo | Demo | Licence | How DIAL uses it |
| --- | --- | --- | --- | --- | --- | --- |
| Spare fitment / PIM (not customer UI) | SandPIM | schema-only | [autopartsource/sandpim](https://github.com/autopartsource/sandpim) | [README / screenshots — PHP/LAMP app; no DIAL-usable hosted UI demo](https://github.com/autopartsource/sandpim) | MIT | ACES/PIES cross-check for FitmentClaim / vehicle_master. Wrong stack to run or fork as SoR. |
| Marketplace domain shapes (not money SoR) | Mercur core | schema-only | [mercurjs/mercur](https://github.com/mercurjs/mercur) | [Live demo — mercurjs.com / demo.mercurjs.com](https://www.mercurjs.com/) | MIT | Vendor–commission–order-split schema ideas. DIAL Postgres remains operating engine. Never Mercur runtime ledger. |
| Promotions stitch (D-42) + marketplace shapes | Medusa (Promotion Module / v2) | schema-only | [medusajs/medusa](https://github.com/medusajs/medusa) | [README / screenshots — Medusa promotion docs](https://docs.medusajs.com/resources/commerce-modules/promotion) | MIT | computeActions / budgets / application methods → in-repo @dial/promotions. Reject Medusa as money or promo runtime SoR. |
| Promotions stitch (D-42) | OfferKit | schema-only | [offerkit/offerkit](https://github.com/offerkit/offerkit) | [README / screenshots](https://github.com/offerkit/offerkit) | Confirm at clone (Pack: check OfferKit) | Referrals, stackable redeem, promo_credit ledger pattern. Reimplement in @dial/promotions. No OfferKit Docker as SoR. |
| Spare (visual reference only — not locked donor) | Saleor Paper storefront | rejected-as-SoR | [saleor/storefront](https://github.com/saleor/storefront) | [Live demo — storefront.saleor.io](https://storefront.saleor.io/) | FSL-1.1-ALv2 | v4: visual reference only, not a locked donor. Counsel must clear FSL before any paste. |
| Tech / delivery (visual reference only — not locked; Expo/RN + proprietary API) | Enatega food-delivery-multivendor | rejected-as-SoR | [enatega/food-delivery-multivendor](https://github.com/enatega/food-delivery-multivendor) | [Product site — enatega.com](https://enatega.com/) | Frontend MIT-ish; backend proprietary | v4: visual reference only. Conflicts C-5 (Expo/RN) and D-38 locked Tech donor (FixItNow). Backend is not OSS SoR. |
| Customer apps (explicitly rejected) | Expo ecommerce tutorial shells | rejected-as-SoR | [burakorkmez/expo-ecommerce](https://github.com/burakorkmez/expo-ecommerce) | [README / screenshots — rejected example named in v4 §6.2.1](https://github.com/burakorkmez/expo-ecommerce) | n/a (do not adopt) | Named example of Expo/RN customer shells rejected by C-5. |
| Admin ledger explorer (never money SoR) | Formance Ledger Console (patterns) | rejected-as-SoR | [formancehq/ledger](https://github.com/formancehq/ledger) | [README / screenshots — Formance docs / product](https://www.formance.com/) | MIT (ledger); Console = pattern only | Study account/posting explorer screens. Reimplement read-only views on DIAL ledger_* + Job Reserve. Never run Formance as SoR. |
| Admin ledger explorer alternate | Blnk | rejected-as-SoR | [blnkfinance/blnk](https://github.com/blnkfinance/blnk) | [Product site — blnkfinance.com](https://www.blnkfinance.com/) | Apache-2.0 | Alternate ledger display patterns. Same rule: never money SoR. |
| Grocery enrichment (not UX donor) | Open Food Facts | schema-only | [openfoodfacts/openfoodfacts-server](https://github.com/openfoodfacts/openfoodfacts-server) | [Live demo — world.openfoodfacts.org](https://world.openfoodfacts.org/) | ODbL (data) | Grocery plan: enrichment only. Not a storefront. Catalogue SoR stays DIAL Postgres + Meili. |

## 6. Secondary / ops — experience tools and D-46 complements (not D-38 storefronts)

Canonical tool picks (v4 §6.10) and complementary ERP/ops stitch (D-46). These are siblings, libraries, or admin-pattern donors. They must not be mistaken for Spare/Tech/Grocery storefront identity.

| Branch / app | Donor | Role | Repo | Demo | Licence | How DIAL uses it |
| --- | --- | --- | --- | --- | --- | --- |
| Tech / Laundry booking slots (not job SoR) | Cal.com | ops sibling | [calcom/cal.com](https://github.com/calcom/cal.com) | [Live demo — cal.com](https://cal.com/) | AGPL-3.0 (self-host) | Non-emergency slot calendar adapter. Job + money SoR = DIAL Job Reserve. Recreate FixItNow slot-picker UI. |
| Booking slots MIT CE option | cal.diy | ops sibling | [calcom/cal.diy](https://github.com/calcom/cal.diy) | [README / screenshots](https://github.com/calcom/cal.diy) | MIT (community edition) | Laundry blueprint: MIT CE sibling for slots. Same rule — Dial capacity/job SoR remains Dial. |
| Shared inbox (web + WhatsApp continuity) | Chatwoot | ops sibling | [chatwoot/chatwoot](https://github.com/chatwoot/chatwoot) | [Live demo — chatwoot.com](https://www.chatwoot.com/) | MIT (+ enterprise) | Human chat. Status/truth from ERP. Deep-link conversations to dispute/order ids. Not a second helpdesk SoR. |
| Post-job surveys | Formbricks | ops sibling | [formbricks/formbricks](https://github.com/formbricks/formbricks) | [Live demo — formbricks.com](https://formbricks.com/) | AGPL-3.0 | Outcome → flywheel surveys. Not storefront UX. |
| Feature flags + product analytics | PostHog | ops sibling | [PostHog/posthog](https://github.com/PostHog/posthog) | [Live demo — posthog.com](https://posthog.com/) | MIT | Flags + funnels + replay. Not a storefront donor. |
| Ops SQL / BI | Metabase | ops sibling | [metabase/metabase](https://github.com/metabase/metabase) | [Live demo — metabase.com](https://www.metabase.com/) | AGPL-3.0 | Ops BI on Supabase. Not the product SLA queue (Command Centre stays in-repo). |
| Catalogue search | Meilisearch | ops sibling | [meilisearch/meilisearch](https://github.com/meilisearch/meilisearch) | [Live demo — meilisearch.com](https://www.meilisearch.com/) | MIT | Customer Spare/Grocery/Laundry offer search. Postgres remains catalogue SoR. |
| Ops visual automation | n8n | ops sibling | [n8n-io/n8n](https://github.com/n8n-io/n8n) | [Live demo — n8n.io](https://n8n.io/) | Fair-code / Sustainable Use | Supplier chase, CRM → Brevo, Chatwoot bridges. Not money SoR. |
| Durable money / delivery workflows | Temporal | ops sibling | [temporalio/temporal](https://github.com/temporalio/temporal) | [Live demo — temporal.io](https://temporal.io/) | MIT | Job Reserve, FDMS sequences, DeliveryDispatchWorkflow. Engine — not a UX donor. |
| Temporal ops UI | Temporal Web UI | ops sibling | [temporalio/ui](https://github.com/temporalio/ui) | [README / screenshots — Temporal Web UI docs](https://docs.temporal.io/web-ui) | MIT | Ops visibility for Money + DeliveryDispatch. Not product admin home. |
| Supplier / admin CSV map→validate→preview (D-46 must-adopt) | csv-import (Tableflow) | primary UX donor | [tableflowhq/csv-import](https://github.com/tableflowhq/csv-import) | [Product site — tableflow.com (embeddable importer; cloud not SoR)](https://www.tableflow.com/) | MIT | Embed importer modal in supplier-web + unmatched queue. Emit rows → DIAL match/OCR. Do not use Tableflow cloud as SoR. |
| Care + Fleet vehicle compliance (D-46 must-adopt) | Tracktor | primary UX donor | [javedh-dev/tracktor](https://github.com/javedh-dev/tracktor) | [Live demo — tracktor.bytedge.in](https://tracktor.bytedge.in/) | MIT | Garage / insurance-PUCC / maintenance / reminder widgets. Not courier dispatch SoR. |
| PDF statements (D-46 must-adopt) | react-pdf | library | [diegomura/react-pdf](https://github.com/diegomura/react-pdf) | [Live demo — react-pdf.org](https://react-pdf.org/) | MIT | Supplier settlement, tech payout, Care/Fleet statements from ledger DTOs. FDMS fiscal PDF stays ZIMRA path. |
| Technician / courier Bluetooth print (D-46 must-adopt) | ESCPOS ThermalPrinter Android | library | [DantSu/ESCPOS-ThermalPrinter-Android](https://github.com/DantSu/ESCPOS-ThermalPrinter-Android) | [README / screenshots](https://github.com/DantSu/ESCPOS-ThermalPrinter-Android) | MIT | Bag tags / customer copy. Not fiscalisation device (D-40a = virtual FDMS). |
| BullMQ inspector (D-46 must-adopt) | bull-board | ops sibling | [felixmosh/bull-board](https://github.com/felixmosh/bull-board) | [README / screenshots — mount behind admin SSO (no public demo)](https://github.com/felixmosh/bull-board) | MIT | Eng/ops board for reindex, Sharp, webhooks, dispatch timers. Not product SLA queues. |
| Admin / tech roster calendar (D-46 must-adopt) | Schedule-X | library | [schedule-x/schedule-x](https://github.com/schedule-x/schedule-x) | [Live demo — schedule-x.dev](https://schedule-x.dev/) | MIT | Multi-tech day board bound to DIAL assignments. Do not replace Cal.com for customer bookable slots. |
| Admin triage inspiration (D-46 backlog) | Plane | secondary | [makeplane/plane](https://github.com/makeplane/plane) | [Live demo — plane.so](https://plane.so/) | AGPL-3.0 | Keyboard claim/resolve, SLA badges. Reimplement in admin-web. Do not fork Plane into the monorepo. |
| KYC / credential capture (D-46 backlog) | Ballerine | secondary | [ballerine-io/ballerine](https://github.com/ballerine-io/ballerine) | [Product site — ballerine.com](https://www.ballerine.com/) | ELv2 (default) | Document-step UX + review queue study. No Ballerine as identity SoR. ELv2 ≠ OSI. |
| Evidence gallery — jobs, POD, Laundry photos (D-46 backlog) | PicPeak | secondary | [PicPeak/picpeak](https://github.com/PicPeak/picpeak) | [Live demo — demo.picpeak.app](https://demo.picpeak.app/) | MIT | Lightbox, keyboard next/prev, approve/reject for dispute + POD + near-dupe. Not a customer photo-sharing product. |
| B2B statement layout polish (D-46 backlog) | SolidInvoice | secondary | [SolidInvoice/SolidInvoice](https://github.com/SolidInvoice/SolidInvoice) | [Product site — solidinvoice.co](https://solidinvoice.co/) | MIT | Visual polish for PDF/HTML statements. Reject as marketplace invoicing SoR. |
| Care / Fleet portal IA (D-46 backlog) | Lago | secondary | [getlago/lago](https://github.com/getlago/lago) | [Live demo — getlago.com](https://www.getlago.com/) | AGPL-3.0 | Customer portal information architecture only. DIAL Care entitlements stay in-repo. No Lago as subscription SoR. |
| Trust / fraud research (D-46 backlog) | DGFraud | schema-only | [safe-graph/DGFraud](https://github.com/safe-graph/DGFraud) | [README / screenshots — research code, no product demo](https://github.com/safe-graph/DGFraud) | Apache-2.0 | Offline graph experiments. Not launch-critical. No GNN in money path without eval gate. |

## URL verification (this pass)

The following URLs did not confirm cleanly. They remain the best official links; treat demos as **unverified** until clicked:

- Nimara ecommerce demo: https://demo.nimara.store/ (500)
- https://fix-it-now-chi-beige.vercel.app/: https://fix-it-now-chi-beige.vercel.app/ (404)

## Sources (extracted, not invented)

- `DIAL_Consolidated_Plan_v4.md` §6.2.1 stitch kit, §6.10, D-38 / D-44 / D-45a / D-46
- `DIAL_Development_Agent_Pack.md` §9
- `DIAL_Deep_Engineering_and_OSS_Stitch.md`
- `docs/planning/DIAL_Donor_Parity_Roadmap.md`
- `docs/planning/DIAL_Groceries_Liquor_Branch_Plan.md` Part 11
- `docs/planning/DIAL_Laundry_Consolidated_Blueprint.md` Part C (+ branch/grill companions)
- `apps/customer-android/README.md`, `apps/customer-ios/README.md`, `apps/technician-android/README.md`, `apps/delivery-android/README.md`
- `.cursor/rules/dial-donor-identity.mdc`
- Blueprint named visual-reference rows: Saleor Paper, Enatega

Admin, Account, and Gateway door rows point at in-repo Pack / Donor Parity docs (GitHub origin may be private — open the files in this repo).
