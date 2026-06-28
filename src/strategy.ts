import type { BotConfig } from "./config.js";
import type { TradeTracker } from "./trade-tracker.js";
import type { TradeOpportunity, TokenBook, UpDownEvent } from "./types.js";
import { tickSizeFromMarket } from "./utils/market.js";
import { computeSize, priceLevels } from "./utils/prices.js";

function pickReverseToken(books: TokenBook[]): TokenBook | null {
  const withAsk = books.filter((book) => book.bestAsk !== null);
  if (withAsk.length === 0) return null;

  return withAsk.reduce((cheapest, book) =>
    (book.bestAsk ?? 1) < (cheapest.bestAsk ?? 1) ? book : cheapest,
  );
}

function pickFavoriteToken(books: TokenBook[], reverseToken: TokenBook): TokenBook | null {
  return (
    books.find(
      (book) => book.tokenId !== reverseToken.tokenId && book.bestAsk !== null,
    ) ?? null
  );
}

function appendLimitOrders(
  tracker: TradeTracker,
  opportunities: TradeOpportunity[],
  event: UpDownEvent,
  token: TokenBook,
  kind: "cheap" | "expensive",
  prices: number[],
  usdcBudget: number,
  maxShares: number,
): void {
  for (const price of prices) {
    const tradeKey = tracker.makeKey(event.slug, token.outcome, kind, price);
    if (tracker.has(tradeKey)) continue;

    opportunities.push({
      kind,
      event,
      token,
      price,
      size: computeSize(usdcBudget, price, maxShares),
      tickSize: tickSizeFromMarket(event.market),
      negRisk: event.market.negRisk,
      tradeKey,
    });
  }
}

export function findOpportunities(
  config: BotConfig,
  tracker: TradeTracker,
  event: UpDownEvent,
  books: TokenBook[],
): TradeOpportunity[] {
  const opportunities: TradeOpportunity[] = [];
  const reverseToken = pickReverseToken(books);
  if (!reverseToken) return opportunities;

  appendLimitOrders(
    tracker,
    opportunities,
    event,
    reverseToken,
    "cheap",
    priceLevels(config.cheapBuyMin, config.cheapBuyMax),
    config.cheapOrderUsdc,
    config.maxSharesPerOrder,
  );

  if (config.enableExpensiveHedge) {
    const favoriteToken = pickFavoriteToken(books, reverseToken);
    if (favoriteToken) {
      appendLimitOrders(
        tracker,
        opportunities,
        event,
        favoriteToken,
        "expensive",
        priceLevels(config.expensiveBuyMin, config.expensiveBuyMax),
        config.expensiveOrderUsdc,
        config.maxSharesPerOrder,
      );
    }
  }

  return opportunities;
}
