import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { existsPortfolioByIdAndUserId } from "@/lib/db/data/portfolio";
import { getAllWalletsByPortfolioId } from "@/lib/db/data/wallet";
import { TokenType } from "@/lib/types";
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

    const dbWallets = await getAllWalletsByPortfolioId(portfolioId);

    const mappedWallets = dbWallets.map((wallet) => ({
      id: wallet.id,
      walletId: wallet.walletId,
      name: wallet.name,
      gradientUrl: wallet.gradientUrl,
      icon: wallet.icon,
      publicKey: wallet.publicKey,
      bipType: wallet.bipType,
      portfolioId: wallet.portfolioId,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
      tokenType: wallet.tokenType as TokenType,
    }));

    return NextResponse.json({ wallets: mappedWallets });
  } catch (error) {
    console.error("Error fetching wallets:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch wallets";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
