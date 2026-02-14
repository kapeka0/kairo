import { auth } from "@/lib/auth";
import { db } from "@/lib/db/db";
import { bitcoinWallet } from "@/lib/db/schema";
import {
  fetchAndStoreTransactions,
  fetchBlockbookBalance,
} from "@/lib/services/blockbook";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ walletId: string }> },
) {
  try {
    const { walletId } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wallet = await db.query.bitcoinWallet.findFirst({
      where: eq(bitcoinWallet.id, walletId),
      with: {
        portfolio: true,
      },
    });

    if (!wallet || wallet.portfolio.userId !== session.user.id) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const blockbookData = await fetchBlockbookBalance(wallet.publicKey);

    await db
      .update(bitcoinWallet)
      .set({
        lastBalanceInSatoshis: blockbookData.balance,
        lastBalanceInSatoshisUpdatedAt: new Date(),
      })
      .where(eq(bitcoinWallet.id, walletId));

    let page = 1;
    let hasMore = true;
    let totalTxCount = 0;

    while (hasMore) {
      const result = await fetchAndStoreTransactions(
        walletId,
        wallet.publicKey,
        page,
      );
      hasMore = result.hasMore;
      totalTxCount += result.txCount;
      page++;
    }

    return NextResponse.json({
      balance: blockbookData.balance,
      unconfirmedBalance: blockbookData.unconfirmedBalance,
      totalReceived: blockbookData.totalReceived,
      totalSent: blockbookData.totalSent,
      txCount: blockbookData.txCount,
      newTransactions: totalTxCount,
    });
  } catch (error) {
    console.error("Error fetching Bitcoin balance:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch balance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
