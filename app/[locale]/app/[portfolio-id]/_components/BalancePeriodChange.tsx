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
import { CurrencyCode, Period } from "@/lib/types";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { MoveDownRight, MoveUpLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { parseAsStringEnum, useQueryState } from "nuqs";
const PERIOD_VALUES: Period[] = ["7d", "30d", "90d", "180d", "365d"];
const CURRENCY_VALUES: CurrencyCode[] = ["USD", "EUR", "GBP", "JPY", "CNY"];

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
  const changePercent = (changeUsd / firstEntry.totalUsd) * 100;
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

  return (
    <PrivacyValue>
      <span>
        <div className="flex flex-col gap-1 ">
          <Tooltip>
            <TooltipTrigger className="flex items-center justify-start ">
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
              " font-semibold tabular-nums flex items-center gap-3 text-sm",
              isPositive ? "text-emerald-500" : "text-red-500",
            )}
          >
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
                <MoveUpLeft className="size-4" />
              ) : (
                <MoveDownRight className="size-4" />
              )}{" "}
              <NumberFlow
                value={changePercent}
                format={{
                  style: "percent",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                  trailingZeroDisplay: "stripIfInteger",
                }}
              />
              )
            </span>
          </span>
        </div>
      </span>
    </PrivacyValue>
  );
}
