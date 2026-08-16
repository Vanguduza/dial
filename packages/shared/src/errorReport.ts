/**
 * No-op error reporter until DSN is set. Never prints secrets.
 */
export function reportError(
  err: unknown,
  fields: Record<string, unknown> = {},
): void {
  const dsn = process.env.DIAL_ERROR_DSN?.trim() || process.env.SENTRY_DSN?.trim();
  if (!dsn) return;
  const message = err instanceof Error ? err.message : String(err);
  console.error(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "error",
      message,
      ...fields,
    }),
  );
}
