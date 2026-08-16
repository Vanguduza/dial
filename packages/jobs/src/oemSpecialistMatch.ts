/**
 * Deterministic OEM specialist matching (fitment-style).
 * LLM may hint brand/system; it must not pick technician ids.
 */

export function normalizeOemBrand(raw: string): string {
  const t = raw.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  if (/^(mercedes(?: benz)?|benz|mb)$/.test(t)) return "mercedes";
  if (/^(bmw)$/.test(t)) return "bmw";
  if (/^(audi)$/.test(t)) return "audi";
  if (/^(porsche)$/.test(t)) return "porsche";
  if (/^(land rover|range rover)$/.test(t)) return "land_rover";
  return t.replace(/\s+/g, "_");
}

export function technicianCoversOemBrand(
  specialties: readonly string[],
  brand: string,
): boolean {
  const want = normalizeOemBrand(brand);
  return specialties.some((s) => normalizeOemBrand(s) === want);
}

export type OemSpecialistMatchInput = {
  required: boolean;
  brand?: string | null;
};

export type OemSpecialistMatchResult<T> = {
  recommended: T[];
  fallback: T[];
  matchedOnBrand: string | null;
  payableFromAi: false;
};

/** Rank registered specialists for a structured hint. Never invents ids. */
export function matchCardsForOemSpecialist<
  T extends { oemSpecialties: readonly string[] },
>(
  cards: T[],
  input: OemSpecialistMatchInput,
): OemSpecialistMatchResult<T> {
  const brand = input.brand?.trim()
    ? normalizeOemBrand(input.brand)
    : null;
  if (!input.required || !brand) {
    return {
      recommended: [],
      fallback: [...cards],
      matchedOnBrand: null,
      payableFromAi: false,
    };
  }
  const recommended = cards.filter((c) =>
    technicianCoversOemBrand(c.oemSpecialties, brand),
  );
  const fallback = cards.filter(
    (c) => !technicianCoversOemBrand(c.oemSpecialties, brand),
  );
  return {
    recommended,
    fallback,
    matchedOnBrand: brand,
    payableFromAi: false,
  };
}
