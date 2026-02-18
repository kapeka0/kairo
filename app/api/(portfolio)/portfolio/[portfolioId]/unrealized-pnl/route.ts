import { auth } from "@/lib/auth";
import { existsPortfolioByIdAndUserId } from "@/lib/db/data/portfolio";
import { getWalletsByPortfolioId } from "@/lib/db/data/wallet";
import { fetchWalletBalanceHistory } from "@/lib/services/blockbook";
import { getTokenPrice } from "@/lib/services/coingecko";
import { TokenType } from "@/lib/types";
import { validateRequest } from "@/lib/utils/api-validation";
import { convertToZpub } from "@/lib/utils/bitcoin";
import { portfolioIdParamSchema } from "@/lib/validations/api";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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

    let totalCostUsd = 0;
    let totalBtcReceived = 0;
    let currentBtcBalance = 0;

    for (const wallet of wallets) {
      const zpub = convertToZpub(wallet.publicKey);
      const entries = await fetchWalletBalanceHistory(zpub);

      for (const entry of entries) {
        const receivedSatoshis = Number(entry.received);
        if (receivedSatoshis > 0 && entry.rates?.usd > 0) {
          const btcReceived = receivedSatoshis / 1e8;
          totalBtcReceived += btcReceived;
          totalCostUsd += btcReceived * entry.rates.usd;
        }
      }

      currentBtcBalance += Number(wallet.lastBalanceInSatoshis) / 1e8;
    }

    if (totalBtcReceived === 0) {
      return NextResponse.json(null);
    }

    const pmp = totalCostUsd / totalBtcReceived;

    const currentBtcPrice = await getTokenPrice({
      tokenType: TokenType.BTC,
      currency: "usd",
    });

    const currentValueUsd = currentBtcBalance * currentBtcPrice;
    const costBasisUsd = currentBtcBalance * pmp;
    const unrealizedPnlUsd = currentValueUsd - costBasisUsd;
    const unrealizedPnlPercent = costBasisUsd !== 0 ? unrealizedPnlUsd / costBasisUsd : 0;

    return NextResponse.json({
      unrealizedPnlUsd,
      unrealizedPnlPercent,
      pmp,
      costBasisUsd,
      currentValueUsd,
    });
  } catch (error) {
    console.error("Error computing unrealized PnL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
