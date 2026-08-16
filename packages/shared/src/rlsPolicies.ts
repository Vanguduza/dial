/**
 * Phase 1 / G1 — Pack §12 RLS policy evaluators (CI-safe mirror of SQL migrations).
 * Mirrors supabase/migrations/0003_phase1_priority_tables_rls.sql.
 * Never trust body userId (D-47). JWT/session context only.
 */

export type RlsRole = "customer" | "technician" | "supplier" | "admin" | "courier";

export type RlsActor = {
  userId: string;
  role: RlsRole;
};

export type PriorityResourceKind =
  | "orders"
  | "vehicles"
  | "promo_credits"
  | "delivery_jobs"
  | "delivery_offers"
  | "courier_locations"
  | "job_reserves";

export type PriorityResourceRow = {
  kind: PriorityResourceKind;
  customerId?: string;
  userId?: string;
  assignedCourierId?: string;
  courierId?: string;
};

function assertNoBodyUserId(bodyUserId?: string): void {
  if (bodyUserId !== undefined) {
    throw new Error("Refuse body userId for RLS (D-47)");
  }
}

function isAdmin(actor: RlsActor): boolean {
  return actor.role === "admin";
}

/** SELECT allow under Pack §12 for a single row (JWT role). */
export function rlsAllowsSelect(
  actor: RlsActor,
  row: PriorityResourceRow,
  opts?: { bodyUserId?: string },
): boolean {
  assertNoBodyUserId(opts?.bodyUserId);
  if (isAdmin(actor)) return true;
  switch (row.kind) {
    case "orders":
      return actor.userId === row.customerId;
    case "vehicles":
    case "promo_credits":
      return actor.userId === row.userId;
    case "delivery_jobs":
      return (
        actor.userId === row.customerId ||
        actor.userId === row.assignedCourierId
      );
    case "delivery_offers":
    case "courier_locations":
      return actor.userId === row.courierId;
    case "job_reserves":
      return false;
    default:
      return false;
  }
}

export function assertRlsSelect(
  actor: RlsActor,
  row: PriorityResourceRow,
  opts?: { bodyUserId?: string },
): void {
  if (!rlsAllowsSelect(actor, row, opts)) {
    throw new Error(`RLS deny: ${row.kind} select`);
  }
}

export const G1_PRIORITY_RESOURCE_KINDS: PriorityResourceKind[] = [
  "orders",
  "vehicles",
  "promo_credits",
  "delivery_jobs",
  "delivery_offers",
  "courier_locations",
  "job_reserves",
];

/**
 * Cross-tenant deny matrix for G1 exit evidence (CI).
 */
export function runG1CrossTenantRlsDenyMatrix(): {
  kindsDenied: PriorityResourceKind[];
  bodyUserIdRefused: true;
  payableFromAi: false;
} {
  const owner: RlsActor = { userId: "usr_owner", role: "customer" };
  const attacker: RlsActor = { userId: "usr_attacker", role: "customer" };
  const courier: RlsActor = { userId: "usr_courier", role: "courier" };
  const admin: RlsActor = { userId: "usr_admin", role: "admin" };

  const rows: PriorityResourceRow[] = [
    { kind: "orders", customerId: owner.userId },
    { kind: "vehicles", userId: owner.userId },
    { kind: "promo_credits", userId: owner.userId },
    {
      kind: "delivery_jobs",
      customerId: owner.userId,
      assignedCourierId: courier.userId,
    },
    { kind: "delivery_offers", courierId: courier.userId },
    { kind: "courier_locations", courierId: courier.userId },
    { kind: "job_reserves", customerId: owner.userId },
  ];

  const kindsDenied: PriorityResourceKind[] = [];
  for (const row of rows) {
    if (rlsAllowsSelect(attacker, row)) {
      throw new Error(`G1 expected cross-tenant deny for ${row.kind}`);
    }
    if (row.kind === "job_reserves") {
      if (rlsAllowsSelect(owner, row)) {
        throw new Error("G1 job_reserves must deny non-admin");
      }
      assertRlsSelect(admin, row);
    } else if (
      row.kind === "delivery_offers" ||
      row.kind === "courier_locations"
    ) {
      assertRlsSelect(courier, row);
    } else {
      assertRlsSelect(owner, row);
    }
    kindsDenied.push(row.kind);
  }

  try {
    assertRlsSelect(attacker, rows[0]!, { bodyUserId: "attacker" });
    throw new Error("expected body userId refuse");
  } catch (e) {
    if (!(e instanceof Error) || !/body userId/i.test(e.message)) throw e;
  }

  if (kindsDenied.length < 5) {
    throw new Error("G1 requires ≥5 priority resources in RLS matrix");
  }
  return { kindsDenied, bodyUserIdRefused: true, payableFromAi: false };
}
