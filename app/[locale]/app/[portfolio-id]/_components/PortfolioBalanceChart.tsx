"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useBalanceHistory } from "@/lib/hooks/useBalanceHistory";
import { useCurrencyRates } from "@/lib/hooks/useCurrencyRates";
import { useDisplayCurrency } from "@/lib/hooks/useDisplayCurrency";
import { usePeriod } from "@/lib/hooks/usePeriod";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

const chartConfig = {
  value: {
    label: "Balance",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function formatDate(
  dateStr: string,
  options: Intl.DateTimeFormatOptions,
  locale: string,
) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(locale, options);
}

export function PortfolioBalanceChart() {
  const [period] = usePeriod();
  const locale = useLocale();
  const t = useTranslations("BalanceChart");
  const [displayCurrency] = useDisplayCurrency();
  const {
    data: balanceHistoryData,
    isPending,
    isError,
  } = useBalanceHistory(period);
  const dateRange = useMemo(() => {
    if (balanceHistoryData.length === 0) return undefined;
    return {
      startDate: balanceHistoryData[0].date,
      endDate: balanceHistoryData[balanceHistoryData.length - 1].date,
    };
  }, [balanceHistoryData]);
  const { convertAmount } = useCurrencyRates("USD", dateRange);

  const [chartDisplayCurrency, setChartDisplayCurrency] =
    useState(displayCurrency);

  useEffect(() => {
    // Delay so Rechart detects the change and animates the chart update instead of doing a hard switch
    const timer = setTimeout(() => {
      setChartDisplayCurrency(displayCurrency);
    }, 1);
    return () => clearTimeout(timer);
  }, [displayCurrency]);

  const chartData = useMemo(() => {
    return balanceHistoryData.map((entry) => ({
      date: entry.date,
      value: convertAmount(entry.totalUsd, chartDisplayCurrency, entry.date),
    }));
  }, [balanceHistoryData, convertAmount, chartDisplayCurrency]);

  if (isPending) {
    return <Skeleton className="h-75 w-full rounded-xl" />;
  }

  if (isError) {
    return null;
  }

  return (
    <Card>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-75 flex items-center justify-center text-muted-foreground text-sm">
            {t("noHistory")}
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-75 w-full">
            {/* NOTE: We use Math.random to ensure Rechart detects the data changed and animates the update https://github.com/recharts/recharts/issues/846#issuecomment-1030392228, it's a workaround that will make React rerender all the time, but I have not see any UI issues so I will fix it in another time */}
            <AreaChart
              key={Math.random()}
              data={chartData}
              margin={{ left: 0, right: 0 }}
            >
              <defs>
                <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-value)"
                    stopOpacity={0.25}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-value)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) =>
                  formatDate(value, { month: "short", day: "numeric" }, locale)
                }
              />
              <ChartTooltip
                cursor={false}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const value = payload[0].value as number;
                  return (
                    <div className="border-border/50 bg-background rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
                      <p className="font-medium mb-1">
                        {formatDate(
                          label,
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                          locale,
                        )}
                      </p>
                      <p className="text-foreground font-mono font-medium tabular-nums">
                        {new Intl.NumberFormat(locale, {
                          style: "currency",
                          currency: displayCurrency,
                        }).format(value)}
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                dataKey="value"
                type="monotone"
                fill="url(#fillValue)"
                fillOpacity={1}
                stroke="var(--color-value)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
