/**
 * Supabase Auth client scaffold (Pack §6.1 / T1 expand).
 * Fixture mode keeps cookie session SoR; sandbox/live uses env URLs (fail closed).
 * Never put SUPABASE_SERVICE_ROLE_KEY behind NEXT_PUBLIC_.
 */
export type IntegrationMode = "fixture" | "sandbox" | "live";

export function integrationMode(
  env: NodeJS.ProcessEnv = process.env,
): IntegrationMode {
  const m = (env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (m === "sandbox" || m === "live") return m;
  return "fixture";
}

export type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

export type SupabaseServerConfig = SupabasePublicConfig & {
  serviceRoleKey: string;
};

/** Browser-safe config — anon key only. */
export function getSupabasePublicConfig(
  env: NodeJS.ProcessEnv = process.env,
): SupabasePublicConfig {
  if (integrationMode(env) === "fixture") {
    return {
      url: env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "http://127.0.0.1:54321",
      anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || "fixture_anon",
    };
  }
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY unset — fail closed",
    );
  }
  return { url, anonKey };
}

/** Server-only — service role never exported to client bundles. */
export function getSupabaseServerConfig(
  env: NodeJS.ProcessEnv = process.env,
): SupabaseServerConfig {
  const pub = getSupabasePublicConfig(env);
  if (integrationMode(env) === "fixture") {
    return {
      ...pub,
      serviceRoleKey:
        env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "fixture_service_role",
    };
  }
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY unset — fail closed");
  }
  if (
    env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    env.VITE_SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error("service_role must never be NEXT_PUBLIC_/VITE_ (D-47)");
  }
  return { ...pub, serviceRoleKey };
}

/**
 * Exchange email/password for a session token shape.
 * Fixture: deterministic local token. Live: POST /auth/v1/token (GoTrue).
 */
export async function signInWithPassword(input: {
  email: string;
  password: string;
}): Promise<{ accessToken: string; userId: string; email: string }> {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password) throw new Error("email and password required");

  if (integrationMode() === "fixture") {
    return {
      accessToken: `sb_fx_${Buffer.from(email).toString("base64url").slice(0, 24)}`,
      userId: `usr_${Buffer.from(email).toString("base64url").slice(0, 16)}`,
      email,
    };
  }

  const { url, anonKey } = getSupabasePublicConfig();
  const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password: input.password }),
  });
  if (!res.ok) throw new Error(`Supabase sign-in HTTP ${res.status}`);
  const data = (await res.json()) as {
    access_token?: string;
    user?: { id?: string; email?: string };
  };
  if (!data.access_token || !data.user?.id) {
    throw new Error("Supabase sign-in missing token");
  }
  return {
    accessToken: data.access_token,
    userId: data.user.id,
    email: data.user.email ?? email,
  };
}
