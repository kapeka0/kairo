import { auth } from "@/lib/auth";
import { withCache } from "@/lib/cache";
import { existsPortfolioByIdAndUserId } from "@/lib/db/data/portfolio";
import { getWalletsByPortfolioId } from "@/lib/db/data/wallet";
import {
  fetchTransactions,
  FormattedTransaction,
} from "@/lib/services/blockbook";
import { getHistoricalTokenPrices } from "@/lib/services/coingecko";
import { TokenType, type BipType } from "@/lib/types";
import { devLog } from "@/lib/utils";
import { parseSearchParams, validateRequest } from "@/lib/utils/api-validation";
import { toDescriptor } from "@/lib/utils/bitcoin";
import { portfolioIdParamSchema } from "@/lib/validations/api";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const transactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(1000),
});

const FETCH_PAGE_SIZE = 100;
const PRICE_CACHE_TTL_MS = 5 * 60 * 1000;

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawParams = await params;
    const paramValidation = validateRequest(portfolioIdParamSchema, rawParams);

    if (!paramValidation.success) {
      return paramValidation.response;
    }

    const queryValidation = await parseSearchParams(
      transactionsQuerySchema,
      request.nextUrl.searchParams,
    );

    if (!queryValidation.success) {
      return queryValidation.response;
    }

    const { portfolioId } = paramValidation.data;
    const { page, pageSize } = queryValidation.data as {
      page: number;
      pageSize: number;
    };

    const portfolioExists = await existsPortfolioByIdAndUserId(
      portfolioId,
      session.user.id,
    );

    if (!portfolioExists) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 },
      );
    }

    const wallets = await getWalletsByPortfolioId(portfolioId);

    if (wallets.length === 0) {
      return NextResponse.json({
        transactions: [],
        totalPages: 1,
        walletCount: 0,
      });
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
    devLog("Fetched transactions for all wallets. Enriching data...");

    const allTransactions: FormattedTransaction[] = results.flatMap(
      (txs) => txs,
    );

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

      const pricesByToken = new Map<TokenType, Map<string, number>>(
        priceEntries,
      );

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
    devLog("[Transaction route] Returning paginated transactions:", {
      total: enrichedTransactions.length,
      page,
      pageSize,
      totalPages,
    });
    return NextResponse.json({
      transactions: paginatedTransactions,
      totalPages: Math.max(totalPages, 1),
      walletCount: wallets.length,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch transactions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
