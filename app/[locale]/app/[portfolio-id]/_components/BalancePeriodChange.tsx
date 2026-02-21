"use client";

import { PrivacyValue } from "@/components/privacy-value";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBalanceHistory } from "@/lib/hooks/useBalanceHistory";
import { useCurrencyRates } from "@/lib/hooks/useCurrencyRates";
import { useDisplayCurrency } from "@/lib/hooks/useDisplayCurrency";
import { usePeriod } from "@/lib/hooks/usePeriod";
import { useUnrealizedPnl } from "@/lib/hooks/useUnrealizedPnl";
import { cn, devLog } from "@/lib/utils";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

export function BalancePeriodChange() {
  const [period] = usePeriod();
  const tDashboard = useTranslations("Dashboard");
  const { displayCurrency } = useDisplayCurrency();
  const { data, isPending } = useBalanceHistory(period);
  const { data: pnlData } = useUnrealizedPnl();
  const dateRange = useMemo(() => {
    if (data.length < 2) return undefined;
    return { startDate: data[0].date, endDate: data[data.length - 1].date };
  }, [data]);
  const { convertAmount } = useCurrencyRates("USD", dateRange);
  const locale = useLocale();

  if (isPending) {
    return (
      <div className="flex flex-col gap-1 pt-2">
        <Skeleton className="h-10 w-64" />
      </div>
    );
  }

  if (data.length < 2) {
    return null;
  }

  const firstEntry = data[0];
  const lastEntry = data[data.length - 1];
  const changeUsd = lastEntry.totalUsd - firstEntry.totalUsd;
  const changePercent = changeUsd / firstEntry.totalUsd;

  devLog("Balance change calculation", {
    firstEntry,
    lastEntry,
    changeUsd,
    changePercent,
  });

  const firstInCurrency = convertAmount(
    firstEntry.totalUsd,
    displayCurrency,
    firstEntry.date,
  );
  const lastInCurrency = convertAmount(
    lastEntry.totalUsd,
    displayCurrency,
    lastEntry.date,
  );
  const changeInCurrency = lastInCurrency - firstInCurrency;
  const isPositive = changeInCurrency >= 0;

  const balanceChangeText = tDashboard("balanceChange", {
    period:
      period === "7d"
        ? tDashboard("oneWeek")
        : period === "30d"
        ? tDashboard("oneMonth")
        : period === "90d"
        ? tDashboard("threeMonths")
        : period === "180d"
        ? tDashboard("sixMonths")
        : tDashboard("oneYear"),
  });

  const pnlInCurrency = pnlData
    ? convertAmount(pnlData.unrealizedPnlUsd, displayCurrency)
    : null;
  const isPnlPositive = pnlInCurrency !== null && pnlInCurrency >= 0;

  return (
    <PrivacyValue>
      <span>
        <div className="flex flex-row gap-6">
          <div className="flex flex-col gap-1">
            <Tooltip>
              <TooltipTrigger className="flex items-center justify-start w-fit">
                <span className="text-muted-foreground text-sm">
                  {balanceChangeText}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tDashboard("balanceChangeExplanation")}</p>
              </TooltipContent>
            </Tooltip>

            <span
              className={cn(
                "font-semibold tabular-nums flex items-center gap-3 text-sm",
                isPositive ? "text-emerald-500" : "text-red-500",
              )}
            >
              <NumberFlowGroup>
                <span>
                  <NumberFlow
                    locales={locale}
                    value={changeInCurrency}
                    format={{
                      style: "currency",
                      currency: displayCurrency,
                      currencySign: "standard",
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                      trailingZeroDisplay: "stripIfInteger",
                    }}
                  />
                </span>
                <span className="flex items-center gap-1">
                  (
                  {isPositive ? (
                    <TrendingUp className="size-4" />
                  ) : (
                    <TrendingDown className="size-4" />
                  )}{" "}
                  <NumberFlow
                    value={changePercent}
                    locales={locale}
                    className="transition-colors duration-300"
                    format={{
                      style: "percent",
                      maximumFractionDigits: 2,
                      signDisplay: "always",
                    }}
                  />
                  )
                </span>
              </NumberFlowGroup>
            </span>
          </div>

          {pnlData && pnlInCurrency !== null && (
            <div className="flex flex-col gap-1">
              <Tooltip>
                <TooltipTrigger className="flex items-center justify-start w-fit ">
                  <span className="text-muted-foreground text-sm">
                    {tDashboard("unrealizedPnl")}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{tDashboard("unrealizedPnlExplanation")}</p>
                </TooltipContent>
              </Tooltip>

              <span
                className={cn(
                  "font-semibold tabular-nums flex items-center gap-3 text-sm",
                  isPnlPositive ? "text-emerald-500" : "text-red-500",
                )}
              >
                <NumberFlowGroup>
                  <span>
                    <NumberFlow
                      locales={locale}
                      value={pnlInCurrency}
                      format={{
                        style: "currency",
                        currency: displayCurrency,
                        currencySign: "standard",
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                        trailingZeroDisplay: "stripIfInteger",
                      }}
                    />
                  </span>
                  <span className="flex items-center gap-1">
                    (
                    {isPnlPositive ? (
                      <TrendingUp className="size-4" />
                    ) : (
                      <TrendingDown className="size-4" />
                    )}{" "}
                    <NumberFlow
                      value={pnlData.unrealizedPnlPercent}
                      locales={locale}
                      className="transition-colors duration-300"
                      format={{
                        style: "percent",
                        maximumFractionDigits: 2,
                        signDisplay: "always",
                      }}
                    />
                    )
                  </span>
                </NumberFlowGroup>
              </span>
            </div>
          )}
        </div>
      </span>
    </PrivacyValue>
  );
}
