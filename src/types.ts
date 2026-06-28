export type TradeSide = "BUY" | "SELL";

export interface GammaMarket {
  question: string;
  conditionId: string;
  slug: string;
  clobTokenIds: string;
  outcomes: string;
  negRisk: boolean;
  orderPriceMinTickSize: number;
  active: boolean;
  closed: boolean;
}

export interface UpDownEvent {
  title: string;
  slug: string;
  market: GammaMarket;
  windowStart: number;
  windowEnd: number;
}

export interface TokenBook {
  tokenId: string;
  outcome: string;
  outcomeIndex: number;
  bestBid: number | null;
  bestAsk: number | null;
}

export interface TradeOpportunity {
  kind: "cheap" | "expensive";
  event: UpDownEvent;
  token: TokenBook;
  price: number;
  size: number;
  tickSize: string;
  negRisk: boolean;
  tradeKey: string;
}

export interface OrderResult {
  dryRun: boolean;
  tokenId: string;
  side: TradeSide;
  price: number;
  size: number;
  response?: unknown;
}

export interface OrderBook {
  bids?: Array<{ price: string }>;
  asks?: Array<{ price: string }>;
}
