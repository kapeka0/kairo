import { fetchWalletBalanceHistory } from "@/lib/services/blockbook";
import { TokenType, type BipType } from "@/lib/types";
import { toDescriptor } from "@/lib/utils/bitcoin";
import { getTokenMetadata } from "@/lib/utils/token-metadata";

type WalletInput = {
  publicKey: string;
  bipType: string;
  tokenType: string;
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
      const descriptor = toDescriptor(
        wallet.publicKey,
        wallet.bipType as BipType,
      );
      const entries = await fetchWalletBalanceHistory(descriptor);

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
      const descriptor = toDescriptor(
        wallet.publicKey,
        wallet.bipType as BipType,
      );
      const entries = await fetchWalletBalanceHistory(descriptor);

      entries.sort((a, b) => a.time - b.time);

      const factor = Math.pow(10, decimals);
      let tokens = 0;
      let costBasisUsd = 0;

      for (const entry of entries) {
        const received = Number(entry.received) / factor;
        const sent = Number(entry.sent) / factor;
        const net = received - sent;
        const price = entry.rates?.usd ?? 0;

        if (net > 0) {
          if (price > 0) costBasisUsd += net * price;
          tokens += net;
        } else if (net < 0 && tokens > 0) {
          const outflow = Math.min(-net, tokens);
          const wap = costBasisUsd / tokens;
          costBasisUsd -= outflow * wap;
          tokens -= outflow;
        }
      }

      if (tokens < 0) tokens = 0;
      if (costBasisUsd < 0) costBasisUsd = 0;

      return {
        tokenType: TokenType.BTC,
        decimals,
        totalCostUsd: costBasisUsd,
        totalTokensReceived: tokens,
        currentTokenBalance: tokens,
      };
    }
    case TokenType.ETH:
      throw new Error("ETH not yet supported");
    default:
      throw new Error(`Unsupported token type: ${wallet.tokenType}`);
  }
}
