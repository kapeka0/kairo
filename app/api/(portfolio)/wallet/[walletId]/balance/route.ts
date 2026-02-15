import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getBitcoinWalletById } from "@/lib/db/data/wallet";
import { walletIdParamSchema } from "@/lib/validations/api";
import { validateRequest } from "@/lib/utils/api-validation";
import { fetchBlockbookBalance } from "@/lib/services/blockbook";
import { TokenType } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletId: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawParams = await params;
    const validation = validateRequest(walletIdParamSchema, rawParams);

    if (!validation.success) {
      return validation.response;
    }

    const { walletId } = validation.data;

    const wallet = await getBitcoinWalletById(walletId);

    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    if (wallet.portfolio.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized: Wallet does not belong to user" },
        { status: 403 }
      );
    }

    switch (wallet.tokenType) {
      case TokenType.BTC: {
        const blockbookData = await fetchBlockbookBalance(wallet.publicKey);

        return NextResponse.json({
          walletId,
          tokenType: TokenType.BTC,
          balance: blockbookData.balance,
          unconfirmedBalance: blockbookData.unconfirmedBalance,
          totalReceived: blockbookData.totalReceived,
          totalSent: blockbookData.totalSent,
          txCount: blockbookData.txCount,
        });
      }

      case TokenType.ETH:
        return NextResponse.json(
          { error: "ETH support coming soon" },
          { status: 501 }
        );

      default:
        return NextResponse.json(
          { error: `Unsupported token type: ${wallet.tokenType}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch wallet balance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
