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
import { usePortfolios } from "@/lib/hooks/usePortfolios";
import { useUnrealizedPnl } from "@/lib/hooks/useUnrealizedPnl";
import { CurrencyCode, Period } from "@/lib/types";
import { cn, devLog } from "@/lib/utils";
import { CURRENCIES } from "@/lib/utils/constants";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { ArrowDownRight, ArrowUpLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { parseAsStringEnum, useQueryState } from "nuqs";
const PERIOD_VALUES: Period[] = ["7d", "30d", "90d", "180d", "365d"];
const CURRENCY_VALUES: CurrencyCode[] = CURRENCIES.map((c) => c.value);

export function BalancePeriodChange() {
  const [period] = useQueryState<Period>(
    "period",
    parseAsStringEnum<Period>(PERIOD_VALUES).withDefault("30d"),
  );
  const tDashboard = useTranslations("Dashboard");
  const { activePortfolio } = usePortfolios();
  const portfolioCurrency = (activePortfolio?.currency ??
    "USD") as CurrencyCode;
  const [urlCurrency] = useQueryState(
    "currency",
    parseAsStringEnum<CurrencyCode>(CURRENCY_VALUES),
  );
  const displayCurrency: CurrencyCode = urlCurrency ?? portfolioCurrency;
  const { data, isLoading } = useBalanceHistory(period);
  const { data: pnlData } = useUnrealizedPnl();
  const { convertAmount } = useCurrencyRates("USD");
  const locale = useLocale();

  if (isLoading) {
    return <Skeleton className="h-4 w-40" />;
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

  const changeInCurrency = convertAmount(changeUsd, displayCurrency);
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
                    <ArrowUpLeft className="size-4" />
                  ) : (
                    <ArrowDownRight className="size-4" />
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
                      <ArrowUpLeft className="size-4" />
                    ) : (
                      <ArrowDownRight className="size-4" />
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
