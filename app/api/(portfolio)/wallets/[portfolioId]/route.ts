import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db/db";
import { bitcoinWallet, portfolio } from "@/lib/db/schema";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioId: string }> }
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
        eq(portfolio.userId, session.user.id)
      ),
    });

    if (!portfolioExists) {
      return NextResponse.json(
        { error: "Portfolio not found" },
        { status: 404 }
      );
    }

    const wallets = await db.query.bitcoinWallet.findMany({
      where: eq(bitcoinWallet.portfolioId, portfolioId),
      orderBy: (wallet, { desc }) => [desc(wallet.createdAt)],
    });

    return NextResponse.json({ wallets });
  } catch (error) {
    console.error("Error fetching wallets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
