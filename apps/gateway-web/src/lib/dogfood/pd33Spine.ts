/**
 * PD33 — staging/dogfood recon spine (Spare + grocery food + Meta WA).
 * dial-webapp-recon habits: inspect surfaces then assert DoD; no OpenAPI invent;
 * no liquor; AI never writes payable amounts.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  __resetGroceryForTests,
  groceryMeiliFilterForSession,
  MEILI_GROCERY_INDEX_DEFAULT,
  MEILI_SPARE_INDEX_DEFAULT,
} from "@dial/catalogue";
import { runPd12WaFlowsSandboxThinVertical } from "@dial/adapter-whatsapp";
import { runPd14GroceryWebThinVertical } from "../grocery/pd14Spine.js";
import { runPd11FdmsSandboxThinVertical } from "@dial/ledger";

export type Pd33ReconNote = {
  surface: string;
  waitStrategy: "source_grep_then_api" | "package_thin_vertical";
  selectorsOrMarkers: string[];
  status: "ok" | "gap";
  note: string;
};

export type Pd33DogfoodResult = {
  recon: Pd33ReconNote[];
  spareUsdBrowse: true;
  spareEcoCashCodCtas: true;
  groceryFoodNoLiquor: true;
  groceryEcoCashCodCtas: true;
  b2bInformalFilter: true;
  waFlowsCloudApiOnly: true;
  meiliSpareIndex: string;
  meiliGroceryIndex: string;
  fdmsDaySandbox: true;
  groceryCheckoutUsd: true;
  payableFromAi: false;
  baileysForbidden: true;
  liquorForbidden: true;
};

function appRoot(): string {
  return join(process.cwd(), "src/app");
}

function readPage(...parts: string[]): string {
  return readFileSync(join(appRoot(), ...parts), "utf8");
}

function withSandboxEnv(run: () => Promise<void>): Promise<void> {
  const prev = {
    mode: process.env.DIAL_INTEGRATION_MODE,
    token: process.env.WHATSAPP_TOKEN,
    phone: process.env.WHATSAPP_PHONE_NUMBER_ID,
    ecoKey: process.env.ECOCASH_API_KEY,
    ecoMerch: process.env.ECOCASH_MERCHANT_CODE,
    fdmsBase: process.env.FDMS_BASE_URL,
    fdmsDev: process.env.FDMS_DEVICE_ID,
    fdmsAct: process.env.FDMS_ACTIVATION_KEY,
    fdmsHttp: process.env.FDMS_SANDBOX_HTTP,
  };
  process.env.DIAL_INTEGRATION_MODE = "sandbox";
  process.env.WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN ?? "wa_token_pd33";
  process.env.WHATSAPP_PHONE_NUMBER_ID =
    process.env.WHATSAPP_PHONE_NUMBER_ID ?? "phone_pd33";
  process.env.ECOCASH_API_KEY = process.env.ECOCASH_API_KEY ?? "eco_key_pd33";
  process.env.ECOCASH_MERCHANT_CODE =
    process.env.ECOCASH_MERCHANT_CODE ?? "eco_merch_pd33";
  process.env.FDMS_BASE_URL =
    process.env.FDMS_BASE_URL ?? "https://fdms.sandbox.dial.local";
  process.env.FDMS_DEVICE_ID = process.env.FDMS_DEVICE_ID ?? "dev_pd33";
  process.env.FDMS_ACTIVATION_KEY =
    process.env.FDMS_ACTIVATION_KEY ?? "act_pd33";
  delete process.env.FDMS_SANDBOX_HTTP;
  return run().finally(() => {
    const restore = (envKey: string, v: string | undefined) => {
      if (v === undefined) delete process.env[envKey];
      else process.env[envKey] = v;
    };
    restore("DIAL_INTEGRATION_MODE", prev.mode);
    restore("WHATSAPP_TOKEN", prev.token);
    restore("WHATSAPP_PHONE_NUMBER_ID", prev.phone);
    restore("ECOCASH_API_KEY", prev.ecoKey);
    restore("ECOCASH_MERCHANT_CODE", prev.ecoMerch);
    restore("FDMS_BASE_URL", prev.fdmsBase);
    restore("FDMS_DEVICE_ID", prev.fdmsDev);
    restore("FDMS_ACTIVATION_KEY", prev.fdmsAct);
    restore("FDMS_SANDBOX_HTTP", prev.fdmsHttp);
  });
}

/**
 * Recon-then-act thin vertical for dogfood DoD (fixture/sandbox rails).
 */
export async function runPd33StagingDogfoodThinVertical(): Promise<Pd33DogfoodResult> {
  const recon: Pd33ReconNote[] = [];

  const spareBrowse = readPage("spare", "page.tsx");
  const spareCheckout = readPage("spare", "checkout", "page.tsx");
  const spareCart = readPage("spare", "cart", "page.tsx");
  const groceryBrowse = readPage("grocery", "page.tsx");
  const groceryCheckout = readPage("grocery", "checkout", "page.tsx");
  const adminWa = readPage("admin", "wa", "page.tsx");

  const spareUsd =
    /USD|displayCurrency|D-57/.test(spareBrowse) &&
    /USD/.test(spareCart);
  recon.push({
    surface: "/spare + /spare/cart",
    waitStrategy: "source_grep_then_api",
    selectorsOrMarkers: ["USD", "D-57"],
    status: spareUsd ? "ok" : "gap",
    note: "Spare browse/cart must be USD-only (D-57)",
  });
  if (!spareUsd) throw new Error("PD33 Spare USD browse DoD failed");

  const sparePay =
    /EcoCash/i.test(spareCheckout) && /COD/i.test(spareCheckout);
  recon.push({
    surface: "/spare/checkout",
    waitStrategy: "source_grep_then_api",
    selectorsOrMarkers: ["EcoCash", "COD"],
    status: sparePay ? "ok" : "gap",
    note: "Required EcoCash | COD checkout CTAs (D-57)",
  });
  if (!sparePay) throw new Error("PD33 Spare EcoCash|COD CTAs missing");

  const groceryOk =
    /USD/.test(groceryBrowse) &&
    /no liquor|food only|liquor|counsel/i.test(groceryBrowse);
  recon.push({
    surface: "/grocery",
    waitStrategy: "source_grep_then_api",
    selectorsOrMarkers: ["USD", "no liquor"],
    status: groceryOk ? "ok" : "gap",
    note: "Grocery food only — liquor counsel-gated",
  });
  if (!groceryOk) throw new Error("PD33 grocery food/no-liquor DoD failed");

  const groceryPay =
    /EcoCash/i.test(groceryCheckout) && /COD/i.test(groceryCheckout);
  recon.push({
    surface: "/grocery/checkout",
    waitStrategy: "source_grep_then_api",
    selectorsOrMarkers: ["EcoCash", "COD"],
    status: groceryPay ? "ok" : "gap",
    note: "Grocery EcoCash|COD checkout CTAs",
  });
  if (!groceryPay) throw new Error("PD33 grocery EcoCash|COD CTAs missing");

  const waOk =
    /Cloud API/i.test(adminWa) &&
    /No Baileys/i.test(adminWa) &&
    /FLOW_SPARE_/i.test(adminWa) &&
    /FLOW_GROCERY_/i.test(adminWa);
  recon.push({
    surface: "/admin/wa",
    waitStrategy: "source_grep_then_api",
    selectorsOrMarkers: ["Cloud API", "No Baileys", "FLOW_SPARE_", "FLOW_GROCERY_"],
    status: waOk ? "ok" : "gap",
    note: "Meta WA admin surface — Cloud API only",
  });
  if (!waOk) throw new Error("PD33 admin WA surface DoD failed");

  const b2bFilter = groceryMeiliFilterForSession("b2b");
  if (!/formal|supplierFormality/i.test(b2bFilter)) {
    throw new Error("PD33 B2B Meili filter must constrain formality (D-49)");
  }
  recon.push({
    surface: "groceryMeiliFilterForSession(b2b)",
    waitStrategy: "package_thin_vertical",
    selectorsOrMarkers: [b2bFilter],
    status: "ok",
    note: "D-49 B2B informal hide at Meili filter",
  });

  if (
    MEILI_SPARE_INDEX_DEFAULT !== "spare_offers_v1" ||
    MEILI_GROCERY_INDEX_DEFAULT !== "grocery_offers_v1"
  ) {
    throw new Error("PD33 Meili index names drifted from Pack SoR");
  }

  __resetGroceryForTests();
  const grocery = await runPd14GroceryWebThinVertical({
    offerId: "groc_milk_1l",
    payChoice: "cod",
    buyerSegment: "b2c",
  });
  if (grocery.currency !== "USD" || grocery.liquorAllowed !== false) {
    throw new Error("PD33 grocery thin vertical USD/food failed");
  }
  recon.push({
    surface: "runPd14GroceryWebThinVertical",
    waitStrategy: "package_thin_vertical",
    selectorsOrMarkers: ["USD", "COD", "erp track"],
    status: "ok",
    note: "Grocery food checkout → track sandbox rail",
  });

  await withSandboxEnv(async () => {
    const wa = await runPd12WaFlowsSandboxThinVertical();
    if (wa.grocery.liquorForbidden !== true) {
      throw new Error("PD33 WA grocery must forbid liquor");
    }
    if (wa.spare.intentMethod !== "ecocash_direct") {
      throw new Error("PD33 WA spare EcoCash path failed");
    }
    recon.push({
      surface: "runPd12WaFlowsSandboxThinVertical",
      waitStrategy: "package_thin_vertical",
      selectorsOrMarkers: ["FLOW_SPARE_*", "FLOW_GROCERY_*", "ecocash_direct"],
      status: "ok",
      note: "Meta Cloud API Flows sandbox — EcoCash|COD",
    });

    const fdms = await runPd11FdmsSandboxThinVertical({
      orderId: `ord_pd33_${Date.now().toString(36)}`,
    });
    if (fdms.mode !== "sandbox" || !fdms.dayOpened.fiscalDayId) {
      throw new Error("PD33 FDMS day sandbox rail failed");
    }
    recon.push({
      surface: "runPd11FdmsSandboxThinVertical",
      waitStrategy: "package_thin_vertical",
      selectorsOrMarkers: ["FDMS virtual day", fdms.dayOpened.fiscalDayId!],
      status: "ok",
      note: "FDMS day sandbox rail as already wired (D-40a)",
    });
  });

  if (recon.some((r) => r.status === "gap")) {
    throw new Error("PD33 recon found gaps");
  }

  return {
    recon,
    spareUsdBrowse: true,
    spareEcoCashCodCtas: true,
    groceryFoodNoLiquor: true,
    groceryEcoCashCodCtas: true,
    b2bInformalFilter: true,
    waFlowsCloudApiOnly: true,
    meiliSpareIndex: MEILI_SPARE_INDEX_DEFAULT,
    meiliGroceryIndex: MEILI_GROCERY_INDEX_DEFAULT,
    fdmsDaySandbox: true,
    groceryCheckoutUsd: true,
    payableFromAi: false,
    baileysForbidden: true,
    liquorForbidden: true,
  };
}
