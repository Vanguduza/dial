"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type Vehicle = {
  vehicleId: string;
  make: string;
  model: string;
  chassisCode: string;
};
type Group = { groupId: string; title: string };
type Assembly = { assemblyId: string; title: string; chassisCodes: string[] };
type Hit = {
  offerId: string;
  title: string;
  unitPriceUsdMinor: string;
  supplierFormality: string;
  displayCurrency: string;
};

/**
 * PD27 dual entry — Select Vehicle | Browse EPC (Pack §9.2 / C-6).
 * Join on chassis_code; USD browse (D-57); session B2B hide informal (D-49).
 */
export default function SpareDualEntryPage() {
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [make, setMake] = useState("Toyota");
  const [model, setModel] = useState("Hilux");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [chassis, setChassis] = useState<string | null>(null);
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [hits, setHits] = useState<Hit[]>([]);
  const [entryPath, setEntryPath] = useState<"select_vehicle" | "browse_epc">(
    "select_vehicle",
  );
  const [message, setMessage] = useState<string | null>(null);

  const loadEntry = useCallback(async () => {
    const res = await fetch("/api/spare/entry?view=entry");
    const data = (await res.json()) as {
      makes?: string[];
      groups?: Group[];
      error?: string;
    };
    if (!res.ok) {
      setMessage(data.error ?? `HTTP ${res.status}`);
      return;
    }
    setMakes(data.makes ?? []);
    setGroups(data.groups ?? []);
  }, []);

  useEffect(() => {
    void loadEntry();
  }, [loadEntry]);

  async function loadModels(nextMake: string) {
    setMake(nextMake);
    const res = await fetch(
      `/api/spare/entry?view=models&make=${encodeURIComponent(nextMake)}`,
    );
    const data = (await res.json()) as { models?: string[] };
    setModels(data.models ?? []);
    if (data.models?.[0]) setModel(data.models[0]);
  }

  async function selectVehicle() {
    setEntryPath("select_vehicle");
    setMessage(null);
    const res = await fetch(
      `/api/spare/entry?view=select_vehicle&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&year=2010`,
    );
    const data = (await res.json()) as {
      vehicles?: Vehicle[];
      error?: string;
    };
    if (!res.ok) {
      setMessage(data.error ?? `HTTP ${res.status}`);
      return;
    }
    setVehicles(data.vehicles ?? []);
    const first = data.vehicles?.[0];
    if (first) {
      setChassis(first.chassisCode);
      await loadOffers(first.chassisCode, "select_vehicle");
    }
  }

  async function browseEpc(groupId: string) {
    setEntryPath("browse_epc");
    setMessage(null);
    const chassisQ = chassis ? `&chassis=${encodeURIComponent(chassis)}` : "";
    const res = await fetch(
      `/api/spare/entry?view=epc_assemblies&groupId=${encodeURIComponent(groupId)}${chassisQ}`,
    );
    const data = (await res.json()) as {
      assemblies?: Assembly[];
      error?: string;
    };
    if (!res.ok) {
      setMessage(data.error ?? `HTTP ${res.status}`);
      return;
    }
    setAssemblies(data.assemblies ?? []);
    const code =
      chassis ??
      data.assemblies?.[0]?.chassisCodes[0] ??
      null;
    if (code) {
      setChassis(code);
      await loadOffers(code, "browse_epc");
    }
  }

  async function loadOffers(
    code: string,
    entry: "select_vehicle" | "browse_epc",
  ) {
    const res = await fetch(
      `/api/spare/entry?view=offers&chassis=${encodeURIComponent(code)}&entry=${entry}`,
    );
    const data = (await res.json()) as {
      hits?: Hit[];
      error?: string;
      displayCurrency?: string;
    };
    if (!res.ok) {
      setMessage(data.error ?? `HTTP ${res.status}`);
      return;
    }
    setHits(data.hits ?? []);
    setMessage(
      `${entry} · chassis ${code} · ${data.hits?.length ?? 0} USD offers · no reverse-engineered EPC`,
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: `linear-gradient(160deg, ${dialTokens.color.brand.surface} 0%, #e8ebe4 55%, ${dialTokens.color.brand.primary}22 100%)`,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <header style={{ maxWidth: 960, margin: "0 auto" }}>
        <p
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
            margin: 0,
            color: dialTokens.color.brand.primary,
          }}
        >
          Dial a Spare
        </p>
        <h1 style={{ fontSize: "1.25rem", margin: "8px 0 0" }}>
          Select Vehicle | Browse EPC
        </h1>
        <p style={{ opacity: 0.75, fontSize: 14 }}>
          Dual entry · join on chassis_code · USD only (D-57) · OpenCatalog/ACES
          fixtures (C-6)
        </p>
        <nav
          style={{
            display: "flex",
            gap: dialTokens.space.md,
            flexWrap: "wrap",
            marginTop: dialTokens.space.sm,
          }}
        >
          <Link href="/home">Home</Link>
          <Link href="/spare">Search</Link>
          <Link href="/spare/cart">Cart</Link>
          <Link href="/spare/garage">Garage</Link>
        </nav>
      </header>

      <section
        style={{
          maxWidth: 960,
          margin: `${dialTokens.space.lg} auto 0`,
          display: "grid",
          gap: dialTokens.space.lg,
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        }}
      >
        <article
          style={{
            padding: dialTokens.space.lg,
            borderRadius: 14,
            background: dialTokens.color.brand.primary,
            color: "#fff",
          }}
        >
          <h2 style={{ margin: 0 }}>Select Vehicle</h2>
          <p style={{ fontSize: 14, opacity: 0.9 }}>vehicle_master cascade</p>
          <label style={{ display: "block", marginTop: 12, fontSize: 13 }}>
            Make
            <select
              value={make}
              onChange={(e) => void loadModels(e.target.value)}
              style={{ display: "block", width: "100%", marginTop: 4 }}
            >
              {(makes.length ? makes : ["Toyota"]).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "block", marginTop: 8, fontSize: 13 }}>
            Model
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{ display: "block", width: "100%", marginTop: 4 }}
            >
              {(models.length ? models : ["Hilux", "Corolla"]).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void selectVehicle()}
            style={{ marginTop: 12, padding: "10px 14px" }}
          >
            Resolve chassis
          </button>
          <ul style={{ marginTop: 12, paddingLeft: 18, fontSize: 13 }}>
            {vehicles.map((v) => (
              <li key={v.vehicleId}>
                {v.make} {v.model} → {v.chassisCode}
              </li>
            ))}
          </ul>
        </article>

        <article
          style={{
            padding: dialTokens.space.lg,
            borderRadius: 14,
            background: dialTokens.color.brand.accent,
            color: "#fff",
          }}
        >
          <h2 style={{ margin: 0 }}>Browse EPC</h2>
          <p style={{ fontSize: 14, opacity: 0.9 }}>
            catalog_* groups · brand-feed fixtures
          </p>
          <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
            {groups.map((g) => (
              <li key={g.groupId} style={{ marginBottom: 8 }}>
                <button
                  type="button"
                  onClick={() => void browseEpc(g.groupId)}
                  style={{ padding: "8px 12px", width: "100%" }}
                >
                  {g.title}
                </button>
              </li>
            ))}
          </ul>
          <ul style={{ paddingLeft: 18, fontSize: 13 }}>
            {assemblies.map((a) => (
              <li key={a.assemblyId}>
                {a.title} · {a.chassisCodes.join(", ")}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section style={{ maxWidth: 960, margin: `${dialTokens.space.xl} auto 0` }}>
        <h2 style={{ fontSize: "1.1rem" }}>
          Offers {chassis ? `(${chassis})` : ""} · {entryPath} · USD
        </h2>
        {message && <p role="status">{message}</p>}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {hits.map((h) => (
            <li
              key={h.offerId}
              style={{
                marginBottom: 8,
                padding: dialTokens.space.md,
                background: "#fff",
                borderRadius: 10,
              }}
            >
              <Link href={`/spare/${h.offerId}`}>
                {h.title} — ${(Number(h.unitPriceUsdMinor) / 100).toFixed(2)}{" "}
                {h.displayCurrency}
              </Link>
              <span style={{ display: "block", fontSize: 12, opacity: 0.7 }}>
                {h.supplierFormality}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
