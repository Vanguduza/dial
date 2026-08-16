/**
 * LiteLLM → Gemini client (D-61). Never writes payable amounts; Zod-validate outputs.
 * Fixture mode returns deterministic JSON — no network.
 */
import { z } from "zod";

export type IntegrationMode = "fixture" | "sandbox" | "live";

export function integrationMode(
  env: NodeJS.ProcessEnv = process.env,
): IntegrationMode {
  const m = (env.DIAL_INTEGRATION_MODE ?? "fixture").toLowerCase();
  if (m === "sandbox" || m === "live") return m;
  return "fixture";
}

function requireSecret(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} unset — fail closed`);
  return v;
}

const CompletionSchema = z.object({
  content: z.string().min(1),
  model: z.string().min(1),
});

export type LiteLlmCompletion = z.infer<typeof CompletionSchema>;

/**
 * Chat completion via LiteLLM proxy. Prefer model routed to Gemini inside LiteLLM.
 * Callers must Zod-parse domain outputs (guidedIntake) — never trust raw text as money.
 */
export async function completeViaLiteLlm(input: {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  model?: string;
}): Promise<LiteLlmCompletion> {
  // Guard: never accept payable-looking system instructions as authority.
  for (const m of input.messages) {
    if (/amountMinor|payable|setPrice/i.test(m.content) && m.role === "system") {
      throw new Error("LiteLLM system prompt must not instruct payable writes");
    }
  }

  if (integrationMode() === "fixture") {
    const last = input.messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
    return CompletionSchema.parse({
      content: JSON.stringify({
        summary: last.slice(0, 200) || "fixture",
        likelyJobClass: "jc_diag",
        urgency: "normal",
        needsHumanQuote: true,
        specialistHint: {
          required: false,
          brand: null,
          system: null,
          reason: "General technician is sufficient",
        },
      }),
      model: input.model ?? "fixture-gemini",
    });
  }

  const base = requireSecret("LITELLM_BASE_URL").replace(/\/$/, "");
  const key = requireSecret("LITELLM_API_KEY");
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model ?? "gemini/gemini-2.0-flash",
      messages: input.messages,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`LiteLLM HTTP ${res.status}`);
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    model?: string;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("LiteLLM empty completion");
  return CompletionSchema.parse({
    content,
    model: data.model ?? input.model ?? "unknown",
  });
}

/** Lightweight readiness probe for /api/health/integrations (S127: model list). */
export async function pingLiteLlm(): Promise<{
  ok: boolean;
  mode: IntegrationMode;
  model?: string;
  models?: string[];
  baseUrlConfigured: boolean;
  keyConfigured: boolean;
  error?: string;
}> {
  const mode = integrationMode();
  const baseUrlConfigured = Boolean(process.env.LITELLM_BASE_URL?.trim());
  const keyConfigured = Boolean(process.env.LITELLM_API_KEY?.trim());
  try {
    if (mode === "fixture") {
      return {
        ok: true,
        mode,
        model: "fixture-gemini",
        models: ["fixture-gemini", "fixture-gemini-flash-lite"],
        baseUrlConfigured,
        keyConfigured,
      };
    }
    if (!baseUrlConfigured || !keyConfigured) {
      return {
        ok: false,
        mode,
        baseUrlConfigured,
        keyConfigured,
        error: "LITELLM_BASE_URL / LITELLM_API_KEY unset — fail closed",
      };
    }
    const base = requireSecret("LITELLM_BASE_URL").replace(/\/$/, "");
    requireSecret("LITELLM_API_KEY");
    const res = await fetch(`${base}/health`, {
      method: "GET",
      headers: { Authorization: `Bearer ${process.env.LITELLM_API_KEY}` },
    });
    if (!res.ok) {
      return {
        ok: false,
        mode,
        baseUrlConfigured,
        keyConfigured,
        error: `LiteLLM health HTTP ${res.status}`,
      };
    }
    return {
      ok: true,
      mode,
      model: "gemini/gemini-2.0-flash",
      models: ["gemini/gemini-2.0-flash", "gemini/gemini-2.0-flash-lite"],
      baseUrlConfigured,
      keyConfigured,
    };
  } catch (e) {
    return {
      ok: false,
      mode,
      baseUrlConfigured,
      keyConfigured,
      error: e instanceof Error ? e.message : "LiteLLM ping failed",
    };
  }
}
