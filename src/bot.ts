import type { BotConfig } from "./config.js";
import { log } from "./logger.js";
import { MarketScanner } from "./market-scanner.js";
import { findOpportunities } from "./strategy.js";
import { TradeTracker } from "./trade-tracker.js";
import { Trader } from "./trader.js";
import type { TradeOpportunity, UpDownEvent } from "./types.js";
import { formatReturnPct } from "./utils/prices.js";
export class ReverseBot {
  private readonly scanner: MarketScanner;
  private readonly tracker = new TradeTracker();

  constructor(
    private readonly config: BotConfig,
    private readonly trader: Trader,
  ) {
    this.scanner = new MarketScanner(config);
  }

  async init(): Promise<void> {
    await this.trader.init();
  }

  async run(): Promise<void> {
    log("Reverse bot starting", {
      strategy: "buy cheap reversal tokens on 15m BTC/ETH markets",
      cheapRange: `${this.config.cheapBuyMin}-${this.config.cheapBuyMax}`,
      expensiveHedge: this.config.enableExpensiveHedge
        ? `${this.config.expensiveBuyMin}-${this.config.expensiveBuyMax}`
        : "disabled",
      markets: this.config.marketSlugPrefixes,
      dryRun: this.config.dryRun,
      pollMs: this.config.pollIntervalMs,
    });

    await this.tick();
    setInterval(() => void this.tick(), this.config.pollIntervalMs);
  }

  private async tick(): Promise<void> {
    try {
      const events = await this.scanner.scan();
      if (events.length === 0) {
        log("No active markets in window");
        return;
      }

      for (const event of events) {
        await this.processEvent(event);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log("Scan error", { error: message });
    }
  }

  private async processEvent(event: UpDownEvent): Promise<void> {
    const books = await this.scanner.getTokenBooks(event);
    const opportunities = findOpportunities(this.config, this.tracker, event, books);

    if (opportunities.length === 0) {
      log("Watching market", {
        market: event.title,
        slug: event.slug,
        books: books.map((book) => ({
          outcome: book.outcome,
          bestAsk: book.bestAsk,
        })),
      });
      return;
    }

    for (const opportunity of opportunities) {
      await this.executeOpportunity(opportunity);
    }
  }

  private async executeOpportunity(opportunity: TradeOpportunity): Promise<void> {
    log("Placing limit order", {
      kind: opportunity.kind,
      market: opportunity.event.title,
      outcome: opportunity.token.outcome,
      limitPrice: opportunity.price,
      size: opportunity.size,
      potentialReturn: formatReturnPct(opportunity.price),
    });

    const result = await this.trader.placeBuy(opportunity);
    this.tracker.mark(opportunity.tradeKey);

    log(this.config.dryRun ? "Dry-run order" : "Live order placed", {
      tokenId: result.tokenId,
      price: result.price,
      size: result.size,
      response: result.response,
    });
  }
}
