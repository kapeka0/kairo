import { fetchWalletBalanceHistory } from "@/lib/services/blockbook";
import { TokenType } from "@/lib/types";
import { convertToZpub } from "@/lib/utils/bitcoin";
import { getTokenMetadata } from "@/lib/utils/token-metadata";

type WalletInput = {
  publicKey: string;
  tokenType: string;
  lastBalanceInSatoshis: string;
};

export type WalletDayMapResult = {
  dayMap: Map<string, bigint>;
  tokenType: TokenType;
  decimals: number;
};

export type WalletPnlDataResult = {
  tokenType: TokenType;
  decimals: number;
  totalCostUsd: number;
  totalTokensReceived: number;
  currentTokenBalance: number;
};

export async function computeWalletDayMap(
  wallet: WalletInput,
): Promise<WalletDayMapResult> {
  switch (wallet.tokenType as TokenType) {
    case TokenType.BTC: {
      const { decimals } = getTokenMetadata(TokenType.BTC);
      const zpub = convertToZpub(wallet.publicKey);
      const entries = await fetchWalletBalanceHistory(zpub);

      entries.sort((a, b) => a.time - b.time);

      const dayMap = new Map<string, bigint>();
      let running = BigInt(0);

      for (const entry of entries) {
        running += BigInt(entry.received) - BigInt(entry.sent);
        const date = new Date(entry.time * 1000).toISOString().slice(0, 10);
        dayMap.set(date, running);
      }

      return { dayMap, tokenType: TokenType.BTC, decimals };
    }
    case TokenType.ETH:
      throw new Error("ETH not yet supported");
    default:
      throw new Error(`Unsupported token type: ${wallet.tokenType}`);
  }
}

export async function computeWalletPnlData(
  wallet: WalletInput,
): Promise<WalletPnlDataResult> {
  switch (wallet.tokenType as TokenType) {
    case TokenType.BTC: {
      const { decimals } = getTokenMetadata(TokenType.BTC);
      const zpub = convertToZpub(wallet.publicKey);
      const entries = await fetchWalletBalanceHistory(zpub);

      let totalCostUsd = 0;
      let totalTokensReceived = 0;

      for (const entry of entries) {
        const receivedRaw = Number(entry.received);
        if (receivedRaw > 0 && entry.rates?.usd > 0) {
          const tokensReceived = receivedRaw / Math.pow(10, decimals);
          totalTokensReceived += tokensReceived;
          totalCostUsd += tokensReceived * entry.rates.usd;
        }
      }

      const currentTokenBalance =
        Number(wallet.lastBalanceInSatoshis) / Math.pow(10, decimals);

      return {
        tokenType: TokenType.BTC,
        decimals,
        totalCostUsd,
        totalTokensReceived,
        currentTokenBalance,
      };
    }
    case TokenType.ETH:
      throw new Error("ETH not yet supported");
    default:
      throw new Error(`Unsupported token type: ${wallet.tokenType}`);
  }
}
