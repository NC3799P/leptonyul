export class TradeTracker {
  constructor(private readonly keys = new Set<string>()) {}

  makeKey(
    eventSlug: string,
    outcome: string,
    kind: "cheap" | "expensive",
    price: number,
  ): string {
    return `${eventSlug}:${outcome}:${kind}-${price}`;
  }

  has(key: string): boolean {
    return this.keys.has(key);
  }

  mark(key: string): void {
    this.keys.add(key);
  }
}
