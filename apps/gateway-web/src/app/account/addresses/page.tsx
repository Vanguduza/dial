/**
 * PD83 — Customer delivery addresses (pin + landmark + phone). MapLibre SoR.
 */
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";
import { DialMap } from "../../../components/map/DialMap";

type Address = {
  addressId: string;
  label: string;
  lat: number;
  lng: number;
  landmark: string;
  phoneE164: string;
  isDefault: boolean;
};

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [label, setLabel] = useState("Home");
  const [landmark, setLandmark] = useState("Avondale");
  const [phone, setPhone] = useState("+263771000000");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pin, setPin] = useState({ lat: -17.8292, lng: 31.0522 });

  const refresh = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/addresses");
      const data = (await res.json()) as {
        error?: string;
        addresses?: Address[];
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setAddresses(data.addresses ?? []);
    } finally {
      setBusy(false);
    }
  }, []);

  async function add() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          label,
          lat: pin.lat,
          lng: pin.lng,
          landmark,
          phoneE164: phone,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage("Address added (PD83)");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="account-addresses"
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <nav style={{ marginBottom: dialTokens.space.md, fontSize: 14 }}>
          <Link href="/account/profile">Profile</Link>
          {" · "}
          <Link href="/home">Home</Link>
        </nav>
        <h1 style={{ fontSize: 22 }}>Delivery addresses</h1>
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" />
          <input
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            placeholder="Landmark"
          />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" disabled={busy} onClick={() => void add()}>
              Add
            </button>
            <button type="button" disabled={busy} onClick={() => void refresh()}>
              Refresh
            </button>
          </div>
        </div>
          <DialMap
            pins={addresses.map((a) => ({
              id: a.addressId,
              lat: a.lat,
              lng: a.lng,
              label: a.label,
            }))}
            onPick={(lat, lng) => setPin({ lat, lng })}
          />
        <ul style={{ marginTop: 16 }}>
          {addresses.map((a) => (
            <li key={a.addressId}>
              {a.label} · {a.landmark} · {a.phoneE164}
              {a.isDefault ? " · DEFAULT" : ""}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
