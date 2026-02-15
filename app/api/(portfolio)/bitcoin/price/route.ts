import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getBitcoinPrice } from "@/lib/services/coingecko";
import { CURRENCIES } from "@/lib/utils/constants";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const currency = searchParams.get("currency");

    if (!currency) {
      return NextResponse.json(
        { error: "Currency parameter is required" },
        { status: 400 },
      );
    }

    if (!CURRENCIES.map((c) => c.coingeckoValue).includes(currency as any)) {
      return NextResponse.json(
        {
          error: `Invalid currency. Supported currencies: ${CURRENCIES.map(
            (c) => c.coingeckoValue,
          ).join(", ")}`,
        },
        { status: 400 },
      );
    }

    const price = await getBitcoinPrice({ currency: currency as any });

    return NextResponse.json({ price, currency });
  } catch (error) {
    console.error("Error fetching Bitcoin price:", error);
    return NextResponse.json(
      { error: "Failed to fetch Bitcoin price" },
      { status: 500 },
    );
  }
}
