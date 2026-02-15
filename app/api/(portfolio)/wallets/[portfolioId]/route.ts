import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db/db";
import { bitcoinWallet, portfolio } from "@/lib/db/schema";
import { BitcoinWallet, TokenType } from "@/lib/types";
import { mapBTCWalletToWallet } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> },
) {
  try {
    const { portfolioId } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const portfolioExists = await db.query.portfolio.findFirst({
      where: and(
        eq(portfolio.id, portfolioId),
        eq(portfolio.userId, session.user.id),
      ),
    });

    if (!portfolioExists) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 },
      );
    }

    const totalWallets = [];
    const dbWallets = await db.query.bitcoinWallet.findMany({
      where: eq(bitcoinWallet.portfolioId, portfolioId),
      orderBy: (wallet, { desc }) => [desc(wallet.createdAt)],
    });

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

    totalWallets.push(...btcWallets.map(mapBTCWalletToWallet));
    // Add support for other wallet types here in the future

    return NextResponse.json({ wallets: totalWallets });
  } catch (error) {
    console.error("Error fetching wallets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
