import { auth } from "@/lib/auth";
import { existsPortfolioByIdAndUserId } from "@/lib/db/data/portfolio";
import { getWalletsByPortfolioId } from "@/lib/db/data/wallet";
import { getTokenPrice } from "@/lib/services/coingecko";
import { computeWalletPnlData } from "@/lib/services/wallet-history";
import { TokenType } from "@/lib/types";
import { validateRequest } from "@/lib/utils/api-validation";
import { portfolioIdParamSchema } from "@/lib/validations/api";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type TypeAgg = {
  totalCostUsd: number;
  totalTokensReceived: number;
  currentTokenBalance: number;
  decimals: number;
};

export async function GET(
  _request: NextRequest,
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

    const wallets = await getWalletsByPortfolioId(portfolioId);

    if (wallets.length === 0) {
      return NextResponse.json(null);
    }

    const walletResults = await Promise.all(wallets.map(computeWalletPnlData));

    const byType = new Map<TokenType, TypeAgg>();
    for (const r of walletResults) {
      const existing = byType.get(r.tokenType);
      if (existing) {
        existing.totalCostUsd += r.totalCostUsd;
        existing.totalTokensReceived += r.totalTokensReceived;
        existing.currentTokenBalance += r.currentTokenBalance;
      } else {
        byType.set(r.tokenType, {
          totalCostUsd: r.totalCostUsd,
          totalTokensReceived: r.totalTokensReceived,
          currentTokenBalance: r.currentTokenBalance,
          decimals: r.decimals,
        });
      }
    }

    const totalReceived = Array.from(byType.values()).reduce(
      (sum, agg) => sum + agg.totalTokensReceived,
      0,
    );

    if (totalReceived === 0) {
      return NextResponse.json(null);
    }

    let totalCostBasisUsd = 0;
    let totalCurrentValueUsd = 0;

    await Promise.all(
      Array.from(byType.entries()).map(async ([type, agg]) => {
        if (agg.totalTokensReceived === 0) return;
        const currentPrice = await getTokenPrice({
          tokenType: type,
          currency: "usd",
        });
        const pmp = agg.totalCostUsd / agg.totalTokensReceived;
        totalCurrentValueUsd += agg.currentTokenBalance * currentPrice;
        totalCostBasisUsd += agg.currentTokenBalance * pmp;
      }),
    );

    const unrealizedPnlUsd = totalCurrentValueUsd - totalCostBasisUsd;
    const unrealizedPnlPercent =
      totalCostBasisUsd !== 0 ? unrealizedPnlUsd / totalCostBasisUsd : 0;

    return NextResponse.json({
      unrealizedPnlUsd,
      unrealizedPnlPercent,
      costBasisUsd: totalCostBasisUsd,
      currentValueUsd: totalCurrentValueUsd,
    });
  } catch (error) {
    console.error("Error computing unrealized PnL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
