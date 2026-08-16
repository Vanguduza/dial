import Link from "next/link";
import { draftTechQuote, listBookingSlots } from "../../../lib/tech/stubs";
import { TechBookForm } from "./TechBookForm";
import { TechProfileCards } from "./TechProfileCards";

/** PD9 — Cal.com slots + rate_card quote. FixItNow-patterned book surface. */
export default async function TechBookPage() {
  const slots = await listBookingSlots();
  const quote = draftTechQuote({ jobClass: "diagnostics", emergency: false });
  return (
    <div className="fin-page">
      <div className="fin-container">
        <nav className="fin-page__crumb" aria-label="Breadcrumb">
          <Link href="/tech">Home</Link>
          <span aria-hidden="true">·</span>
          <Link href="/tech/jobs">My jobs</Link>
        </nav>
        <h1>Book a technician</h1>
        <p className="fin-page__meta">
          Job class <strong>{quote.jobClassId}</strong>
          {" · "}
          Draft USD {(Number(quote.draftAmountUsdMinor) / 100).toFixed(2)}
          {" · "}
          source rate_card
        </p>
        <TechProfileCards />
        <h2 style={{ fontSize: "1.15rem", margin: "1.5rem 0 0.75rem" }}>
          Available slots
        </h2>
        <ul className="fin-slot-list">
          {slots.map((s) => (
            <li key={s.slotId}>
              <code>{s.slotId}</code>
              <br />
              {new Date(s.startAt).toLocaleString()} →{" "}
              {new Date(s.endAt).toLocaleString()}
            </li>
          ))}
        </ul>
        <div className="fin-panel">
          <TechBookForm
            slots={slots.map((s) => ({ slotId: s.slotId, label: s.startAt }))}
          />
        </div>
      </div>
    </div>
  );
}
