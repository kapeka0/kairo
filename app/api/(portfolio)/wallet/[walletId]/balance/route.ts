import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getAssetById } from "@/lib/db/data/wallet";
import { walletIdParamSchema } from "@/lib/validations/api";
import { validateRequest } from "@/lib/utils/api-validation";
import { btcBlockbook, ethBlockbook } from "@/lib/services/blockbook";
import { TokenType, type BipType } from "@/lib/types";
import { toDescriptor } from "@/lib/utils/bitcoin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletId: string }> },
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

    const asset = await getAssetById(walletId);

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    if (asset.wallet.portfolio.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized: Asset does not belong to user" },
        { status: 403 },
      );
    }

    if (asset.tokenType === "ETH") {
      const blockbookData = await ethBlockbook.fetchBalance(asset.publicKey);

      return NextResponse.json({
        walletId,
        tokenType: TokenType.ETH,
        balance: blockbookData.balance,
        unconfirmedBalance: blockbookData.unconfirmedBalance,
        txCount: blockbookData.txCount,
        tokens: blockbookData.tokens,
      });
    } else {
      const blockbookData = await btcBlockbook.fetchBalance(
        toDescriptor(asset.publicKey, asset.bipType as BipType),
      );

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
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch wallet balance";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
