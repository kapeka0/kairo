import { auth } from "@/lib/auth";
import { existsPortfolioByIdAndUserId } from "@/lib/db/data/portfolio";
import { getWalletsByPortfolioId } from "@/lib/db/data/wallet";
import { fetchWalletBalanceHistory } from "@/lib/services/blockbook";
import { getHistoricalTokenPrices } from "@/lib/services/coingecko";
import { Period, TokenType } from "@/lib/types";
import { validateRequest, parseSearchParams } from "@/lib/utils/api-validation";
import { convertToZpub } from "@/lib/utils/bitcoin";
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

    const walletDayMaps = await Promise.all(
      wallets.map(async (wallet) => {
        const zpub = convertToZpub(wallet.publicKey);
        const entries = await fetchWalletBalanceHistory(zpub);

        entries.sort((a, b) => a.time - b.time);

        const dayMap = new Map<string, bigint>();
        let runningBalance = BigInt(0);

        for (const entry of entries) {
          runningBalance += BigInt(entry.received) - BigInt(entry.sent);
          const date = new Date(entry.time * 1000).toISOString().slice(0, 10);
          dayMap.set(date, runningBalance);
        }

        return dayMap;
      }),
    );

    const allDates = new Set<string>();
    for (const dayMap of walletDayMaps) {
      for (const date of dayMap.keys()) {
        allDates.add(date);
      }
    }

    const sortedDates = Array.from(allDates).sort();

    const lastKnownBalance: bigint[] = walletDayMaps.map(() => BigInt(0));
    const aggregatedSatoshis = new Map<string, bigint>();

    for (const date of sortedDates) {
      for (let i = 0; i < walletDayMaps.length; i++) {
        const entry = walletDayMaps[i].get(date);
        if (entry !== undefined) {
          lastKnownBalance[i] = entry;
        }
      }

      const totalSatoshis = lastKnownBalance.reduce(
        (sum, b) => sum + b,
        BigInt(0),
      );
      aggregatedSatoshis.set(date, totalSatoshis);
    }

    const days = PERIOD_DAYS[period];
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().slice(0, 10);
    const todayStr = now.toISOString().slice(0, 10);

    const sortedAggregated = Array.from(aggregatedSatoshis.entries()).sort(
      ([a], [b]) => a.localeCompare(b),
    );

    let carryForwardSatoshis = BigInt(0);
    for (const [date, satoshis] of sortedAggregated) {
      if (date < startDateStr) {
        carryForwardSatoshis = satoshis;
      }
    }

    const periodDates: string[] = [];
    const current = new Date(startDate);
    while (current.toISOString().slice(0, 10) <= todayStr) {
      periodDates.push(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() + 1);
    }

    const dailyPriceMap = await getHistoricalTokenPrices(TokenType.BTC, days);

    const result: { date: string; totalUsd: number }[] = [];
    let aggIdx = sortedAggregated.findIndex(([d]) => d >= startDateStr);
    if (aggIdx === -1) aggIdx = sortedAggregated.length;

    for (let i = 0; i < periodDates.length; i++) {
      const dateStr = periodDates[i];

      if (
        aggIdx < sortedAggregated.length &&
        sortedAggregated[aggIdx][0] === dateStr
      ) {
        carryForwardSatoshis = sortedAggregated[aggIdx][1];
        aggIdx++;
      }

      const dailyRate = dailyPriceMap.get(dateStr) ?? 0;
      const totalUsd =
        dailyRate > 0
          ? (Number(carryForwardSatoshis) / 100_000_000) * dailyRate
          : 0;

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
