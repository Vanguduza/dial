/**
 * PD6 supplier-web shell — Mercur vendor-panel IA patterns; DIAL @dial/suppliers SoR.
 * Screens: onboarding · costs upload · heartbeat · confirm-SLA · statements.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { dialTokens } from "@dial/design-tokens";
import {
  evaluateHeartbeatSla,
  getSupplier,
  listConfirmQueue,
  listCostUploads,
  listHeartbeats,
  listSlaEscalations,
  listStatements,
  syncSupplierSlaEscalations,
} from "@dial/suppliers";
import { listCoopAgreementsForSupplier } from "@dial/promotions";
import {
  getSessionFromToken,
  sessionCookieName,
} from "../../lib/auth/session";

function supplierIdFromEmail(email: string): string {
  return `sup_${email.split("@")[0]!.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
}

export default async function SupplierPortalPage() {
  const jar = await cookies();
  const session = getSessionFromToken(jar.get(sessionCookieName())?.value);
  if (!session) redirect("/");

  const supplierId = supplierIdFromEmail(session.email);
  const profile = getSupplier(supplierId);
  if (profile) syncSupplierSlaEscalations(supplierId);
  const heartbeatSla = profile ? evaluateHeartbeatSla(supplierId) : null;
  const escalations = listSlaEscalations(supplierId, { status: "open" });
  const heartbeats = listHeartbeats(supplierId);
  const queue = listConfirmQueue(supplierId);
  const uploads = listCostUploads(supplierId);
  const statements = listStatements(supplierId);
  const coopAgreements = listCoopAgreementsForSupplier(supplierId);
  const coopSpendLines = statements.filter((l) => l.kind === "coop_spend");

  return (
    <main
      data-testid="supplier-portal"
      style={{
        minHeight: "100vh",
        background: `linear-gradient(165deg, ${dialTokens.color.brand.surface} 0%, #e6ebe8 50%, ${dialTokens.color.brand.primary}18 100%)`,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <header style={{ maxWidth: 960, margin: "0 auto" }}>
        <p
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
            margin: 0,
            color: dialTokens.color.brand.primary,
          }}
        >
          Dial Supplier
        </p>
        
        {heartbeatSla ? (
          <p
            role="status"
            data-testid="supplier-heartbeat-health"
            style={{
              marginTop: 8,
              fontSize: 14,
              fontWeight: 600,
              color:
                heartbeatSla.health === "healthy"
                  ? dialTokens.color.brand.primary
                  : dialTokens.color.brand.ink,
            }}
          >
            Heartbeat: {heartbeatSla.health}
            {heartbeatSla.escalate ? " · escalate to ops" : ""}
          </p>
        ) : null}
        <nav style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
          <Link href="/home">Home</Link>
          <a href="#onboard">Onboarding</a>
          <a href="#costs">Costs</a>
          <a href="#heartbeat">Heartbeat</a>
          <a href="#sla">SLA escalations</a>
          <a href="#confirm">Confirm SLA</a>
          <a href="#coop">Co-op</a>
          <a href="#statements">Statements</a>
        </nav>
      </header>

      <section id="onboard" style={sectionStyle}>
        <h2 style={h2}>Onboarding · tier ladder</h2>
        {profile ? (
          <p>
            <strong>{profile.displayName}</strong> · tier{" "}
            <strong>{profile.tier}</strong> · {profile.formality} ·{" "}
            {profile.offerSource}
          </p>
        ) : (
          <p style={{ opacity: 0.75 }}>Not onboarded yet — pick a tier.</p>
        )}
        <form action="/api/supplier/portal" method="post" style={formRow}>
          <input type="hidden" name="action" value="onboard" />
          <input
            name="displayName"
            defaultValue={profile?.displayName ?? "My Agency Counter"}
            aria-label="Display name"
            style={inputStyle}
          />
          <select name="tier" defaultValue={profile?.tier ?? "bronze"} style={inputStyle}>
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
          <select name="formality" defaultValue={profile?.formality ?? "formal"} style={inputStyle}>
            <option value="formal">Formal</option>
            <option value="informal">Informal</option>
          </select>
          <button type="submit" style={btnPrimary}>
            Save onboarding
          </button>
        </form>
      </section>

      <section id="costs" style={sectionStyle}>
        <h2 style={h2}>Catalogue / costs upload</h2>
        <p style={{ fontSize: 13, opacity: 0.7 }}>
          Appendix A columns · costUsdMinor integer · currency USD
        </p>
        <form action="/api/supplier/portal" method="post" style={formCol}>
          <input type="hidden" name="action" value="upload_costs" />
          <input name="sku" placeholder="SKU" required style={inputStyle} />
          <input name="title" placeholder="Title" required style={inputStyle} />
          <input
            name="costUsdMinor"
            placeholder="Cost USD minor (e.g. 950)"
            required
            style={inputStyle}
          />
          <input name="qty" type="number" min={1} defaultValue={1} style={inputStyle} />
          <button type="submit" style={btnPrimary}>
            Upload cost row
          </button>
        </form>
        <ul style={{ paddingLeft: 18 }}>
          {uploads.map((b) => (
            <li key={b.batchId}>
              {b.batchId} · {b.rows.length} row(s) · {b.status} · {b.currency}
            </li>
          ))}
        </ul>
      </section>

      <section id="heartbeat" style={sectionStyle}>
        <h2 style={h2}>Heartbeat inbox</h2>
        <form action="/api/supplier/portal" method="post" style={formRow}>
          <input type="hidden" name="action" value="heartbeat" />
          <select name="channel" defaultValue="dashboard" style={inputStyle}>
            <option value="dashboard">Dashboard</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          <input name="note" placeholder="Stock note" style={inputStyle} />
          <button type="submit" style={btnAccent}>
            Send heartbeat
          </button>
        </form>
        <ul style={{ paddingLeft: 18 }}>
          {heartbeats.slice(0, 8).map((h) => (
            <li key={h.heartbeatId}>
              {h.createdAt} · {h.channel} · {h.note}
            </li>
          ))}
        </ul>
      </section>

      <section id="sla" style={sectionStyle} data-testid="supplier-sla-escalations">
        <h2 style={h2}>SLA escalations (ops)</h2>
        
        <form action="/api/supplier/portal" method="post" style={formRow}>
          <input type="hidden" name="action" value="sync_sla" />
          <button type="submit" style={btnPrimary}>
            Sync SLA now
          </button>
        </form>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {escalations.length === 0 ? (
            <li style={{ opacity: 0.65 }}>No open escalations</li>
          ) : (
            escalations.map((e) => (
              <li
                key={e.escalationId}
                style={{
                  padding: 12,
                  marginBottom: 8,
                  background: "#fff",
                  borderRadius: 8,
                }}
              >
                <strong>{e.kind}</strong> · {e.escalationId}
                {e.orderId ? ` · ${e.orderId}` : ""}
                <form
                  action="/api/supplier/portal"
                  method="post"
                  style={{ display: "inline", marginLeft: 12 }}
                >
                  <input type="hidden" name="action" value="ack_escalation" />
                  <input
                    type="hidden"
                    name="escalationId"
                    value={e.escalationId}
                  />
                  <button type="submit" style={btnAccent}>
                    Ack
                  </button>
                </form>
              </li>
            ))
          )}
        </ul>
      </section>

      <section id="confirm" style={sectionStyle}>
        <h2 style={h2}>Orders to confirm · SLA</h2>
        <form action="/api/supplier/portal" method="post" style={formRow}>
          <input type="hidden" name="action" value="enqueue_confirm" />
          <input
            name="amountUsdMinor"
            placeholder="Order USD minor"
            defaultValue="4500"
            style={inputStyle}
          />
          <button type="submit" style={btnPrimary}>
            Seed confirm job
          </button>
        </form>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {queue.map((o) => {
            const remaining = Math.max(0, o.slaDeadlineAt - Date.now());
            return (
              <li
                key={o.orderId}
                style={{
                  padding: 12,
                  marginBottom: 8,
                  background: "#fff",
                  borderRadius: 8,
                }}
              >
                <strong>{o.orderId}</strong> · {o.status} · USD{" "}
                {(Number(o.amountUsdMinor) / 100).toFixed(2)} · SLA{" "}
                {Math.ceil(remaining / 60000)}m
                {o.status === "awaiting_confirm" ? (
                  <form
                    action="/api/supplier/portal"
                    method="post"
                    style={{ display: "inline", marginLeft: 12 }}
                  >
                    <input type="hidden" name="action" value="confirm_order" />
                    <input type="hidden" name="orderId" value={o.orderId} />
                    <button type="submit" style={btnAccent}>
                      Confirm
                    </button>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section id="coop" data-testid="supplier-coop-panel" style={sectionStyle}>
        <h2 style={h2}>SUPPLIER_COOP / co-op spend</h2>
        
        {coopAgreements.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No co-op agreements for this supplier yet.</p>
        ) : (
          <ul style={{ paddingLeft: 18 }}>
            {coopAgreements.map((a) => (
              <li key={a.campaignId}>
                {a.campaignId} · {a.status} · fund{" "}
                {a.supplierFundShareBps}/{a.dialFundShareBps} bps · offers{" "}
                {a.offerIds.join(", ")}
              </li>
            ))}
          </ul>
        )}
        <h3 style={{ fontSize: "1rem", marginTop: 12 }}>Co-op spend lines</h3>
        <ul style={{ paddingLeft: 18 }} data-testid="coop-spend-lines">
          {coopSpendLines.length === 0 ? (
            <li>None yet</li>
          ) : (
            coopSpendLines.map((l) => (
              <li key={l.lineId}>
                USD {(Number(l.amount.amountMinor) / 100).toFixed(2)} · {l.label}
              </li>
            ))
          )}
        </ul>
      </section>

      <section id="statements" style={sectionStyle}>
        <h2 style={h2}>Statements / bonds</h2>
        <form action="/api/supplier/portal" method="post" style={formRow}>
          <input type="hidden" name="action" value="add_statement" />
          <select name="kind" defaultValue="settlement" style={inputStyle}>
            <option value="settlement">Settlement</option>
            <option value="bond">Bond</option>
            <option value="coop_spend">Co-op spend</option>
          </select>
          <input
            name="amountUsdMinor"
            placeholder="USD minor"
            defaultValue="500"
            style={inputStyle}
          />
          <input name="label" placeholder="Label" defaultValue="Line" style={inputStyle} />
          <button type="submit" style={btnPrimary}>
            Add line
          </button>
        </form>
        <ul style={{ paddingLeft: 18 }}>
          {statements.map((l) => (
            <li key={l.lineId}>
              {l.kind} · USD {(Number(l.amount.amountMinor) / 100).toFixed(2)} · {l.label}
            </li>
          ))}
        </ul>
      </section>

      
    </main>
  );
}

const sectionStyle = {
  maxWidth: 960,
  margin: "24px auto 0",
  padding: 16,
  background: "rgba(255,255,255,0.72)",
  borderRadius: 12,
} as const;

const h2 = {
  margin: "0 0 12px",
  fontSize: "1.15rem",
  color: dialTokens.color.brand.primary,
} as const;

const formRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  alignItems: "center",
} as const;

const formCol = {
  display: "grid",
  gap: 8,
  maxWidth: 420,
} as const;

const inputStyle = {
  padding: "8px 10px",
  borderRadius: 8,
  border: `1px solid ${dialTokens.color.brand.primary}44`,
  fontSize: 15,
} as const;

const btnPrimary = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  background: dialTokens.color.brand.primary,
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
} as const;

const btnAccent = {
  ...btnPrimary,
  background: dialTokens.color.brand.accent,
  color: dialTokens.color.brand.ink,
} as const;
