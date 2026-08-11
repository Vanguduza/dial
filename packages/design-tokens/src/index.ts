import tokensJson from "../tokens/tokens.json" with { type: "json" };

export type DialTokens = typeof tokensJson;
export const dialTokens: DialTokens = tokensJson;

export function cssVariables(t: DialTokens = dialTokens): Record<string, string> {
  return {
    "--dial-color-brand-primary": t.color.brand.primary,
    "--dial-color-brand-accent": t.color.brand.accent,
    "--dial-color-brand-surface": t.color.brand.surface,
    "--dial-color-brand-ink": t.color.brand.ink,
    "--dial-font-display": t.font.display,
    "--dial-font-body": t.font.body,
  };
}
