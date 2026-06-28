import type { BotConfig } from "./config.js";
import type { GammaMarket, OrderBook, TokenBook, UpDownEvent } from "./types.js";
import {
  bestPrice,
  matchesSlugPrefixes,
  parseWindowStart,
  WINDOW_SECONDS,
} from "./utils/market.js";

function parseJsonArray<T>(value: string): T[] {
  return JSON.parse(value) as T[];
}

export class MarketScanner {
  constructor(private readonly config: BotConfig) {}

  async scan(): Promise<UpDownEvent[]> {
    const url = new URL("/events", this.config.gammaApiHost);
    url.searchParams.set("tag_slug", "15M");
    url.searchParams.set("active", "true");
    url.searchParams.set("closed", "false");
    url.searchParams.set("limit", "50");

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Gamma events API error: ${response.status}`);
    }

    const events = (await response.json()) as Array<{
      title: string;
      slug: string;
      markets: GammaMarket[];
    }>;

    const now = Math.floor(Date.now() / 1000);
    const results: UpDownEvent[] = [];

    for (const event of events) {
      if (!matchesSlugPrefixes(event.slug, this.config.marketSlugPrefixes)) continue;

      const market = event.markets[0];
      if (!market || market.closed || market.active === false) continue;

      const windowStart = parseWindowStart(event.slug);
      if (!windowStart) continue;

      const windowEnd = windowStart + WINDOW_SECONDS;
      if (now < windowStart || now > windowEnd) continue;

      const minutesLeft = (windowEnd - now) / 60;
      if (
        minutesLeft < this.config.minutesBeforeCloseMin ||
        minutesLeft > this.config.minutesBeforeCloseMax
      ) {
        continue;
      }

      results.push({
        title: event.title,
        slug: event.slug,
        market,
        windowStart,
        windowEnd,
      });
    }

    return results;
  }

  async getTokenBooks(event: UpDownEvent): Promise<TokenBook[]> {
    const tokenIds = parseJsonArray<string>(event.market.clobTokenIds);
    const outcomes = parseJsonArray<string>(event.market.outcomes);

    const books = await Promise.all(
      tokenIds.map(async (tokenId, index) => {
        if (!tokenId) return null;

        const book = await fetchOrderBook(this.config.clobHost, tokenId);
        return {
          tokenId,
          outcome: outcomes[index] ?? `Outcome ${index}`,
          outcomeIndex: index,
          bestBid: bestPrice(book.bids, "bid"),
          bestAsk: bestPrice(book.asks, "ask"),
        } satisfies TokenBook;
      }),
    );

    return books.filter((book): book is TokenBook => book !== null);
  }
}

async function fetchOrderBook(clobHost: string, tokenId: string): Promise<OrderBook> {
  const url = new URL("/book", clobHost);
  url.searchParams.set("token_id", tokenId);

  const response = await fetch(url);
  if (!response.ok) {
    return {};
  }

  return (await response.json()) as OrderBook;
}
