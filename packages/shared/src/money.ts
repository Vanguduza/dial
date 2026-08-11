/** Ledger / payable currency codes (v4 §4.3 / Pack — ZWG = ZiG). */
export type Currency = "USD" | "ZWG";

/**
 * Integer minor units only — never float (DIAL non-negotiable #1).
 * Prefer bigint at package boundaries; serialize as string in JSON.
 */
export type AmountMinor = bigint;

export type Money = {
  amountMinor: AmountMinor;
  currency: Currency;
};

export function money(amountMinor: AmountMinor, currency: Currency): Money {
  if (typeof amountMinor !== "bigint") {
    throw new TypeError("amountMinor must be bigint");
  }
  return { amountMinor, currency };
}

export function moneyFromString(amountMinor: string, currency: Currency): Money {
  return money(BigInt(amountMinor), currency);
}
