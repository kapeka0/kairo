"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useBalanceHistory } from "@/lib/hooks/useBalanceHistory";
import { useCurrencyRates } from "@/lib/hooks/useCurrencyRates";
import { usePortfolios } from "@/lib/hooks/usePortfolios";
import { CurrencyCode, Period } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
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
  const [period, setPeriod] = useState<Period>("30d");
  const locale = useLocale();
  const t = useTranslations("BalanceChart");
  const PERIODS: { value: Period; label: string }[] = [
    { value: "7d", label: t("7d") },
    { value: "30d", label: t("30d") },
    { value: "90d", label: t("90d") },
    { value: "180d", label: t("180d") },
    { value: "365d", label: t("365d") },
  ];
  const { activePortfolio } = usePortfolios();
  const portfolioCurrency = (activePortfolio?.currency ??
    "USD") as CurrencyCode;
  const { data, isLoading, isError } = useBalanceHistory(period);
  const { convertAmount } = useCurrencyRates("USD");

  const chartData = data.map((entry) => ({
    date: entry.date,
    value: convertAmount(entry.totalUsd, portfolioCurrency),
  }));

  if (isLoading) {
    return <Skeleton className="h-75 w-full rounded-xl" />;
  }

  if (isError) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardAction>
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-32.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-75 flex items-center justify-center text-muted-foreground text-sm">
            {t("noHistory")}
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-75 w-full">
            <AreaChart data={chartData} margin={{ left: 0, right: 0 }}>
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
                          currency: portfolioCurrency,
                        }).format(value)}
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                dataKey="value"
                type="natural"
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
