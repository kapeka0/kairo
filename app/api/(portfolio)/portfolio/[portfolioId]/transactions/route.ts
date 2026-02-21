import { auth } from "@/lib/auth";
import { existsPortfolioByIdAndUserId } from "@/lib/db/data/portfolio";
import { getWalletsByPortfolioId } from "@/lib/db/data/wallet";
import { fetchTransactions, FormattedTransaction } from "@/lib/services/blockbook";
import { getHistoricalTokenPrices } from "@/lib/services/coingecko";
import { TokenType } from "@/lib/types";
import { validateRequest, parseSearchParams } from "@/lib/utils/api-validation";
import { portfolioIdParamSchema } from "@/lib/validations/api";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const transactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

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

    const { portfolioId } = paramValidation.data;

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

    const queryValidation = await parseSearchParams(
      transactionsQuerySchema,
      request.nextUrl.searchParams,
    );

    if (!queryValidation.success) {
      return queryValidation.response;
    }

    const { page, pageSize } = queryValidation.data as {
      page: number;
      pageSize: number;
    };

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
        const result = await fetchTransactions(wallet.publicKey, page, pageSize);
        return {
          ...result,
          transactions: result.transactions.map((tx) => ({
            ...tx,
            walletId: wallet.id,
            walletName: wallet.name,
            walletIcon: wallet.icon,
            walletGradientUrl: wallet.gradientUrl,
            tokenType: wallet.tokenType,
          })),
        };
      }),
    );

    const allTransactions: FormattedTransaction[] = results.flatMap(
      (r) => r.transactions,
    );

    allTransactions.sort((a, b) => b.blockTime - a.blockTime);

    const confirmedTxs = allTransactions.filter((tx) => tx.blockTime > 0);
    let enrichedTransactions = allTransactions;

    if (confirmedTxs.length > 0) {
      const oldestBlockTime = Math.min(...confirmedTxs.map((t) => t.blockTime));
      const days = Math.min(
        Math.ceil((Date.now() / 1000 - oldestBlockTime) / 86400) + 2,
        365,
      );

      const priceMap = await getHistoricalTokenPrices(TokenType.BTC, days);

      enrichedTransactions = allTransactions.map((tx) => {
        const dateKey =
          tx.blockTime > 0
            ? new Date(tx.blockTime * 1000).toISOString().slice(0, 10)
            : null;
        return {
          ...tx,
          historicalPriceUsd: dateKey ? (priceMap.get(dateKey) ?? null) : null,
        };
      });
    }

    const totalPages = results.reduce((max, r) => Math.max(max, r.totalPages), 1);

    return NextResponse.json({
      transactions: enrichedTransactions,
      totalPages,
      walletCount: wallets.length,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch transactions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
