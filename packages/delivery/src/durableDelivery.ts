/**
 * Durable delivery_jobs / delivery_offers / courier_locations (G5 sandbox).
 * Fixture: no-op. Sandbox/live: Supabase REST — fail closed without URL/key.
 */
import { integrationMode } from "@dial/shared/processed-events";

type DurableJob = {
  id: string;
  orderId: string;
  status: string;
  assignedCourierId?: string;
  distanceMeters?: number;
  etaMinutes?: number;
};

type DurableOffer = {
  id: string;
  jobId: string;
  courierId: string;
  status: string;
};

function supabaseRestConfig(env: NodeJS.ProcessEnv = process.env): {
  url: string;
  key: string;
} {
  const url = (
    env.SUPABASE_URL?.trim() ||
    env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    ""
  ).replace(/\/$/, "");
  const key =
    env.SUPABASE_SERVICE_ROLE_KEY?.trim() || env.SUPABASE_ANON_KEY?.trim() || "";
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / key unset — fail closed for durable delivery",
    );
  }
  return { url, key };
}

async function restUpsert(
  table: string,
  row: Record<string, unknown>,
  onConflict: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  const { url, key } = supabaseRestConfig(env);
  const res = await fetch(
    `${url}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(row),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${table} upsert HTTP ${res.status}: ${text.slice(0, 240)}`);
  }
}

export async function persistDeliveryJobDurable(
  job: DurableJob,
  env: NodeJS.ProcessEnv = process.env,
): Promise<"accepted" | "fixture_skip"> {
  if (integrationMode(env) === "fixture") return "fixture_skip";
  await restUpsert(
    "delivery_jobs",
    {
      job_id: job.id,
      order_id: job.orderId,
      status: job.status,
      assigned_courier_id: job.assignedCourierId ?? null,
      distance_meters: job.distanceMeters ?? null,
      eta_minutes: job.etaMinutes ?? null,
    },
    "job_id",
    env,
  );
  return "accepted";
}

export async function persistDeliveryOfferDurable(
  offer: DurableOffer,
  env: NodeJS.ProcessEnv = process.env,
): Promise<"accepted" | "fixture_skip"> {
  if (integrationMode(env) === "fixture") return "fixture_skip";
  await restUpsert(
    "delivery_offers",
    {
      offer_id: offer.id,
      job_id: offer.jobId,
      courier_id: offer.courierId,
      status: offer.status,
    },
    "offer_id",
    env,
  );
  return "accepted";
}

export async function persistCourierLocationDurable(
  input: {
    locationId: string;
    courierId: string;
    jobId?: string;
    lat: number;
    lng: number;
  },
  env: NodeJS.ProcessEnv = process.env,
): Promise<"accepted" | "fixture_skip"> {
  if (integrationMode(env) === "fixture") return "fixture_skip";
  await restUpsert(
    "courier_locations",
    {
      location_id: input.locationId,
      courier_id: input.courierId,
      job_id: input.jobId ?? null,
      lat: input.lat,
      lng: input.lng,
    },
    "location_id",
    env,
  );
  return "accepted";
}

export async function fetchDeliveryJobDurable(
  jobId: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<{
  job_id: string;
  order_id: string;
  status: string;
  assigned_courier_id: string | null;
} | null> {
  if (integrationMode(env) === "fixture") return null;
  const { url, key } = supabaseRestConfig(env);
  const res = await fetch(
    `${url}/rest/v1/delivery_jobs?job_id=eq.${encodeURIComponent(jobId)}&select=job_id,order_id,status,assigned_courier_id&limit=1`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    },
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{
    job_id: string;
    order_id: string;
    status: string;
    assigned_courier_id: string | null;
  }>;
  return rows[0] ?? null;
}

/** Fire-and-forget durable sync — never blocks in-process SoR. */
export function syncDeliveryJobDurable(job: DurableJob): void {
  void persistDeliveryJobDurable(job).catch(() => undefined);
}

export function syncDeliveryOfferDurable(offer: DurableOffer): void {
  void persistDeliveryOfferDurable(offer).catch(() => undefined);
}
