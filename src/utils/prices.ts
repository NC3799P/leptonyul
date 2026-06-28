export function priceLevels(min: number, max: number, step = 0.01): number[] {
  const prices: number[] = [];
  for (let price = min; price <= max + step / 2; price += step) {
    prices.push(Math.round(price * 100) / 100);
  }
  return prices;
}

export function computeSize(usdcBudget: number, price: number, maxShares: number): number {
  const shares = usdcBudget / Math.max(price, 0.01);
  const capped = Math.min(shares, maxShares);
  return Math.max(1, Math.floor(capped * 100) / 100);
}

export function formatReturnPct(price: number): string {
  return `${Math.round((1 / price - 1) * 100)}% if wins`;
}
