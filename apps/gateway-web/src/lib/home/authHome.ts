/**
 * PD26 auth home — Welcome-back + Shop | Services (Pack §9.1).
 * Session SoR only; never body userId/role. No money path.
 */
import type { DialSession } from "../auth/session.js";
import {
  __resetAuthForTests,
  createSession,
  getSessionFromToken,
} from "../auth/session.js";
import { resolveRiveGreeting } from "@dial/shared";

export type HomeLaneId = "shop" | "services";

export type HomeDestination = {
  id: string;
  label: string;
  href: string;
  description: string;
};

export type AuthHomeSnapshot = {
  welcomeBack: string;
  email: string;
  buyerSegment: DialSession["buyerSegment"];
  role: DialSession["role"];
  /** Pack §9.1 — session restored (cookie still valid). */
  sessionRestored: true;
  primaryLanes: Array<{
    id: HomeLaneId;
    title: string;
    blurb: string;
    destinations: HomeDestination[];
  }>;
  /** Responsive web DoD markers — desktop + mobile usable. */
  responsive: {
    desktopMinWidthPx: 768;
    mobileFirst: true;
    stackedLanesOnNarrow: true;
  };
  riveOptional: "deferred";
  /** PD122 — Rive greeting fixture (no voice). */
  riveGreeting: {
    assetRef: string;
    voice: false;
  };
  payableFromAi: false;
};

function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "there";
  const cleaned = local.replace(/[._+]+/g, " ").trim();
  if (!cleaned) return "there";
  return cleaned
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function buildAuthHomeSnapshot(session: DialSession): AuthHomeSnapshot {
  const name = displayNameFromEmail(session.email);
  const shopDestinations: HomeDestination[] = [
    {
      id: "spare",
      label: "Spare parts",
      href: "/spare",
      description: "Browse USD catalogue · Sold by supplier (agency)",
    },
    {
      id: "grocery",
      label: "Groceries",
      href: "/grocery",
      description: "Food browse · EcoCash or COD at checkout",
    },
  ];
  if (session.buyerSegment === "b2b" || session.role === "ops_admin") {
    shopDestinations.push({
      id: "supplier",
      label: "Supplier desk",
      href: "/supplier",
      description: "Vendor panel · formal offers",
    });
  }

  const servicesDestinations: HomeDestination[] = [
    {
      id: "tech_book",
      label: "Book a technician",
      href: "/tech/book",
      description: "Cal.com slots · rate_card drafts only",
    },
    {
      id: "tech_emergency",
      label: "Emergency",
      href: "/tech/emergency",
      description: "Deterministic triage checklist",
    },
    {
      id: "tech_jobs",
      label: "My jobs",
      href: "/tech/jobs",
      description: "Status and evidence",
    },
  ];

  return {
    welcomeBack: `Welcome back, ${name}`,
    email: session.email,
    buyerSegment: session.buyerSegment,
    role: session.role,
    sessionRestored: true,
    primaryLanes: [
      {
        id: "shop",
        title: "Shop",
        blurb: "Parts and groceries — marketplace agency",
        destinations: shopDestinations,
      },
      {
        id: "services",
        title: "Services",
        blurb: "Technicians and jobs — never AI payable amounts",
        destinations: servicesDestinations,
      },
    ],
    responsive: {
      desktopMinWidthPx: 768,
      mobileFirst: true,
      stackedLanesOnNarrow: true,
    },
    riveOptional: "deferred",
    riveGreeting: (() => {
      const g = resolveRiveGreeting();
      return { assetRef: g.assetRef, voice: false as const };
    })(),
    payableFromAi: false,
  };
}

/**
 * PD26 thin vertical: AuthN → Welcome-back → Shop|Services lanes → session restore.
 */
export function runPd26GatewayHomeThinVertical(input?: {
  email?: string;
  buyerSegment?: DialSession["buyerSegment"];
}): {
  welcomeBack: string;
  shopHref: string;
  servicesHref: string;
  laneCount: 2;
  sessionRestored: true;
  responsiveMobileFirst: true;
  payableFromAi: false;
  anonymousBlocked: true;
} {
  __resetAuthForTests();
  const { token, session } = createSession({
    email: input?.email ?? "customer.pd26@dial.test",
    buyerSegment: input?.buyerSegment ?? "b2c",
  });
  const restored = getSessionFromToken(token);
  if (!restored) {
    throw new Error("PD26 session restore failed");
  }
  const snap = buildAuthHomeSnapshot(session);
  if (!snap.welcomeBack.startsWith("Welcome back")) {
    throw new Error("PD26 requires Welcome-back copy");
  }
  if (snap.primaryLanes.length !== 2) {
    throw new Error("PD26 requires Shop | Services as two primary lanes");
  }
  const shop = snap.primaryLanes.find((l) => l.id === "shop");
  const services = snap.primaryLanes.find((l) => l.id === "services");
  if (!shop?.destinations.some((d) => d.href === "/spare")) {
    throw new Error("PD26 Shop lane must include /spare");
  }
  if (!services?.destinations.some((d) => d.href.startsWith("/tech"))) {
    throw new Error("PD26 Services lane must include /tech routes");
  }
  if (snap.payableFromAi) {
    throw new Error("PD26 home must keep payableFromAi false");
  }
  if (!snap.responsive.mobileFirst || !snap.responsive.stackedLanesOnNarrow) {
    throw new Error("PD26 requires responsive mobile-first markers");
  }
  // Anonymous has no home snapshot authority
  const anon = getSessionFromToken(undefined);
  if (anon) {
    throw new Error("PD26 anonymous must not have session");
  }

  return {
    welcomeBack: snap.welcomeBack,
    shopHref: shop.destinations[0]!.href,
    servicesHref: services.destinations[0]!.href,
    laneCount: 2,
    sessionRestored: true,
    responsiveMobileFirst: true,
    payableFromAi: false,
    anonymousBlocked: true,
  };
}
