import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getTokenPrice } from "@/lib/services/coingecko";
import { Currency } from "@/lib/utils/constants";
import { getTokenPriceSchema } from "@/lib/validations/api";
import { parseSearchParams } from "@/lib/utils/api-validation";
import { getTokenMetadata } from "@/lib/utils/token-metadata";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const validation = await parseSearchParams(getTokenPriceSchema, searchParams);

    if (!validation.success) {
      return validation.response;
    }

    const { currency, tokenType } = validation.data;

    const tokenMetadata = getTokenMetadata(tokenType);
    const price = await getTokenPrice({
      tokenType,
      currency: currency as Currency,
    });

    return NextResponse.json({
      tokenType,
      currency,
      price,
      coingeckoId: tokenMetadata.coingeckoId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching token price:", error);
    return NextResponse.json(
      { error: "Failed to fetch token price" },
      { status: 500 },
    );
  }
}
