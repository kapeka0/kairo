import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { withCache } from "@/lib/cache";
import { getErc20Price } from "@/lib/services/coingecko";
import { parseSearchParams } from "@/lib/utils/api-validation";
import { getErc20Metadata } from "@/lib/utils/erc20-metadata";
import { Currency } from "@/lib/utils/constants";
import { getErc20PriceSchema } from "@/lib/validations/api";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const validation = await parseSearchParams(getErc20PriceSchema, searchParams);

    if (!validation.success) {
      return validation.response;
    }

    const { symbol, currency } = validation.data;

    const metadata = getErc20Metadata(symbol);
    if (!metadata) {
      return NextResponse.json({ error: "Unknown ERC-20 token" }, { status: 400 });
    }

    const price = await withCache(
      `erc20-price:${symbol.toUpperCase()}:${currency}`,
      60_000,
      () => getErc20Price({ coingeckoId: metadata.coingeckoId, currency: currency as Currency }),
    );

    return NextResponse.json({ symbol: symbol.toUpperCase(), currency, price });
  } catch (error) {
    console.error("Error fetching ERC-20 price:", error);
    return NextResponse.json({ error: "Failed to fetch ERC-20 price" }, { status: 500 });
  }
}
