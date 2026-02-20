import { auth } from "@/lib/auth";
import { existsPortfolioByIdAndUserId } from "@/lib/db/data/portfolio";
import { getWalletsByPortfolioId } from "@/lib/db/data/wallet";
import { getCoinsMarkets } from "@/lib/services/coingecko";
import { TokenType } from "@/lib/types";
import { validateRequest, parseSearchParams } from "@/lib/utils/api-validation";
import { getTokenMetadata } from "@/lib/utils/token-metadata";
import { portfolioIdParamSchema } from "@/lib/validations/api";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const marketCoinsQuerySchema = z.object({
  portfolioId: z.string().uuid("Invalid portfolio ID format"),
  currency: z.string().default("usd"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const queryValidation = await parseSearchParams(
      marketCoinsQuerySchema,
      request.nextUrl.searchParams,
    );

    if (!queryValidation.success) {
      return queryValidation.response;
    }

    const { portfolioId, currency = "usd" } = queryValidation.data;

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

    const uniqueTokenTypes = [
      ...new Set(wallets.map((w) => w.tokenType as TokenType)),
    ];

    const portfolioCoinIds = uniqueTokenTypes.map(
      (t) => getTokenMetadata(t).coingeckoId,
    );

    const coins = await getCoinsMarkets({ currency, portfolioCoinIds });

    return NextResponse.json(coins);
  } catch (error) {
    console.error("Error fetching market coins:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
