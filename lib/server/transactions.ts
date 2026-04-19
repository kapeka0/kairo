import "server-only";

import { withCache } from "@/lib/cache";
import { getWalletsByPortfolioId } from "@/lib/db/data/wallet";
import {
  fetchTransactions,
  FormattedTransaction,
} from "@/lib/services/blockbook";
import { getHistoricalTokenPrices } from "@/lib/services/coingecko";
import { TokenType, type BipType } from "@/lib/types";
import { devLog } from "@/lib/utils";
import { toDescriptor } from "@/lib/utils/bitcoin";

const FETCH_PAGE_SIZE = 100;
const PRICE_CACHE_TTL_MS = 5 * 60 * 1000;

export interface TransactionsPayload {
  transactions: FormattedTransaction[];
  totalPages: number;
  walletCount: number;
}

function buildQuery(wallet: {
  publicKey: string;
  tokenType: string;
  bipType: string;
}): string {
  return wallet.tokenType === TokenType.BTC
    ? toDescriptor(wallet.publicKey, wallet.bipType as BipType)
    : wallet.publicKey;
}

function walletMeta(wallet: {
  id: string;
  name: string;
  icon: string | null;
  gradientUrl: string;
  tokenType: string;
}) {
  return {
    walletId: wallet.id,
    walletName: wallet.name,
    walletIcon: wallet.icon,
    walletGradientUrl: wallet.gradientUrl,
    tokenType: wallet.tokenType as TokenType,
  };
}

export async function getPortfolioTransactions(
  portfolioId: string,
  page: number,
  pageSize: number,
): Promise<TransactionsPayload> {
  const wallets = await getWalletsByPortfolioId(portfolioId);

  if (wallets.length === 0) {
    return { transactions: [], totalPages: 1, walletCount: 0 };
  }

  const results = await Promise.all(
    wallets.map(async (wallet) => {
      const result = await fetchTransactions(
        buildQuery(wallet),
        1,
        FETCH_PAGE_SIZE,
      );
      return result.transactions.map((tx) => ({
        ...tx,
        ...walletMeta(wallet),
      }));
    }),
  );

  const allTransactions: FormattedTransaction[] = results.flatMap((txs) => txs);
  allTransactions.sort((a, b) => b.blockTime - a.blockTime);

  const totalPages = Math.ceil(allTransactions.length / pageSize);
  const confirmedTxs = allTransactions.filter((tx) => tx.blockTime > 0);
  let enrichedTransactions = allTransactions;

  if (confirmedTxs.length > 0) {
    const oldestBlockTime = confirmedTxs.reduce(
      (min, t) => Math.min(min, t.blockTime),
      Infinity,
    );
    const days = Math.min(
      Math.ceil((Date.now() / 1000 - oldestBlockTime) / 86400) + 2,
      365,
    );

    const uniqueTokenTypes = [
      ...new Set(
        confirmedTxs
          .map((t) => t.tokenType as TokenType | undefined)
          .filter((t): t is TokenType => t !== undefined),
      ),
    ];
    devLog(
      "Fetching historical prices for token types:",
      uniqueTokenTypes,
      "over",
      days,
      "days",
    );
    const priceEntries = await Promise.all(
      uniqueTokenTypes.map(async (tokenType) => {
        const priceMap = await withCache(
          `prices:${tokenType}:${days}`,
          PRICE_CACHE_TTL_MS,
          () => getHistoricalTokenPrices(tokenType, days),
        );
        return [tokenType, priceMap] as const;
      }),
    );

    const pricesByToken = new Map<TokenType, Map<string, number>>(priceEntries);

    enrichedTransactions = allTransactions.map((tx) => {
      const dateKey =
        tx.blockTime > 0
          ? new Date(tx.blockTime * 1000).toISOString().slice(0, 10)
          : null;
      return {
        ...tx,
        historicalPriceUsd: dateKey
          ? pricesByToken.get(tx.tokenType as TokenType)?.get(dateKey) ?? null
          : null,
      };
    });
  }

  const paginatedTransactions = enrichedTransactions.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  return {
    transactions: paginatedTransactions,
    totalPages: Math.max(totalPages, 1),
    walletCount: wallets.length,
  };
}
