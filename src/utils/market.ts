import type { GammaMarket } from "../types.js";

export const WINDOW_SECONDS = 15 * 60;

export function parseWindowStart(slug: string): number | null {
  const match = slug.match(/-(\d{10})$/);
  return match ? Number(match[1]) : null;
}

export function matchesSlugPrefixes(slug: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => slug.startsWith(prefix));
}

export function tickSizeFromMarket(market: GammaMarket): string {
  const tick = market.orderPriceMinTickSize ?? 0.01;
  if (tick >= 0.1) return "0.1";
  if (tick >= 0.01) return "0.01";
  return "0.001";
}

export function bestPrice(
  levels: Array<{ price: string }> | undefined,
  mode: "bid" | "ask",
): number | null {
  if (!levels || levels.length === 0) return null;
  const prices = levels
    .map((level) => Number(level.price))
    .filter((price) => !Number.isNaN(price));
  if (prices.length === 0) return null;
  return mode === "bid" ? Math.max(...prices) : Math.min(...prices);
}
