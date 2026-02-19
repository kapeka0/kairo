import { auth } from "@/lib/auth";
import { existsPortfolioByIdAndUserId } from "@/lib/db/data/portfolio";
import { getWalletsByPortfolioId } from "@/lib/db/data/wallet";
import { getHistoricalTokenPrices } from "@/lib/services/coingecko";
import { computeWalletDayMap } from "@/lib/services/wallet-history";
import { Period, TokenType } from "@/lib/types";
import { validateRequest, parseSearchParams } from "@/lib/utils/api-validation";
import { portfolioIdParamSchema } from "@/lib/validations/api";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const PERIOD_VALUES = ["7d", "30d", "90d", "180d", "365d"] as const;
const PERIOD_DAYS: Record<Period, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "180d": 180,
  "365d": 365,
};

const balanceHistoryQuerySchema = z.object({
  period: z.enum(PERIOD_VALUES).default("30d"),
});

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
    const paramValidation = validateRequest(portfolioIdParamSchema, rawParams);

    if (!paramValidation.success) {
      return paramValidation.response;
    }

    const { portfolioId } = paramValidation.data;

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

    const queryValidation = await parseSearchParams(
      balanceHistoryQuerySchema,
      request.nextUrl.searchParams,
    );

    if (!queryValidation.success) {
      return queryValidation.response;
    }

    const { period } = queryValidation.data as { period: Period };

    const wallets = await getWalletsByPortfolioId(portfolioId);

    if (wallets.length === 0) {
      return NextResponse.json([]);
    }

    const walletResults = await Promise.all(wallets.map(computeWalletDayMap));

    const byType = new Map<
      TokenType,
      { dayMap: Map<string, bigint>; decimals: number }[]
    >();
    for (const r of walletResults) {
      if (!byType.has(r.tokenType)) byType.set(r.tokenType, []);
      byType.get(r.tokenType)!.push({ dayMap: r.dayMap, decimals: r.decimals });
    }

    const allDates = new Set<string>();
    for (const r of walletResults) {
      for (const date of r.dayMap.keys()) {
        allDates.add(date);
      }
    }

    const sortedDates = Array.from(allDates).sort();

    const aggregatedByType = new Map<TokenType, Map<string, bigint>>();
    for (const [type, typeWallets] of byType) {
      const dayMaps = typeWallets.map((w) => w.dayMap);
      const lastKnownBalance: bigint[] = dayMaps.map(() => BigInt(0));
      const typeAggMap = new Map<string, bigint>();

      for (const date of sortedDates) {
        for (let i = 0; i < dayMaps.length; i++) {
          const entry = dayMaps[i].get(date);
          if (entry !== undefined) {
            lastKnownBalance[i] = entry;
          }
        }
        const total = lastKnownBalance.reduce((sum, b) => sum + b, BigInt(0));
        typeAggMap.set(date, total);
      }

      aggregatedByType.set(type, typeAggMap);
    }

    const days = PERIOD_DAYS[period];
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().slice(0, 10);
    const todayStr = now.toISOString().slice(0, 10);

    const priceMapByType = new Map<TokenType, Map<string, number>>();
    await Promise.all(
      Array.from(byType.keys()).map(async (type) => {
        priceMapByType.set(type, await getHistoricalTokenPrices(type, days));
      }),
    );

    const sortedAggByType = new Map<TokenType, [string, bigint][]>();
    for (const [type, typeAggMap] of aggregatedByType) {
      sortedAggByType.set(
        type,
        Array.from(typeAggMap.entries()).sort(([a], [b]) =>
          a.localeCompare(b),
        ),
      );
    }

    const carryForwardByType = new Map<TokenType, bigint>();
    const aggIdxByType = new Map<TokenType, number>();
    for (const [type, sortedAgg] of sortedAggByType) {
      let cf = BigInt(0);
      for (const [date, val] of sortedAgg) {
        if (date < startDateStr) {
          cf = val;
        }
      }
      carryForwardByType.set(type, cf);
      let idx = sortedAgg.findIndex(([d]) => d >= startDateStr);
      if (idx === -1) idx = sortedAgg.length;
      aggIdxByType.set(type, idx);
    }

    const periodDates: string[] = [];
    const current = new Date(startDate);
    while (current.toISOString().slice(0, 10) <= todayStr) {
      periodDates.push(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() + 1);
    }

    const result: { date: string; totalUsd: number }[] = [];

    for (let i = 0; i < periodDates.length; i++) {
      const dateStr = periodDates[i];

      for (const [type, sortedAgg] of sortedAggByType) {
        const idx = aggIdxByType.get(type)!;
        if (idx < sortedAgg.length && sortedAgg[idx][0] === dateStr) {
          carryForwardByType.set(type, sortedAgg[idx][1]);
          aggIdxByType.set(type, idx + 1);
        }
      }

      let totalUsd = 0;
      for (const [type, typeWallets] of byType) {
        const { decimals } = typeWallets[0];
        const balance = carryForwardByType.get(type) ?? BigInt(0);
        const price = priceMapByType.get(type)?.get(dateStr) ?? 0;
        if (price > 0) {
          totalUsd += (Number(balance) / Math.pow(10, decimals)) * price;
        }
      }

      result.push({ date: dateStr, totalUsd });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching balance history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
