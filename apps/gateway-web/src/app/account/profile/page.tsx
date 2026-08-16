/**
 * PD82 — Customer account profile (Pack §10 Identity). Session SoR.
 */
"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type Profile = {
  userId: string;
  email: string;
  displayName: string;
  role: string;
  buyerSegment: string;
};

export default function AccountProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/profile");
      const data = (await res.json()) as { error?: string; profile?: Profile };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setProfile(data.profile ?? null);
      setDisplayName(data.profile?.displayName ?? "");
    } finally {
      setBusy(false);
    }
  }, []);

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ displayName }),
      });
      const data = (await res.json()) as { error?: string; profile?: Profile };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setProfile(data.profile ?? null);
      setMessage("Profile updated (PD82)");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      data-testid="account-profile"
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
          <Link href="/account/consent">Consent</Link>
          {" · "}
          <Link href="/account/promo">Promo</Link>
          {" · "}
          <Link href="/home">Home</Link>
        </nav>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Account profile</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <button type="button" disabled={busy} onClick={() => void refresh()}>
            Refresh
          </button>
          <button type="button" disabled={busy} onClick={() => void save()}>
            Save display name
          </button>
        </div>
        <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
          Display name
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc" }}
          />
        </label>
        {profile ? (
          <p style={{ marginTop: 16, fontSize: 14 }}>
            {profile.email} · {profile.buyerSegment} · {profile.role}
          </p>
        ) : null}
        {message ? <p role="status">{message}</p> : null}
      </div>
    </main>
  );
}
