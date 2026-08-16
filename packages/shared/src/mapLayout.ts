/**
 * GTR blank-map prevention rules, shared with native MapLibre.
 * Never setStyle at 0×0; loopback style URLs fall back to OpenFreeMap Liberty.
 */
export const OPENFREEMAP_LIBERTY =
  "https://tiles.openfreemap.org/styles/liberty";

export function shouldWaitForMapLayout(input: {
  width: number;
  height: number;
  attempt: number;
  maxAttempts?: number;
}): boolean {
  const max = input.maxAttempts ?? 24;
  if (input.attempt >= max) return false;
  return input.width <= 0 || input.height <= 0;
}

export function shouldCommitStyleCallback(styleLoaded: boolean): boolean {
  return styleLoaded;
}

export function resumeShouldReloadStyle(styleIsNull: boolean): boolean {
  return styleIsNull;
}

export function stallRetryMs(): number {
  return 2500;
}

export function resumeGlRebindDelayMs(): number {
  return 120;
}

export function resolveStyleUrl(url: string | undefined): string {
  const value = url?.trim() ?? "";
  if (!value) return OPENFREEMAP_LIBERTY;
  try {
    const parsed = new URL(value);
    const host = parsed.hostname;
    const loopback =
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1";
    const rfc1918 =
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
    if (loopback || rfc1918) return OPENFREEMAP_LIBERTY;
  } catch {
    return OPENFREEMAP_LIBERTY;
  }
  return value;
}
