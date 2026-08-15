/**
 * PD83 — customer delivery addresses (Pack customers.addresses).
 * pin + landmark + phone; session-owned customerId only (D-47).
 */

export type CustomerAddress = {
  addressId: string;
  customerId: string;
  label: string;
  /** MapLibre pin — lat/lng SoR, never Google (D-44). */
  lat: number;
  lng: number;
  landmark: string;
  phoneE164: string;
  isDefault: boolean;
  createdAt: string;
  mapSor: "maplibre";
  payableFromAi: false;
};

const addresses = new Map<string, CustomerAddress>();

function aid(): string {
  return `addr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function addCustomerAddress(input: {
  customerId: string;
  label: string;
  lat: number;
  lng: number;
  landmark: string;
  phoneE164: string;
  isDefault?: boolean;
}): CustomerAddress {
  if (!input.customerId.trim()) throw new Error("customerId required");
  if (!input.label.trim()) throw new Error("label required");
  if (!input.landmark.trim()) throw new Error("landmark required");
  if (!input.phoneE164.trim()) throw new Error("phoneE164 required");
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) {
    throw new Error("lat/lng required");
  }
  const existing = listCustomerAddresses(input.customerId);
  const makeDefault = input.isDefault === true || existing.length === 0;
  if (makeDefault) {
    for (const a of addresses.values()) {
      if (a.customerId === input.customerId) a.isDefault = false;
    }
  }
  const row: CustomerAddress = {
    addressId: aid(),
    customerId: input.customerId.trim(),
    label: input.label.trim(),
    lat: input.lat,
    lng: input.lng,
    landmark: input.landmark.trim(),
    phoneE164: input.phoneE164.trim(),
    isDefault: makeDefault,
    createdAt: new Date().toISOString(),
    mapSor: "maplibre",
    payableFromAi: false,
  };
  addresses.set(row.addressId, row);
  return { ...row };
}

export function listCustomerAddresses(customerId: string): CustomerAddress[] {
  return [...addresses.values()]
    .filter((a) => a.customerId === customerId)
    .map((a) => ({ ...a }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function setDefaultCustomerAddress(input: {
  customerId: string;
  addressId: string;
}): CustomerAddress {
  const row = addresses.get(input.addressId);
  if (!row || row.customerId !== input.customerId) {
    throw new Error("Unknown address for customer");
  }
  for (const a of addresses.values()) {
    if (a.customerId === input.customerId) {
      a.isDefault = a.addressId === input.addressId;
    }
  }
  return { ...row, isDefault: true };
}

export function deleteCustomerAddress(input: {
  customerId: string;
  addressId: string;
}): { deleted: true; addressId: string; newDefaultId: string | null } {
  const row = addresses.get(input.addressId);
  if (!row || row.customerId !== input.customerId) {
    throw new Error("Unknown address for customer");
  }
  const wasDefault = row.isDefault;
  addresses.delete(input.addressId);
  let newDefaultId: string | null = null;
  if (wasDefault) {
    const rest = listCustomerAddresses(input.customerId);
    if (rest[0]) {
      setDefaultCustomerAddress({
        customerId: input.customerId,
        addressId: rest[0].addressId,
      });
      newDefaultId = rest[0].addressId;
    }
  }
  return { deleted: true, addressId: input.addressId, newDefaultId };
}

/**
 * PD83 thin vertical: add two pins → set default → delete default promotes.
 */
export function runPd83CustomerAddressesThinVertical(): {
  defaultPinned: true;
  promotedAfterDelete: true;
  mapSor: "maplibre";
  payableFromAi: false;
} {
  __resetCustomerAddressesForTests();
  const a = addCustomerAddress({
    customerId: "cust_pd83",
    label: "Home",
    lat: -17.8292,
    lng: 31.0522,
    landmark: "Avondale shops",
    phoneE164: "+263771000083",
  });
  if (!a.isDefault) throw new Error("PD83 first address must be default");
  const b = addCustomerAddress({
    customerId: "cust_pd83",
    label: "Work",
    lat: -17.824,
    lng: 31.053,
    landmark: "CBD",
    phoneE164: "+263771000084",
    isDefault: true,
  });
  if (!b.isDefault) throw new Error("PD83 set default failed");
  const listed = listCustomerAddresses("cust_pd83");
  if (listed.filter((x) => x.isDefault).length !== 1) {
    throw new Error("PD83 expected one default");
  }
  const del = deleteCustomerAddress({
    customerId: "cust_pd83",
    addressId: b.addressId,
  });
  if (del.newDefaultId !== a.addressId) {
    throw new Error("PD83 delete default must promote remaining");
  }
  return {
    defaultPinned: true,
    promotedAfterDelete: true,
    mapSor: "maplibre",
    payableFromAi: false,
  };
}

export function __resetCustomerAddressesForTests(): void {
  addresses.clear();
}
