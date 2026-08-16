"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { dialTokens } from "@dial/design-tokens";

type Toggle = {
  clientVisibility: string;
  labourLawReviewAck: boolean;
  fundedWorkingCapitalAck: boolean;
  staffToolsEnabled: boolean;
};

type Draft = {
  projectId: string;
  title: string;
  status: string;
  clientVisible: boolean;
  payableFromAi: boolean;
};

/**
 * PD24 Admin Projects toggle — Pack §9.5 / C-3 / §3.9.
 * Default coming soon; live gated on labour-law + working-capital acks.
 */
export default function AdminProjectsPage() {
  const [secret, setSecret] = useState("");
  const [toggle, setToggle] = useState<Toggle | null>(null);
  const [surface, setSurface] = useState<string>("—");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [title, setTitle] = useState("Internal design scaffold");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const headers = useCallback(
    () => ({
      "content-type": "application/json",
      "x-internal-secret": secret,
    }),
    [secret],
  );

  async function refresh() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/projects", { headers: headers() });
      const data = (await res.json()) as {
        error?: string;
        toggle?: Toggle;
        clientSurface?: { mode: string; label: string };
        internalProjects?: Draft[];
      };
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setToggle(data.toggle ?? null);
      setSurface(data.clientSurface?.label ?? "—");
      setDrafts(data.internalProjects ?? []);
    } finally {
      setBusy(false);
    }
  }

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/projects", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        error?: string;
        toggle?: Toggle;
        clientSurface?: { mode: string; label: string };
        internalProjects?: Draft[];
        draft?: Draft;
      };
      if (data.toggle) setToggle(data.toggle);
      if (data.clientSurface) setSurface(data.clientSurface.label);
      if (data.internalProjects) setDrafts(data.internalProjects);
      if (!res.ok) {
        setMessage(data.error ?? `HTTP ${res.status}`);
        return;
      }
      setMessage(
        data.draft
          ? `Draft ${data.draft.projectId} (payableFromAi=false)`
          : `Client surface: ${data.clientSurface?.label ?? "ok"}`,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        fontFamily: dialTokens.font.body,
        maxWidth: 720,
        margin: "0 auto",
        padding: "1.5rem 1rem 3rem",
        color: dialTokens.color.brand.ink,
      }}
    >
      <p style={{ margin: 0 }}>
        <Link href="/admin/compliance/legal">Legal hub</Link>
        {" · "}
        <Link href="/admin/compliance/wht">WHT</Link>
      </p>
      <h1 style={{ fontSize: "1.5rem", marginTop: "0.75rem" }}>
        Projects client toggle
      </h1>
      

      <label style={{ display: "block", marginTop: "1rem" }}>
        INTERNAL_API_SECRET
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          style={{ display: "block", width: "100%", marginTop: 4 }}
        />
      </label>
      <button type="button" disabled={busy} onClick={() => void refresh()}>
        Refresh
      </button>

      {toggle && (
        <section style={{ marginTop: "1.25rem" }}>
          <p>
            Client visibility: <strong>{toggle.clientVisibility}</strong> ·
            surface label: <strong>{surface}</strong>
          </p>
          <p>
            Labour-law ack: {String(toggle.labourLawReviewAck)} · Working-capital
            ack: {String(toggle.fundedWorkingCapitalAck)}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void post({
                action: "set_gates",
                labourLawReviewAck: true,
                fundedWorkingCapitalAck: true,
                setBy: "ops_ui",
              })
            }
          >
            Acknowledge labour + capital gates
          </button>{" "}
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void post({
                action: "set_visibility",
                visibility: "live",
                setBy: "ops_ui",
                note: "enable client projects",
              })
            }
          >
            Turn Projects live for clients
          </button>{" "}
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void post({
                action: "set_visibility",
                visibility: "coming_soon",
                setBy: "ops_ui",
              })
            }
          >
            Soft-launch (coming soon)
          </button>
        </section>
      )}

      <section style={{ marginTop: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem" }}>Internal staff draft</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void post({
              action: "create_internal_draft",
              title,
              createdBy: "ops_ui",
            })
          }
        >
          Create internal draft
        </button>
        <ul>
          {drafts.map((d) => (
            <li key={d.projectId}>
              {d.projectId}: {d.title} · clientVisible={String(d.clientVisible)} ·
              payableFromAi={String(d.payableFromAi)}
            </li>
          ))}
        </ul>
      </section>

      {message && (
        <p role="status" style={{ marginTop: "1rem" }}>
          {message}
        </p>
      )}
    </main>
  );
}
