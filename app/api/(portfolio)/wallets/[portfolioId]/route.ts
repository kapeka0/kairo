import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { existsPortfolioByIdAndUserId } from "@/lib/db/data/portfolio";
import { getWalletsByPortfolioId } from "@/lib/db/data/wallet";
import { BitcoinWallet, TokenType } from "@/lib/types";
import { mapBTCWalletToWallet } from "@/lib/utils";
import { validateRequest } from "@/lib/utils/api-validation";
import { portfolioIdParamSchema } from "@/lib/validations/api";

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
    const validation = validateRequest(portfolioIdParamSchema, rawParams);

    if (!validation.success) {
      return validation.response;
    }

    const { portfolioId } = validation.data;

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

    const dbWallets = await getWalletsByPortfolioId(portfolioId);

    const btcWallets: BitcoinWallet[] = dbWallets.map((wallet) => ({
      id: wallet.id,
      name: wallet.name,
      gradientUrl: wallet.gradientUrl,
      icon: wallet.icon,
      publicKey: wallet.publicKey,
      portfolioId: wallet.portfolioId,
      lastBalanceInSatoshis: wallet.lastBalanceInSatoshis,
      lastBalanceInSatoshisUpdatedAt: wallet.lastBalanceInSatoshisUpdatedAt,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
      tokenType: TokenType.BTC,
    }));

    const mappedWallets = btcWallets.map(mapBTCWalletToWallet);
    // TODO: Add support for other wallet types (e.g. Ethereum) in the future
    return NextResponse.json({ wallets: mappedWallets });
  } catch (error) {
    console.error("Error fetching wallets:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch wallets";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
