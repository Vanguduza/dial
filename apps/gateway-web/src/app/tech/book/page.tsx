import Link from "next/link";
import { dialTokens } from "@dial/design-tokens";
import { draftTechQuote, listBookingSlots } from "../../../lib/tech/stubs";
import { TechBookForm } from "./TechBookForm";
import { TechProfileCards } from "./TechProfileCards";

/** PD9 — Cal.com slots + rate_card quote (not rate_card_stub). PD106 profile cards. */
export default async function TechBookPage() {
  const slots = await listBookingSlots();
  const quote = draftTechQuote({ jobClass: "diagnostics", emergency: false });
  return (
    <main
      style={{
        minHeight: "100vh",
        background: dialTokens.color.brand.surface,
        color: dialTokens.color.brand.ink,
        fontFamily: `${dialTokens.font.body}, system-ui, sans-serif`,
        padding: dialTokens.space.md,
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <Link href="/tech">Back</Link>
        {" · "}
        <Link href="/tech/jobs">My jobs</Link>
        <h1
          style={{
            fontFamily: `${dialTokens.font.display}, Georgia, serif`,
            color: dialTokens.color.brand.primary,
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
          }}
        >
          Book a tech
        </h1>
        <p>
          Job class: <strong>{quote.jobClassId}</strong>
        </p>
        <p>
          Draft USD {(Number(quote.draftAmountUsdMinor) / 100).toFixed(2)}
        </p>
        <TechProfileCards />
        <h2 style={{ fontSize: "1.1rem", marginTop: dialTokens.space.lg }}>Available slots</h2>
        <ul style={{ paddingLeft: 18 }}>
          {slots.map((s) => (
            <li key={s.slotId} style={{ marginBottom: 8 }}>
              <code>{s.slotId}</code>
              <br />
              <span style={{ fontSize: 13 }}>
                {new Date(s.startAt).toLocaleString()} → {new Date(s.endAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
        <TechBookForm slots={slots.map((s) => ({ slotId: s.slotId, label: s.startAt }))} />
      </div>
    </main>
  );
}
