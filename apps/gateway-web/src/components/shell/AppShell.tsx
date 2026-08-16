/**
 * Shared customer chrome: sticky header with search, section tabs, mobile
 * bottom nav and footer. Blueprint §8.0.1 — one responsive shell for every
 * customer surface instead of per-page nav.
 */
import Link from "next/link";
import type { ReactNode } from "react";

export type ShellSection = "home" | "spare" | "grocery" | "tech" | "account";

type Tab = { href: string; label: string };

const TABS: Record<ShellSection, Tab[]> = {
  home: [],
  spare: [
    { href: "/spare", label: "Browse" },
    { href: "/spare/entry", label: "Select vehicle" },
    { href: "/spare/garage", label: "Garage" },
    { href: "/spare/orders", label: "Orders" },
    { href: "/spare/returns", label: "Returns" },
  ],
  grocery: [
    { href: "/grocery", label: "Browse" },
    { href: "/grocery/search", label: "Search" },
    { href: "/grocery/collections", label: "Collections" },
    { href: "/grocery/slot", label: "Delivery slot" },
    { href: "/grocery/track", label: "Track" },
  ],
  tech: [
    { href: "/tech", label: "Services" },
    { href: "/tech/guide", label: "Diagnose" },
    { href: "/tech/book", label: "Book" },
    { href: "/tech/emergency", label: "Emergency" },
    { href: "/tech/jobs", label: "My jobs" },
  ],
  account: [
    { href: "/account/profile", label: "Profile" },
    { href: "/account/addresses", label: "Addresses" },
    { href: "/account/notifications", label: "Notifications" },
    { href: "/account/consent", label: "Consent" },
    { href: "/account/promo", label: "Promo credit" },
  ],
};

const BOTTOM: Array<{ href: string; label: string; section: ShellSection }> = [
  { href: "/home", label: "Home", section: "home" },
  { href: "/spare", label: "Spares", section: "spare" },
  { href: "/grocery", label: "Grocery", section: "grocery" },
  { href: "/tech", label: "Services", section: "tech" },
];

export function AppShell({
  section,
  activeHref,
  cartHref,
  search,
  children,
}: {
  section: ShellSection;
  activeHref?: string;
  cartHref?: string;
  search?: ReactNode;
  children: ReactNode;
}) {
  const tabs = TABS[section];

  return (
    <div className="dial-shell">
      <header className="dial-header">
        <div className="dial-container dial-header__row">
          <Link href="/home" className="dial-header__brand">
            DIAL<span>.</span>
          </Link>
          {search ? <div className="dial-header__search">{search}</div> : null}
          <div className="dial-header__actions">
            {cartHref ? (
              <Link href={cartHref} className="dial-tab">
                Cart
              </Link>
            ) : null}
            <Link href="/account/profile" className="dial-tab">
              Account
            </Link>
          </div>
        </div>
        {tabs.length > 0 ? (
          <div className="dial-container">
            <nav aria-label={`${section} sections`} className="dial-tabs">
              {tabs.map((t) => (
                <Link
                  key={t.href}
                  href={t.href}
                  className="dial-tab"
                  aria-current={t.href === activeHref ? "page" : undefined}
                >
                  {t.label}
                </Link>
              ))}
            </nav>
          </div>
        ) : null}
      </header>

      <main className="dial-shell__body">{children}</main>

      <footer className="dial-footer">
        <div className="dial-container">
          DIAL acts as agent for listed suppliers. Prices shown in USD; ZiG is
          converted at checkout using the published daily rate.
        </div>
      </footer>

      <nav className="dial-bottom-nav" aria-label="Primary">
        {BOTTOM.map((b) => (
          <Link
            key={b.href}
            href={b.href}
            aria-current={b.section === section ? "page" : undefined}
          >
            {b.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
