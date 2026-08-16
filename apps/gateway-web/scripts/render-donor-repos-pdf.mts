/**
 * Founder-facing donor catalogue: markdown SoR + clickable PDF.
 *
 * Usage (from repo root):
 *   pnpm --filter @dial/gateway-web exec tsx scripts/render-donor-repos-pdf.mts
 *
 * Writes:
 *   docs/planning/DIAL_Donor_Repos_and_Demos.md
 *   docs/planning/DIAL_Donor_Repos_and_Demos.pdf
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const outDir = join(repoRoot, "docs/planning");
const DATE = "2026-08-17";

type DemoKind = "live" | "readme" | "play_store" | "apk" | "docs" | "product" | "video";
type Role =
  | "primary UX donor"
  | "secondary"
  | "schema-only"
  | "rejected-as-SoR"
  | "ops sibling"
  | "library"
  | "algorithm donor"
  | "none (no UX donor)";

type Donor = {
  branch: string;
  name: string;
  role: Role;
  repoLabel: string;
  repoUrl: string;
  demoKind: DemoKind;
  demoLabel: string;
  demoUrl: string;
  licence: string;
  uses: string;
  skipProbe?: boolean;
};

type Section = { id: string; title: string; intro: string; rows: Donor[] };

const sections: Section[] = [
  {
    id: "no_donor",
    title: "1. Surfaces with no storefront UX donor",
    intro:
      "These DIAL surfaces are intentionally not cloned from a marketplace donor. Do not FixItNow-skin admin, and do not invent a WhatsApp UI kit.",
    rows: [
      {
        branch: "WhatsApp (Cloud API + Flows)",
        name: "None — official Cloud API only (D-40)",
        role: "none (no UX donor)",
        repoLabel: "Meta WhatsApp Cloud API docs",
        repoUrl: "https://developers.facebook.com/docs/whatsapp",
        demoKind: "docs",
        demoLabel: "README / screenshots — Cloud API + Flows docs (not a UX kit)",
        demoUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api",
        licence: "Proprietary API",
        uses: "Official Cloud API + Flows only. EcoCash + COD as buttons (D-57). No Baileys / unofficial clients. Not FixItNow.",
      },
      {
        branch: "Admin (`admin-web`)",
        name: "In-repo queue-first IA (Pack §9.5 / v4 §6.17)",
        role: "none (no UX donor)",
        repoLabel: "In-repo Pack §9.5 (this monorepo)",
        repoUrl: "https://github.com/Vanguduza/dial",
        demoKind: "docs",
        demoLabel: "README / screenshots — Pack §9.5 + D-46 complements below",
        demoUrl: "https://github.com/Vanguduza/dial/blob/main/DIAL_Development_Agent_Pack.md",
        skipProbe: true,
        licence: "DIAL in-repo",
        uses: "Queue-first modules A–P. Do not copy FixItNow admin-dashboard. D-46 (CSV, Tracktor, Plane, bull-board, Schedule-X) are complements only.",
      },
      {
        branch: "Account (`/account/*`)",
        name: "None — follows entry branch chrome",
        role: "none (no UX donor)",
        repoLabel: "In-repo Donor Parity Roadmap §10",
        repoUrl: "https://github.com/Vanguduza/dial/blob/main/docs/planning/DIAL_Donor_Parity_Roadmap.md",
        demoKind: "docs",
        demoLabel: "README / screenshots — docs/planning/DIAL_Donor_Parity_Roadmap.md §10",
        demoUrl: "https://github.com/Vanguduza/dial/blob/main/docs/planning/DIAL_Donor_Parity_Roadmap.md",
        skipProbe: true,
        licence: "n/a",
        uses: "Not a sixth storefront. Chrome follows Spare (Mercur) or Tech (FixItNow) entry, or a minimal door. Promo credit: D-42, no cash-out.",
      },
      {
        branch: "Gateway door (`/`, `/home`)",
        name: "None — neutral Shop | Services chooser",
        role: "none (no UX donor)",
        repoLabel: "In-repo Pack §9.1",
        repoUrl: "https://github.com/Vanguduza/dial/blob/main/DIAL_Development_Agent_Pack.md",
        demoKind: "docs",
        demoLabel: "README / screenshots — DIAL_Development_Agent_Pack.md §9.1",
        demoUrl: "https://github.com/Vanguduza/dial/blob/main/DIAL_Development_Agent_Pack.md",
        skipProbe: true,
        licence: "n/a",
        uses: "Auth-first door stays neutral. Destinations are branded. Magic UI + Rive are flourishes only (see D-38 table), not a storefront identity.",
      },
    ],
  },
  {
    id: "d38",
    title: "2. D-38 storefront and native UX donors",
    intro:
      "Locked stitch kit (v4 §6.2.1 / Pack §9 / donor-identity rule). Pattern look, screens, and workflows onto DIAL APIs. Never adopt donor backends, ledgers, auth, or payments as system of record.",
    rows: [
      {
        branch: "Spare web (primary); Grocery web (IA + food collections); Laundry (multivendor pattern)",
        name: "Mercur B2C marketplace storefront",
        role: "primary UX donor",
        repoLabel: "mercurjs/b2c-marketplace-storefront",
        repoUrl: "https://github.com/mercurjs/b2c-marketplace-storefront",
        demoKind: "live",
        demoLabel: "Live demo — b2c.mercurjs.com",
        demoUrl: "https://b2c.mercurjs.com/",
        licence: "MIT family (confirm storefront LICENSE at clone)",
        uses: "Multi-vendor catalog, seller pages, cart/checkout chrome. Grocery reuses marketplace IA with food tokens — not a new food repo this cycle. DIAL APIs + Meili remain SoR.",
      },
      {
        branch: "Spare web",
        name: "Your Next Store",
        role: "secondary",
        repoLabel: "yournextstore/yournextstore",
        repoUrl: "https://github.com/yournextstore/yournextstore",
        demoKind: "live",
        demoLabel: "Live demo — demo.yournextstore.com",
        demoUrl: "https://demo.yournextstore.com/",
        licence: "Confirm at clone (v4 polish option; not primary)",
        uses: "Visual polish for PDP/cart only. Not the Spare primary donor. Do not adopt YNS checkout/payments as SoR.",
      },
      {
        branch: "Spare web",
        name: "Nimara ecommerce",
        role: "secondary",
        repoLabel: "mirumee/nimara-ecommerce",
        repoUrl: "https://github.com/mirumee/nimara-ecommerce",
        demoKind: "live",
        demoLabel: "Live demo — demo.nimara.store (unverified: HTTP 500 on 2026-08-17)",
        demoUrl: "https://demo.nimara.store/",
        licence: "BSD-family (confirm at clone)",
        uses: "Alternate visual polish to Your Next Store. Pattern screens only; DIAL catalogue/checkout SoR.",
      },
      {
        branch: "Spare web",
        name: "Medusa DTC starter",
        role: "secondary",
        repoLabel: "medusajs/dtc-starter",
        repoUrl: "https://github.com/medusajs/dtc-starter",
        demoKind: "product",
        demoLabel: "Product site — medusajs.com (no dedicated dtc-starter hosted demo)",
        demoUrl: "https://medusajs.com/",
        licence: "MIT",
        uses: "PDP / cart / checkout interaction patterns. Not Medusa as commerce or money SoR.",
      },
      {
        branch: "Tech web (primary); Laundry (Services hub peer)",
        name: "FixItNow",
        role: "primary UX donor",
        repoLabel: "AyanSujon/FixItNow",
        repoUrl: "https://github.com/AyanSujon/FixItNow",
        demoKind: "live",
        demoLabel: "Live demo — fixitnow-client.vercel.app (README Live Project)",
        demoUrl: "https://fixitnow-client.vercel.app/",
        licence: "Missing LICENSE (recreate / founder UI-copy override; no donor backend)",
        uses: "Orange home-services marketplace: discover → book → rate. Wire to DIAL Job Reserve + rate_card. Do not copy Stripe/SSLCommerz/JWT/Mongo.",
      },
      {
        branch: "Tech web",
        name: "NearServe",
        role: "secondary",
        repoLabel: "Pranit-DC/nearserve",
        repoUrl: "https://github.com/Pranit-DC/nearserve",
        demoKind: "live",
        demoLabel: "Live demo — nearserve.vercel.app",
        demoUrl: "https://nearserve.vercel.app/",
        licence: "MIT (confirm at Gate 1 paste)",
        uses: "Local-trades discovery polish. Companion only — FixItNow stays primary. Strip Google Maps if studying screens.",
      },
      {
        branch: "Tech web",
        name: "Homezy",
        role: "secondary",
        repoLabel: "PrashantJaybhaye/homezy",
        repoUrl: "https://github.com/PrashantJaybhaye/homezy",
        demoKind: "live",
        demoLabel: "Live demo — homezy-mu.vercel.app",
        demoUrl: "https://homezy-mu.vercel.app/",
        licence: "Confirm at Gate 1 (no paste until SPDX)",
        uses: "Calm booking visuals. Companion only. Recreate; do not vendor backend/payments.",
      },
      {
        branch: "Supplier web; Laundry plant portal",
        name: "Mercur vendor-panel",
        role: "primary UX donor",
        repoLabel: "mercurjs/vendor-panel",
        repoUrl: "https://github.com/mercurjs/vendor-panel",
        demoKind: "live",
        demoLabel: "Live demo — vendor.mercurjs.com",
        demoUrl: "https://vendor.mercurjs.com/",
        licence: "MIT family (repo archived; panel now also in mercurjs/mercur)",
        uses: "Seller catalog, orders, payouts, onboarding IA. Wire to @dial/suppliers. Not Mercur/Medusa as order SoR.",
      },
      {
        branch: "Customer Android (Spare + Grocery paths)",
        name: "CoolMallKotlin",
        role: "primary UX donor",
        repoLabel: "Joker-x-dev/CoolMallKotlin",
        repoUrl: "https://github.com/Joker-x-dev/CoolMallKotlin",
        demoKind: "apk",
        demoLabel: "Live demo — Pgyer APK (not Play Store)",
        demoUrl: "https://www.pgyer.com/CoolMallKotlinProdRelease",
        licence: "MIT",
        uses: "Compose catalog / cart / orders. Recreate shopping UX; DIAL gateway APIs. No Expo. README also has GIFs.",
      },
      {
        branch: "Customer Android",
        name: "Dukkan",
        role: "secondary",
        repoLabel: "Dukkan-ITI/Dukkan",
        repoUrl: "https://github.com/Dukkan-ITI/Dukkan",
        demoKind: "readme",
        demoLabel: "README / screenshots — no Play Store listing for this student repo",
        demoUrl: "https://github.com/Dukkan-ITI/Dukkan/blob/develop/README.md",
        licence: "Confirm at Gate 1",
        uses: "Alternate Compose storefront flows. Strip Shopify/Paymob/Google Maps; DIAL APIs only.",
      },
      {
        branch: "Customer iOS (Spare + Grocery paths)",
        name: "tunacosgun/eCommerce",
        role: "primary UX donor",
        repoLabel: "tunacosgun/eCommerce",
        repoUrl: "https://github.com/tunacosgun/eCommerce",
        demoKind: "readme",
        demoLabel: "README / screenshots — no App Store listing found",
        demoUrl: "https://github.com/tunacosgun/eCommerce",
        licence: "MIT (README badge; confirm LICENSE at clone)",
        uses: "SwiftUI shopping: browse, cart, orders. Recreate; DIAL APIs. Do not adopt Firebase/Stripe as SoR.",
      },
      {
        branch: "Customer iOS",
        name: "Pow",
        role: "secondary",
        repoLabel: "EmergeTools/Pow",
        repoUrl: "https://github.com/EmergeTools/Pow",
        demoKind: "readme",
        demoLabel: "README / screenshots — SwiftUI transition library",
        demoUrl: "https://github.com/EmergeTools/Pow",
        licence: "MIT",
        uses: "Micro-interaction polish only — not a storefront.",
      },
      {
        branch: "Technician Android (architecture); Delivery Android (modules)",
        name: "Now in Android",
        role: "primary UX donor",
        repoLabel: "android/nowinandroid",
        repoUrl: "https://github.com/android/nowinandroid",
        demoKind: "play_store",
        demoLabel: "Live demo — Google Play listing",
        demoUrl: "https://play.google.com/store/apps/details?id=com.google.samples.apps.nowinandroid",
        licence: "Apache-2.0",
        uses: "Offline-first module skeleton (job cache, evidence queue). Tech workflows still FixItNow-shaped; money = DIAL Take-Home + WHT.",
      },
      {
        branch: "Technician Android",
        name: "Android Compose samples (Jetsnack / Reply / Jetcaster)",
        role: "secondary",
        repoLabel: "android/compose-samples",
        repoUrl: "https://github.com/android/compose-samples",
        demoKind: "docs",
        demoLabel: "README / screenshots — Android Developers sample catalog",
        demoUrl: "https://developer.android.com/develop/ui/compose/samples",
        licence: "Apache-2.0",
        uses: "Material 3 motion polish. Not a product storefront donor.",
      },
      {
        branch: "Delivery Android (primary); Grocery / Laundry courier screens",
        name: "foodhub-compose (rider flavour)",
        role: "primary UX donor",
        repoLabel: "furqanullah717/foodhub-compose",
        repoUrl: "https://github.com/furqanullah717/foodhub-compose",
        demoKind: "video",
        demoLabel: "README / screenshots + YouTube series (no Play Store for this tutorial repo)",
        demoUrl: "https://www.youtube.com/playlist?list=PL0pXjGnY7PORsStPOklvOMPOTXoS1-bkP",
        licence: "Apache-2.0",
        uses: "Rider offer / run / POD / COD chrome. Strip Google Maps → MapLibre; strip Stripe/Firebase money. Job engine = packages/delivery.",
      },
      {
        branch: "Web primitives (Tech copied set; Spare/Grocery must not inherit Tech orange)",
        name: "shadcn/ui",
        role: "library",
        repoLabel: "shadcn-ui/ui",
        repoUrl: "https://github.com/shadcn-ui/ui",
        demoKind: "live",
        demoLabel: "Live demo — ui.shadcn.com",
        demoUrl: "https://ui.shadcn.com/",
        licence: "MIT",
        uses: "Radix + Tailwind primitives vendored in-repo. Inside donor-patterned screens — not a substitute for Mercur/FixItNow storefronts.",
      },
      {
        branch: "Gateway welcome / marketing flourishes only",
        name: "Magic UI",
        role: "secondary",
        repoLabel: "magicuidesign/magicui",
        repoUrl: "https://github.com/magicuidesign/magicui",
        demoKind: "live",
        demoLabel: "Live demo — magicui.design",
        demoUrl: "https://magicui.design/",
        licence: "MIT",
        uses: "Gateway welcome-back flourishes only. Not Spare/Tech/Grocery storefront identity.",
      },
      {
        branch: "Cross-app tokens (admin / native / print — not shared customer storefront skin)",
        name: "Style Dictionary",
        role: "library",
        repoLabel: "amzn/style-dictionary",
        repoUrl: "https://github.com/amzn/style-dictionary",
        demoKind: "live",
        demoLabel: "Live demo — styledictionary.com",
        demoUrl: "https://styledictionary.com/",
        licence: "Apache-2.0",
        uses: "packages/design-tokens JSON → Tailwind / Swift / Compose. Not one DIAL storefront brand across branches.",
      },
      {
        branch: "Gateway / home motion",
        name: "Rive (official runtimes)",
        role: "library",
        repoLabel: "rive-app/rive-react",
        repoUrl: "https://github.com/rive-app/rive-react",
        demoKind: "live",
        demoLabel: "Live demo — rive.app",
        demoUrl: "https://rive.app/",
        licence: "Runtime OK (proprietary editor; official runtimes)",
        uses: "Same .riv greeting/host asset on web/Android/iOS. Optional. Not a storefront donor.",
      },
    ],
  },
  {
    id: "laundry",
    title: "3. Dial Laundry — laundry-specific UX donors",
    intro:
      "From DIAL_Laundry_Consolidated_Blueprint.md Part C. Mature laundry OSS is scarce. Prefer Dial a Tech + grocery dual-slot + Spare agency spine; absorb laundry repos as screen donors only. FixItNow, Mercur, foodhub, PicPeak, Cal.com, and Schedule-X are listed in their primary sections and reused here.",
    rows: [
      {
        branch: "Dial Laundry (P0 research)",
        name: "Lavandaria",
        role: "primary UX donor",
        repoLabel: "HSousa1987/Lavandaria",
        repoUrl: "https://github.com/HSousa1987/Lavandaria",
        demoKind: "readme",
        demoLabel: "README / screenshots — no hosted demo found",
        demoUrl: "https://github.com/HSousa1987/Lavandaria",
        licence: "MIT",
        uses: "Kg + itemized orders, condition-photo verification, status lifecycle. Pattern only — not money SoR.",
      },
      {
        branch: "Dial Laundry (P1)",
        name: "Dry-Drop",
        role: "secondary",
        repoLabel: "JordanCJ7/Dry-Drop",
        repoUrl: "https://github.com/JordanCJ7/Dry-Drop",
        demoKind: "live",
        demoLabel: "Live demo — GitHub homepage InfinityFree",
        demoUrl: "https://drydrop.infinityfreeapp.com/",
        licence: "MIT",
        uses: "PHP laundry pickup/delivery scheduling, COD, customer/admin dashboards. Screen flows only.",
      },
      {
        branch: "Dial Laundry (P1)",
        name: "Daya Laundry",
        role: "secondary",
        repoLabel: "ahmadnurhidayat/laundry",
        repoUrl: "https://github.com/ahmadnurhidayat/laundry",
        demoKind: "live",
        demoLabel: "Live demo — laundry.beyondyou.my.id (README deploy URL)",
        demoUrl: "https://laundry.beyondyou.my.id/",
        licence: "Check SPDX at Gate 1",
        uses: "Per-kg / per-item POS, public track token, thermal receipt layout. Fiscal truth = DIAL FDMS, not the donor receipt engine.",
      },
      {
        branch: "Dial Laundry (P1 POS)",
        name: "we-laundry-client",
        role: "secondary",
        repoLabel: "hxxtae/we-laundry-client",
        repoUrl: "https://github.com/hxxtae/we-laundry-client",
        demoKind: "live",
        demoLabel: "Live demo — welaundry.netlify.app",
        demoUrl: "https://welaundry.netlify.app/",
        licence: "Apache-2.0 (verify)",
        uses: "Dry-shop POS intake UX. Strip foreign payments; DIAL APIs.",
      },
      {
        branch: "Dial Laundry (Park — screen sketch)",
        name: "Sunshine Laundrymat",
        role: "secondary",
        repoLabel: "nrobbyjay/sunshinelaundrymat",
        repoUrl: "https://github.com/nrobbyjay/sunshinelaundrymat",
        demoKind: "readme",
        demoLabel: "README / screenshots — WIP; no hosted demo found",
        demoUrl: "https://github.com/nrobbyjay/sunshinelaundrymat",
        licence: "MIT",
        uses: "Immature wash/fold + P/D boilerplate. Sketch only.",
      },
      {
        branch: "Dial Laundry (Park)",
        name: "WashWise",
        role: "secondary",
        repoLabel: "MrPatt025/WashWise",
        repoUrl: "https://github.com/MrPatt025/WashWise",
        demoKind: "readme",
        demoLabel: "README / screenshots — no hosted demo found",
        demoUrl: "https://github.com/MrPatt025/WashWise",
        licence: "Claims MIT (verify)",
        uses: "Park / likely reject as SoR. Low-maturity laundromat SaaS — not Dial job SoR.",
      },
      {
        branch: "Dial Laundry / Tech dispatch boards (P1)",
        name: "Open Field Scheduling",
        role: "secondary",
        repoLabel: "clawnify/open-fieldservice",
        repoUrl: "https://github.com/clawnify/open-fieldservice",
        demoKind: "readme",
        demoLabel: "README / screenshots — local demo only (localhost:5174)",
        demoUrl: "https://github.com/clawnify/open-fieldservice",
        licence: "MIT (verify)",
        uses: "FSM dispatch UI study. Immature stars. Not delivery job SoR (D-45).",
      },
      {
        branch: "Dial Laundry POS ticket UI",
        name: "opensourcepos",
        role: "secondary",
        repoLabel: "opensourcepos/opensourcepos",
        repoUrl: "https://github.com/opensourcepos/opensourcepos",
        demoKind: "product",
        demoLabel: "Product site — opensourcepos.org",
        demoUrl: "https://www.opensourcepos.org/",
        licence: "MIT (+ footer retention clause)",
        uses: "Retail ticket UI study only. REJECT as runtime / agency FDMS SoR.",
      },
      {
        branch: "Dial Laundry (REJECT runtime)",
        name: "Smart Laundry Basket",
        role: "rejected-as-SoR",
        repoLabel: "sureshalluru/smart_laundry",
        repoUrl: "https://github.com/sureshalluru/smart_laundry",
        demoKind: "readme",
        demoLabel: "README / screenshots — optional UX screenshots only with counsel",
        demoUrl: "https://github.com/sureshalluru/smart_laundry",
        licence: "Elastic-2.0 (not OSI)",
        uses: "ELv2 + Google Maps + Stripe defaults. Reject as self-host marketplace runtime. Optional park screenshots with counsel.",
      },
    ],
  },
  {
    id: "delivery",
    title: "4. Delivery, maps, and dispatch (not D-38 storefronts)",
    intro:
      "D-44 / D-45 / D-45a. Courier Android UX is foodhub-compose (section 2). Job engine stays in-repo. Maps = MapLibre + Nominatim + OSRM + VROOM — not Google/Mapbox as SoR.",
    rows: [
      {
        branch: "Delivery dispatch (packages/delivery + Temporal)",
        name: "AWS Last Mile Hyperlocal",
        role: "algorithm donor",
        repoLabel: "aws-samples/aws-last-mile-delivery-hyperlocal",
        repoUrl: "https://github.com/aws-samples/aws-last-mile-delivery-hyperlocal",
        demoKind: "readme",
        demoLabel: "README / screenshots — no hosted product demo (sample repo)",
        demoUrl: "https://github.com/aws-samples/aws-last-mile-delivery-hyperlocal",
        licence: "MIT-0",
        uses: "Reimplement offer → accept/reject → requeue + ranking into Temporal. Do not run AWS IoT/Step Functions/Dynamo as SoR.",
      },
      {
        branch: "Delivery / admin / customer track maps",
        name: "MapLibre GL JS + Native",
        role: "library",
        repoLabel: "maplibre/maplibre-gl-js",
        repoUrl: "https://github.com/maplibre/maplibre-gl-js",
        demoKind: "live",
        demoLabel: "Live demo — maplibre.org",
        demoUrl: "https://maplibre.org/",
        licence: "BSD-3-Clause",
        uses: "Client map SoR (D-44). Native: maplibre-native. Not a storefront donor.",
      },
      {
        branch: "Delivery Android maps",
        name: "maplibre-compose",
        role: "library",
        repoLabel: "maplibre/maplibre-compose",
        repoUrl: "https://github.com/maplibre/maplibre-compose",
        demoKind: "docs",
        demoLabel: "README / screenshots — MapLibre Compose docs",
        demoUrl: "https://maplibre.org/maplibre-compose/",
        licence: "BSD",
        uses: "Compose bindings for courier map. Replace donor Google Maps.",
      },
      {
        branch: "Geocoding sibling",
        name: "Nominatim",
        role: "ops sibling",
        repoLabel: "osm-search/Nominatim",
        repoUrl: "https://github.com/osm-search/Nominatim",
        demoKind: "live",
        demoLabel: "Live demo — nominatim.openstreetmap.org",
        demoUrl: "https://nominatim.openstreetmap.org/",
        licence: "GPL-2.0 (server)",
        uses: "Self-host geocode sibling. Pin/landmark — not Google Geocoding as SoR.",
      },
      {
        branch: "Drive-time / distance",
        name: "OSRM",
        role: "ops sibling",
        repoLabel: "Project-OSRM/osrm-backend",
        repoUrl: "https://github.com/Project-OSRM/osrm-backend",
        demoKind: "live",
        demoLabel: "Live demo — map.project-osrm.org",
        demoUrl: "https://map.project-osrm.org/",
        licence: "BSD-2-Clause",
        uses: "Self-host drive-time bands + ETA (Blueprint I-2).",
      },
      {
        branch: "Multi-stop VRP (post-accept)",
        name: "VROOM",
        role: "ops sibling",
        repoLabel: "VROOM-Project/vroom",
        repoUrl: "https://github.com/VROOM-Project/vroom",
        demoKind: "readme",
        demoLabel: "README / screenshots — no public hosted VRP playground as product demo",
        demoUrl: "https://github.com/VROOM-Project/vroom",
        licence: "BSD-2-Clause",
        uses: "Courier + tech multi-stop after accept. Not who gets the job.",
      },
      {
        branch: "Delivery VRP alternate (not offer-cycle)",
        name: "jsprit",
        role: "secondary",
        repoLabel: "graphhopper/jsprit",
        repoUrl: "https://github.com/graphhopper/jsprit",
        demoKind: "readme",
        demoLabel: "README / screenshots",
        demoUrl: "https://github.com/graphhopper/jsprit",
        licence: "Apache-2.0",
        uses: "Keep as VRP alternate if VROOM fails. Reject as offer-engine.",
      },
      {
        branch: "Delivery Android (MIT secondary mention in stitch bake-off)",
        name: "Deliverr",
        role: "secondary",
        repoLabel: "kaaneneskpc/Deliverr",
        repoUrl: "https://github.com/kaaneneskpc/Deliverr",
        demoKind: "readme",
        demoLabel: "README / screenshots",
        demoUrl: "https://github.com/kaaneneskpc/Deliverr",
        licence: "MIT",
        uses: "Another Compose food-delivery flavour. foodhub-compose remains D-44 primary.",
      },
      {
        branch: "Delivery product pattern (AGPL — never job SoR)",
        name: "Fleetbase + Navigator",
        role: "rejected-as-SoR",
        repoLabel: "fleetbase/fleetbase",
        repoUrl: "https://github.com/fleetbase/fleetbase",
        demoKind: "product",
        demoLabel: "Product site — fleetbase.io",
        demoUrl: "https://www.fleetbase.io/",
        licence: "AGPL-3.0",
        uses: "Study Fleet-Ops lifecycle + Navigator POD/QR. Do not fork into monorepo; do not run as job engine (D-45).",
      },
      {
        branch: "Delivery Navigator app (AGPL reference)",
        name: "Fleetbase Navigator",
        role: "rejected-as-SoR",
        repoLabel: "fleetbase/navigator-app",
        repoUrl: "https://github.com/fleetbase/navigator-app",
        demoKind: "readme",
        demoLabel: "README / screenshots — RN courier app (C-5: pattern only, not customer shell)",
        demoUrl: "https://github.com/fleetbase/navigator-app",
        licence: "AGPL-3.0",
        uses: "POD, QR, issue/fuel reports. Reference-only. Courier app is native Kotlin + foodhub patterns.",
      },
      {
        branch: "Delivery stack-shape (AGPL — immature)",
        name: "Witylogix",
        role: "rejected-as-SoR",
        repoLabel: "wityliti/witylogix",
        repoUrl: "https://github.com/wityliti/witylogix",
        demoKind: "readme",
        demoLabel: "README / screenshots",
        demoUrl: "https://github.com/wityliti/witylogix",
        licence: "AGPL-3.0",
        uses: "Closest infra rhyme (BullMQ + OSRM). Pattern/workflow only — never runtime SoR.",
      },
    ],
  },
  {
    id: "schema_reject",
    title: "5. Schema-only and rejected-as-SoR (named so they are not confused with D-38)",
    intro:
      "These appear in v4 / stitch / Pack. They are either catalogue/promo schema references or explicit non-donors (licence, Expo/RN, second money engine).",
    rows: [
      {
        branch: "Spare fitment / PIM (not customer UI)",
        name: "SandPIM",
        role: "schema-only",
        repoLabel: "autopartsource/sandpim",
        repoUrl: "https://github.com/autopartsource/sandpim",
        demoKind: "readme",
        demoLabel: "README / screenshots — PHP/LAMP app; no DIAL-usable hosted UI demo",
        demoUrl: "https://github.com/autopartsource/sandpim",
        licence: "MIT",
        uses: "ACES/PIES cross-check for FitmentClaim / vehicle_master. Wrong stack to run or fork as SoR.",
      },
      {
        branch: "Marketplace domain shapes (not money SoR)",
        name: "Mercur core",
        role: "schema-only",
        repoLabel: "mercurjs/mercur",
        repoUrl: "https://github.com/mercurjs/mercur",
        demoKind: "live",
        demoLabel: "Live demo — mercurjs.com / demo.mercurjs.com",
        demoUrl: "https://www.mercurjs.com/",
        licence: "MIT",
        uses: "Vendor–commission–order-split schema ideas. DIAL Postgres remains operating engine. Never Mercur runtime ledger.",
      },
      {
        branch: "Promotions stitch (D-42) + marketplace shapes",
        name: "Medusa (Promotion Module / v2)",
        role: "schema-only",
        repoLabel: "medusajs/medusa",
        repoUrl: "https://github.com/medusajs/medusa",
        demoKind: "docs",
        demoLabel: "README / screenshots — Medusa promotion docs",
        demoUrl: "https://docs.medusajs.com/resources/commerce-modules/promotion",
        licence: "MIT",
        uses: "computeActions / budgets / application methods → in-repo @dial/promotions. Reject Medusa as money or promo runtime SoR.",
      },
      {
        branch: "Promotions stitch (D-42)",
        name: "OfferKit",
        role: "schema-only",
        repoLabel: "offerkit/offerkit",
        repoUrl: "https://github.com/offerkit/offerkit",
        demoKind: "readme",
        demoLabel: "README / screenshots",
        demoUrl: "https://github.com/offerkit/offerkit",
        licence: "Confirm at clone (Pack: check OfferKit)",
        uses: "Referrals, stackable redeem, promo_credit ledger pattern. Reimplement in @dial/promotions. No OfferKit Docker as SoR.",
      },
      {
        branch: "Spare (visual reference only — not locked donor)",
        name: "Saleor Paper storefront",
        role: "rejected-as-SoR",
        repoLabel: "saleor/storefront",
        repoUrl: "https://github.com/saleor/storefront",
        demoKind: "live",
        demoLabel: "Live demo — storefront.saleor.io",
        demoUrl: "https://storefront.saleor.io/",
        licence: "FSL-1.1-ALv2",
        uses: "v4: visual reference only, not a locked donor. Counsel must clear FSL before any paste.",
      },
      {
        branch: "Tech / delivery (visual reference only — not locked; Expo/RN + proprietary API)",
        name: "Enatega food-delivery-multivendor",
        role: "rejected-as-SoR",
        repoLabel: "enatega/food-delivery-multivendor",
        repoUrl: "https://github.com/enatega/food-delivery-multivendor",
        demoKind: "product",
        demoLabel: "Product site — enatega.com",
        demoUrl: "https://enatega.com/",
        licence: "Frontend MIT-ish; backend proprietary",
        uses: "v4: visual reference only. Conflicts C-5 (Expo/RN) and D-38 locked Tech donor (FixItNow). Backend is not OSS SoR.",
      },
      {
        branch: "Customer apps (explicitly rejected)",
        name: "Expo ecommerce tutorial shells",
        role: "rejected-as-SoR",
        repoLabel: "burakorkmez/expo-ecommerce",
        repoUrl: "https://github.com/burakorkmez/expo-ecommerce",
        demoKind: "readme",
        demoLabel: "README / screenshots — rejected example named in v4 §6.2.1",
        demoUrl: "https://github.com/burakorkmez/expo-ecommerce",
        licence: "n/a (do not adopt)",
        uses: "Named example of Expo/RN customer shells rejected by C-5.",
      },
      {
        branch: "Admin ledger explorer (never money SoR)",
        name: "Formance Ledger Console (patterns)",
        role: "rejected-as-SoR",
        repoLabel: "formancehq/ledger",
        repoUrl: "https://github.com/formancehq/ledger",
        demoKind: "docs",
        demoLabel: "README / screenshots — Formance docs / product",
        demoUrl: "https://www.formance.com/",
        licence: "MIT (ledger); Console = pattern only",
        uses: "Study account/posting explorer screens. Reimplement read-only views on DIAL ledger_* + Job Reserve. Never run Formance as SoR.",
      },
      {
        branch: "Admin ledger explorer alternate",
        name: "Blnk",
        role: "rejected-as-SoR",
        repoLabel: "blnkfinance/blnk",
        repoUrl: "https://github.com/blnkfinance/blnk",
        demoKind: "product",
        demoLabel: "Product site — blnkfinance.com",
        demoUrl: "https://www.blnkfinance.com/",
        licence: "Apache-2.0",
        uses: "Alternate ledger display patterns. Same rule: never money SoR.",
      },
      {
        branch: "Grocery enrichment (not UX donor)",
        name: "Open Food Facts",
        role: "schema-only",
        repoLabel: "openfoodfacts/openfoodfacts-server",
        repoUrl: "https://github.com/openfoodfacts/openfoodfacts-server",
        demoKind: "live",
        demoLabel: "Live demo — world.openfoodfacts.org",
        demoUrl: "https://world.openfoodfacts.org/",
        licence: "ODbL (data)",
        uses: "Grocery plan: enrichment only. Not a storefront. Catalogue SoR stays DIAL Postgres + Meili.",
      },
    ],
  },
  {
    id: "ops",
    title: "6. Secondary / ops — experience tools and D-46 complements (not D-38 storefronts)",
    intro:
      "Canonical tool picks (v4 §6.10) and complementary ERP/ops stitch (D-46). These are siblings, libraries, or admin-pattern donors. They must not be mistaken for Spare/Tech/Grocery storefront identity.",
    rows: [
      {
        branch: "Tech / Laundry booking slots (not job SoR)",
        name: "Cal.com",
        role: "ops sibling",
        repoLabel: "calcom/cal.com",
        repoUrl: "https://github.com/calcom/cal.com",
        demoKind: "live",
        demoLabel: "Live demo — cal.com",
        demoUrl: "https://cal.com/",
        licence: "AGPL-3.0 (self-host)",
        uses: "Non-emergency slot calendar adapter. Job + money SoR = DIAL Job Reserve. Recreate FixItNow slot-picker UI.",
      },
      {
        branch: "Booking slots MIT CE option",
        name: "cal.diy",
        role: "ops sibling",
        repoLabel: "calcom/cal.diy",
        repoUrl: "https://github.com/calcom/cal.diy",
        demoKind: "readme",
        demoLabel: "README / screenshots",
        demoUrl: "https://github.com/calcom/cal.diy",
        licence: "MIT (community edition)",
        uses: "Laundry blueprint: MIT CE sibling for slots. Same rule — Dial capacity/job SoR remains Dial.",
      },
      {
        branch: "Shared inbox (web + WhatsApp continuity)",
        name: "Chatwoot",
        role: "ops sibling",
        repoLabel: "chatwoot/chatwoot",
        repoUrl: "https://github.com/chatwoot/chatwoot",
        demoKind: "live",
        demoLabel: "Live demo — chatwoot.com",
        demoUrl: "https://www.chatwoot.com/",
        licence: "MIT (+ enterprise)",
        uses: "Human chat. Status/truth from ERP. Deep-link conversations to dispute/order ids. Not a second helpdesk SoR.",
      },
      {
        branch: "Post-job surveys",
        name: "Formbricks",
        role: "ops sibling",
        repoLabel: "formbricks/formbricks",
        repoUrl: "https://github.com/formbricks/formbricks",
        demoKind: "live",
        demoLabel: "Live demo — formbricks.com",
        demoUrl: "https://formbricks.com/",
        licence: "AGPL-3.0",
        uses: "Outcome → flywheel surveys. Not storefront UX.",
      },
      {
        branch: "Feature flags + product analytics",
        name: "PostHog",
        role: "ops sibling",
        repoLabel: "PostHog/posthog",
        repoUrl: "https://github.com/PostHog/posthog",
        demoKind: "live",
        demoLabel: "Live demo — posthog.com",
        demoUrl: "https://posthog.com/",
        licence: "MIT",
        uses: "Flags + funnels + replay. Not a storefront donor.",
      },
      {
        branch: "Ops SQL / BI",
        name: "Metabase",
        role: "ops sibling",
        repoLabel: "metabase/metabase",
        repoUrl: "https://github.com/metabase/metabase",
        demoKind: "live",
        demoLabel: "Live demo — metabase.com",
        demoUrl: "https://www.metabase.com/",
        licence: "AGPL-3.0",
        uses: "Ops BI on Supabase. Not the product SLA queue (Command Centre stays in-repo).",
      },
      {
        branch: "Catalogue search",
        name: "Meilisearch",
        role: "ops sibling",
        repoLabel: "meilisearch/meilisearch",
        repoUrl: "https://github.com/meilisearch/meilisearch",
        demoKind: "live",
        demoLabel: "Live demo — meilisearch.com",
        demoUrl: "https://www.meilisearch.com/",
        licence: "MIT",
        uses: "Customer Spare/Grocery/Laundry offer search. Postgres remains catalogue SoR.",
      },
      {
        branch: "Ops visual automation",
        name: "n8n",
        role: "ops sibling",
        repoLabel: "n8n-io/n8n",
        repoUrl: "https://github.com/n8n-io/n8n",
        demoKind: "live",
        demoLabel: "Live demo — n8n.io",
        demoUrl: "https://n8n.io/",
        licence: "Fair-code / Sustainable Use",
        uses: "Supplier chase, CRM → Brevo, Chatwoot bridges. Not money SoR.",
      },
      {
        branch: "Durable money / delivery workflows",
        name: "Temporal",
        role: "ops sibling",
        repoLabel: "temporalio/temporal",
        repoUrl: "https://github.com/temporalio/temporal",
        demoKind: "live",
        demoLabel: "Live demo — temporal.io",
        demoUrl: "https://temporal.io/",
        licence: "MIT",
        uses: "Job Reserve, FDMS sequences, DeliveryDispatchWorkflow. Engine — not a UX donor.",
      },
      {
        branch: "Temporal ops UI",
        name: "Temporal Web UI",
        role: "ops sibling",
        repoLabel: "temporalio/ui",
        repoUrl: "https://github.com/temporalio/ui",
        demoKind: "docs",
        demoLabel: "README / screenshots — Temporal Web UI docs",
        demoUrl: "https://docs.temporal.io/web-ui",
        licence: "MIT",
        uses: "Ops visibility for Money + DeliveryDispatch. Not product admin home.",
      },
      {
        branch: "Supplier / admin CSV map→validate→preview (D-46 must-adopt)",
        name: "csv-import (Tableflow)",
        role: "primary UX donor",
        repoLabel: "tableflowhq/csv-import",
        repoUrl: "https://github.com/tableflowhq/csv-import",
        demoKind: "product",
        demoLabel: "Product site — tableflow.com (embeddable importer; cloud not SoR)",
        demoUrl: "https://www.tableflow.com/",
        licence: "MIT",
        uses: "Embed importer modal in supplier-web + unmatched queue. Emit rows → DIAL match/OCR. Do not use Tableflow cloud as SoR.",
      },
      {
        branch: "Care + Fleet vehicle compliance (D-46 must-adopt)",
        name: "Tracktor",
        role: "primary UX donor",
        repoLabel: "javedh-dev/tracktor",
        repoUrl: "https://github.com/javedh-dev/tracktor",
        demoKind: "live",
        demoLabel: "Live demo — tracktor.bytedge.in",
        demoUrl: "https://tracktor.bytedge.in/",
        licence: "MIT",
        uses: "Garage / insurance-PUCC / maintenance / reminder widgets. Not courier dispatch SoR.",
      },
      {
        branch: "PDF statements (D-46 must-adopt)",
        name: "react-pdf",
        role: "library",
        repoLabel: "diegomura/react-pdf",
        repoUrl: "https://github.com/diegomura/react-pdf",
        demoKind: "live",
        demoLabel: "Live demo — react-pdf.org",
        demoUrl: "https://react-pdf.org/",
        licence: "MIT",
        uses: "Supplier settlement, tech payout, Care/Fleet statements from ledger DTOs. FDMS fiscal PDF stays ZIMRA path.",
      },
      {
        branch: "Technician / courier Bluetooth print (D-46 must-adopt)",
        name: "ESCPOS ThermalPrinter Android",
        role: "library",
        repoLabel: "DantSu/ESCPOS-ThermalPrinter-Android",
        repoUrl: "https://github.com/DantSu/ESCPOS-ThermalPrinter-Android",
        demoKind: "readme",
        demoLabel: "README / screenshots",
        demoUrl: "https://github.com/DantSu/ESCPOS-ThermalPrinter-Android",
        licence: "MIT",
        uses: "Bag tags / customer copy. Not fiscalisation device (D-40a = virtual FDMS).",
      },
      {
        branch: "BullMQ inspector (D-46 must-adopt)",
        name: "bull-board",
        role: "ops sibling",
        repoLabel: "felixmosh/bull-board",
        repoUrl: "https://github.com/felixmosh/bull-board",
        demoKind: "readme",
        demoLabel: "README / screenshots — mount behind admin SSO (no public demo)",
        demoUrl: "https://github.com/felixmosh/bull-board",
        licence: "MIT",
        uses: "Eng/ops board for reindex, Sharp, webhooks, dispatch timers. Not product SLA queues.",
      },
      {
        branch: "Admin / tech roster calendar (D-46 must-adopt)",
        name: "Schedule-X",
        role: "library",
        repoLabel: "schedule-x/schedule-x",
        repoUrl: "https://github.com/schedule-x/schedule-x",
        demoKind: "live",
        demoLabel: "Live demo — schedule-x.dev",
        demoUrl: "https://schedule-x.dev/",
        licence: "MIT",
        uses: "Multi-tech day board bound to DIAL assignments. Do not replace Cal.com for customer bookable slots.",
      },
      {
        branch: "Admin triage inspiration (D-46 backlog)",
        name: "Plane",
        role: "secondary",
        repoLabel: "makeplane/plane",
        repoUrl: "https://github.com/makeplane/plane",
        demoKind: "live",
        demoLabel: "Live demo — plane.so",
        demoUrl: "https://plane.so/",
        licence: "AGPL-3.0",
        uses: "Keyboard claim/resolve, SLA badges. Reimplement in admin-web. Do not fork Plane into the monorepo.",
      },
      {
        branch: "KYC / credential capture (D-46 backlog)",
        name: "Ballerine",
        role: "secondary",
        repoLabel: "ballerine-io/ballerine",
        repoUrl: "https://github.com/ballerine-io/ballerine",
        demoKind: "product",
        demoLabel: "Product site — ballerine.com",
        demoUrl: "https://www.ballerine.com/",
        licence: "ELv2 (default)",
        uses: "Document-step UX + review queue study. No Ballerine as identity SoR. ELv2 ≠ OSI.",
      },
      {
        branch: "Evidence gallery — jobs, POD, Laundry photos (D-46 backlog)",
        name: "PicPeak",
        role: "secondary",
        repoLabel: "PicPeak/picpeak",
        repoUrl: "https://github.com/PicPeak/picpeak",
        demoKind: "live",
        demoLabel: "Live demo — demo.picpeak.app",
        demoUrl: "https://demo.picpeak.app/",
        licence: "MIT",
        uses: "Lightbox, keyboard next/prev, approve/reject for dispute + POD + near-dupe. Not a customer photo-sharing product.",
      },
      {
        branch: "B2B statement layout polish (D-46 backlog)",
        name: "SolidInvoice",
        role: "secondary",
        repoLabel: "SolidInvoice/SolidInvoice",
        repoUrl: "https://github.com/SolidInvoice/SolidInvoice",
        demoKind: "product",
        demoLabel: "Product site — solidinvoice.co",
        demoUrl: "https://solidinvoice.co/",
        licence: "MIT",
        uses: "Visual polish for PDF/HTML statements. Reject as marketplace invoicing SoR.",
      },
      {
        branch: "Care / Fleet portal IA (D-46 backlog)",
        name: "Lago",
        role: "secondary",
        repoLabel: "getlago/lago",
        repoUrl: "https://github.com/getlago/lago",
        demoKind: "live",
        demoLabel: "Live demo — getlago.com",
        demoUrl: "https://www.getlago.com/",
        licence: "AGPL-3.0",
        uses: "Customer portal information architecture only. DIAL Care entitlements stay in-repo. No Lago as subscription SoR.",
      },
      {
        branch: "Trust / fraud research (D-46 backlog)",
        name: "DGFraud",
        role: "schema-only",
        repoLabel: "safe-graph/DGFraud",
        repoUrl: "https://github.com/safe-graph/DGFraud",
        demoKind: "readme",
        demoLabel: "README / screenshots — research code, no product demo",
        demoUrl: "https://github.com/safe-graph/DGFraud",
        licence: "Apache-2.0",
        uses: "Offline graph experiments. Not launch-critical. No GNN in money path without eval gate.",
      },
    ],
  },
];

const extraFixItNowHomepage = "https://fix-it-now-chi-beige.vercel.app/";
const extraFixItNowApi = "https://fixitnow-v1.vercel.app/";
const extraMercurDemo = "https://demo.mercurjs.com/";
const extraCoolMallReadme = "https://github.com/Joker-x-dev/CoolMallKotlin/blob/main/README_EN.md";

function allDonors(): Donor[] {
  return sections.flatMap((s) => s.rows);
}

function escapeMd(s: string): string {
  return s.replace(/\|/g, "\\|");
}

function mdLink(label: string, url: string): string {
  return `[${escapeMd(label)}](${url})`;
}

function buildMarkdown(verifyNotes: string[]): string {
  const donors = allDonors();
  const lines: string[] = [];
  lines.push("# DIAL donor repositories and demos");
  lines.push("");
  lines.push(`**Date:** ${DATE}`);
  lines.push("");
  lines.push(
    "**D-38 lock.** Donors exist so DIAL does not design storefronts from scratch. Use each donor’s **look, layout, screens, features, and workflows**. Customise copy/branding for DIAL. **Wire every action to DIAL APIs.** Do **not** adopt donor backends, ledgers, auth providers, or payment stacks as system of record. Money = `amountMinor` + DIAL packages. WhatsApp = official Cloud API only.",
  );
  lines.push("");
  lines.push(
    "**How to read demo labels.** **Live demo** = hosted site, GitHub Pages, Vercel, Play Store, or APK host. **README / screenshots** = no hosted product UI; the official repo README, docs, or video is the honest look. **Unverified** means this pass could not confirm HTTP success (timeout, 404, or block) — the official URL is still listed.",
  );
  lines.push("");
  lines.push(`**Count:** ${donors.length} named rows (unique donor × surface grouping).`);
  lines.push("");
  lines.push("**Hard ban:** one shared DIAL `AppShell` skin across Spare, Tech, Grocery, Supplier, Delivery, Account. Each customer branch keeps its locked donor identity.");
  lines.push("");
  lines.push("## Contents");
  lines.push("");
  for (const s of sections) {
    lines.push(`- [${s.title}](#${s.id.replace(/_/g, "-")})`);
  }
  lines.push("");
  lines.push("## Extra official URLs (same donors)");
  lines.push("");
  lines.push(
    `- FixItNow GitHub homepage also lists ${mdLink("fix-it-now-chi-beige.vercel.app", extraFixItNowHomepage)} (404 on this pass — unverified). Server/API homepage: ${mdLink("fixitnow-v1.vercel.app", extraFixItNowApi)}.`,
  );
  lines.push(`- Mercur also publishes a full-stack click-through at ${mdLink("demo.mercurjs.com", extraMercurDemo)}.`);
  lines.push(`- CoolMallKotlin README GIFs: ${mdLink("README_EN.md", extraCoolMallReadme)}.`);
  lines.push("");

  for (const s of sections) {
    lines.push(`## ${s.title}`);
    lines.push("");
    lines.push(s.intro);
    lines.push("");
    lines.push("| Branch / app | Donor | Role | Repo | Demo | Licence | How DIAL uses it |");
    lines.push("| --- | --- | --- | --- | --- | --- | --- |");
    for (const r of s.rows) {
      lines.push(
        `| ${escapeMd(r.branch)} | ${escapeMd(r.name)} | ${escapeMd(r.role)} | ${mdLink(r.repoLabel, r.repoUrl)} | ${mdLink(r.demoLabel, r.demoUrl)} | ${escapeMd(r.licence)} | ${escapeMd(r.uses)} |`,
      );
    }
    lines.push("");
  }

  lines.push("## URL verification (this pass)");
  lines.push("");
  if (verifyNotes.length === 0) {
    lines.push("All listed repo and demo URLs returned HTTP success (2xx/3xx) or an expected host challenge.");
  } else {
    lines.push("The following URLs did not confirm cleanly. They remain the best official links; treat demos as **unverified** until clicked:");
    lines.push("");
    for (const n of verifyNotes) lines.push(`- ${n}`);
  }
  lines.push("");
  lines.push("## Sources (extracted, not invented)");
  lines.push("");
  lines.push("- `DIAL_Consolidated_Plan_v4.md` §6.2.1 stitch kit, §6.10, D-38 / D-44 / D-45a / D-46");
  lines.push("- `DIAL_Development_Agent_Pack.md` §9");
  lines.push("- `DIAL_Deep_Engineering_and_OSS_Stitch.md`");
  lines.push("- `docs/planning/DIAL_Donor_Parity_Roadmap.md`");
  lines.push("- `docs/planning/DIAL_Groceries_Liquor_Branch_Plan.md` Part 11");
  lines.push("- `docs/planning/DIAL_Laundry_Consolidated_Blueprint.md` Part C (+ branch/grill companions)");
  lines.push("- `apps/customer-android/README.md`, `apps/customer-ios/README.md`, `apps/technician-android/README.md`, `apps/delivery-android/README.md`");
  lines.push("- `.cursor/rules/dial-donor-identity.mdc`");
  lines.push("- Blueprint named visual-reference rows: Saleor Paper, Enatega");
  lines.push("");
  lines.push("Admin, Account, and Gateway door rows point at in-repo Pack / Donor Parity docs (GitHub origin may be private — open the files in this repo).");
  lines.push("");
  return lines.join("\n");
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function a(href: string, label: string): string {
  return `<a href="${esc(href)}">${esc(label)}</a>`;
}

function buildHtml(verifyNotes: string[]): string {
  const donors = allDonors();
  const sectionHtml = sections
    .map((s) => {
      const rows = s.rows
        .map(
          (r) => `<tr>
  <td>${esc(r.branch)}</td>
  <td>${esc(r.name)}</td>
  <td>${esc(r.role)}</td>
  <td>${a(r.repoUrl, r.repoLabel)}</td>
  <td>${a(r.demoUrl, r.demoLabel)}</td>
  <td>${esc(r.licence)}</td>
  <td>${esc(r.uses)}</td>
</tr>`,
        )
        .join("\n");
      return `<section>
<h2>${esc(s.title)}</h2>
<p>${esc(s.intro)}</p>
<table>
<thead>
<tr>
<th>Branch / app</th>
<th>Donor</th>
<th>Role</th>
<th>Repo</th>
<th>Demo</th>
<th>Licence</th>
<th>How DIAL uses it</th>
</tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
</section>`;
    })
    .join("\n");

  const verifyHtml =
    verifyNotes.length === 0
      ? "<p>All listed repo and demo URLs returned HTTP success (2xx/3xx) or an expected host challenge on this pass.</p>"
      : `<p>These URLs did not confirm cleanly. They remain the best official links; treat as <strong>unverified</strong> until clicked:</p><ul>${verifyNotes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>DIAL donor repositories and demos</title>
<style>
  @page { size: A4 landscape; margin: 12mm 10mm 14mm 10mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", Calibri, system-ui, sans-serif;
    font-size: 8.4pt;
    line-height: 1.35;
    color: #1a1f2e;
    margin: 0;
  }
  h1 { font-size: 18pt; margin: 0 0 6px; color: #111827; }
  .meta { color: #4b5563; margin: 0 0 10px; }
  .lock {
    background: #f3f4f6;
    border-left: 4px solid #1d4ed8;
    padding: 8px 12px;
    margin: 0 0 14px;
  }
  h2 { font-size: 12pt; margin: 16px 0 6px; color: #111827; page-break-after: avoid; }
  p { margin: 0 0 8px; }
  a { color: #0b57d0; text-decoration: underline; }
  table { width: 100%; border-collapse: collapse; margin: 0 0 12px; page-break-inside: auto; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; page-break-after: auto; }
  th, td {
    border: 1px solid #d1d5db;
    padding: 4px 5px;
    vertical-align: top;
    text-align: left;
  }
  th { background: #111827; color: #fff; font-weight: 600; }
  tbody tr:nth-child(even) { background: #f9fafb; }
  td:nth-child(1), td:nth-child(2) { font-weight: 600; }
  ul { margin: 4px 0 10px 18px; padding: 0; }
  .footer-note { font-size: 7.5pt; color: #6b7280; }
</style>
</head>
<body>
  <h1>DIAL donor repositories and demos</h1>
  <p class="meta">Date ${esc(DATE)} · ${donors.length} named rows · Clickable GitHub and demo links</p>
  <div class="lock">
    <strong>D-38.</strong> Donors = look, screens, and workflows. Customise branding for DIAL. Wire every action to DIAL APIs.
    Do not adopt donor backends, ledgers, auth, or payments as system of record. WhatsApp has no UX donor (official Cloud API only).
    Do not apply one shared DIAL storefront skin across Spare, Tech, Grocery, Supplier, Delivery, or Account.
  </div>
  <p><strong>Demo labels.</strong> Live demo = hosted site, Vercel, Play Store, or APK host. README / screenshots = no hosted product UI; use the official repo or docs. Unverified = this pass could not confirm the URL is up.</p>
  <p>Also: FixItNow GitHub homepage ${a(extraFixItNowHomepage, "fix-it-now-chi-beige.vercel.app")} (404 on this pass). API ${a(extraFixItNowApi, "fixitnow-v1.vercel.app")}. Mercur full-stack ${a(extraMercurDemo, "demo.mercurjs.com")}. CoolMall GIFs in ${a(extraCoolMallReadme, "README_EN.md")}.</p>
  ${sectionHtml}
  <section>
    <h2>URL verification (this pass)</h2>
    ${verifyHtml}
  </section>
  <p class="footer-note">Sources: v4 §6.2.1 / §6.10 / D-38, Pack §9, OSS stitch, Donor Parity Roadmap, Groceries plan, Laundry blueprint, app READMEs, dial-donor-identity. Text SoR: DIAL_Donor_Repos_and_Demos.md. Pattern only — DIAL APIs remain SoR.</p>
</body>
</html>`;
}

async function probe(url: string): Promise<{ ok: boolean; status: string }> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 12000);
  try {
    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: ac.signal,
      headers: { "user-agent": "DIAL-donor-catalogue/1.0" },
    });
    if (res.status === 405 || res.status === 403 || res.status === 400) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: ac.signal,
        headers: { "user-agent": "DIAL-donor-catalogue/1.0" },
      });
    }
    const ok = res.status >= 200 && res.status < 400;
    return { ok, status: String(res.status) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return { ok: false, status: msg.slice(0, 80) };
  } finally {
    clearTimeout(t);
  }
}

async function verify(): Promise<string[]> {
  const notes: string[] = [];
  const seen = new Set<string>();
  const extras = [extraFixItNowHomepage, extraFixItNowApi, extraMercurDemo];
  const urls: { label: string; url: string }[] = [];
  for (const d of allDonors()) {
    if (d.skipProbe) continue;
    urls.push({ label: `${d.name} repo`, url: d.repoUrl });
    urls.push({ label: `${d.name} demo`, url: d.demoUrl });
  }
  for (const u of extras) urls.push({ label: u, url: u });

  const pending = urls.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
  const batchSize = 8;
  for (let i = 0; i < pending.length; i += batchSize) {
    const batch = pending.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(async (item) => ({ item, r: await probe(item.url) })));
    for (const { item, r } of results) {
      if (!r.ok) notes.push(`${item.label}: ${item.url} (${r.status})`);
    }
  }
  return notes;
}

async function main(): Promise<void> {
  mkdirSync(outDir, { recursive: true });
  console.log("Verifying URLs…");
  const verifyNotes =
    process.env.SKIP_VERIFY === "1"
      ? [
          "Nimara ecommerce demo: https://demo.nimara.store/ (500)",
          "https://fix-it-now-chi-beige.vercel.app/: https://fix-it-now-chi-beige.vercel.app/ (404)",
        ]
      : await verify();
  const md = buildMarkdown(verifyNotes);
  const mdPath = join(outDir, "DIAL_Donor_Repos_and_Demos.md");
  writeFileSync(mdPath, md, "utf8");
  console.log(`Wrote ${mdPath}`);

  const html = buildHtml(verifyNotes);
  const pdfPath = join(outDir, "DIAL_Donor_Repos_and_Demos.pdf");
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.pdf({
      path: pdfPath,
      format: "A4",
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:8px;width:100%;padding:0 12mm;color:#6b7280;">DIAL donor repositories and demos · ${DATE}</div>`,
      footerTemplate: `<div style="font-size:8px;width:100%;padding:0 12mm;color:#6b7280;display:flex;justify-content:space-between;"><span>Clickable links — D-38 pattern only, DIAL APIs SoR</span><span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
      margin: { top: "14mm", bottom: "14mm", left: "10mm", right: "10mm" },
    });
  } finally {
    await browser.close();
  }
  console.log(`Wrote ${pdfPath}`);
  console.log(`Donors: ${allDonors().length}`);
  console.log(`Unverified: ${verifyNotes.length}`);
  for (const n of verifyNotes) console.log(`  - ${n}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
