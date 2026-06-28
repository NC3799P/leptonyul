import "dotenv/config";

function envString(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

function envNumber(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number for env var ${key}: ${raw}`);
  }
  return parsed;
}

function envBoolean(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return fallback;
  return raw.toLowerCase() === "true" || raw === "1";
}

function envList(key: string, fallback: string[]): string[] {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return fallback;
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export interface BotConfig {
  pollIntervalMs: number;
  marketSlugPrefixes: string[];
  cheapBuyMin: number;
  cheapBuyMax: number;
  expensiveBuyMin: number;
  expensiveBuyMax: number;
  enableExpensiveHedge: boolean;
  cheapOrderUsdc: number;
  expensiveOrderUsdc: number;
  maxSharesPerOrder: number;
  minutesBeforeCloseMin: number;
  minutesBeforeCloseMax: number;
  dryRun: boolean;
  privateKey?: `0x${string}`;
  funderAddress?: `0x${string}`;
  signatureType: number;
  clobHost: string;
  chainId: number;
  clobApiKey?: string;
  clobSecret?: string;
  clobPassphrase?: string;
  gammaApiHost: string;
}

export function loadConfig(): BotConfig {
  const dryRun = envBoolean("DRY_RUN", true);

  return {
    pollIntervalMs: envNumber("POLL_INTERVAL_MS", 5000),
    marketSlugPrefixes: envList("MARKET_SLUG_PREFIXES", [
      "btc-updown-15m",
      "eth-updown-15m",
    ]),
    cheapBuyMin: envNumber("CHEAP_BUY_MIN", 0.07),
    cheapBuyMax: envNumber("CHEAP_BUY_MAX", 0.1),
    expensiveBuyMin: envNumber("EXPENSIVE_BUY_MIN", 0.9),
    expensiveBuyMax: envNumber("EXPENSIVE_BUY_MAX", 0.95),
    enableExpensiveHedge: envBoolean("ENABLE_EXPENSIVE_HEDGE", true),
    cheapOrderUsdc: envNumber("CHEAP_ORDER_USDC", 10),
    expensiveOrderUsdc: envNumber("EXPENSIVE_ORDER_USDC", 50),
    maxSharesPerOrder: envNumber("MAX_SHARES_PER_ORDER", 90),
    minutesBeforeCloseMin: envNumber("MINUTES_BEFORE_CLOSE_MIN", 0),
    minutesBeforeCloseMax: envNumber("MINUTES_BEFORE_CLOSE_MAX", 15),
    dryRun,
    privateKey: process.env.PRIVATE_KEY as `0x${string}` | undefined,
    funderAddress: process.env.FUNDER_ADDRESS as `0x${string}` | undefined,
    signatureType: envNumber("SIGNATURE_TYPE", 2),
    clobHost: envString("CLOB_HOST", "https://clob.polymarket.com"),
    chainId: envNumber("CHAIN_ID", 137),
    clobApiKey: process.env.CLOB_API_KEY,
    clobSecret: process.env.CLOB_SECRET,
    clobPassphrase: process.env.CLOB_PASSPHRASE,
    gammaApiHost: envString("GAMMA_API_HOST", "https://gamma-api.polymarket.com"),
  };
}

export function validateTradingConfig(config: BotConfig): void {
  if (config.dryRun) return;

  if (!config.privateKey) {
    throw new Error("PRIVATE_KEY is required when DRY_RUN=false");
  }
  if (!config.funderAddress) {
    throw new Error("FUNDER_ADDRESS is required when DRY_RUN=false");
  }
}
