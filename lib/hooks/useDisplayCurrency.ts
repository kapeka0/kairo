"use client";

import { usePortfolios } from "@/lib/hooks/usePortfolios";
import { CurrencyCode } from "@/lib/types";
import { CURRENCIES } from "@/lib/utils/constants";
import { useFormatter } from "next-intl";

function toCoingeckoCurrency(code: CurrencyCode): string {
  return (
    CURRENCIES.find((c) => c.value === code)?.coingeckoValue ??
    code.toLowerCase()
  );
}

export function useDisplayCurrency(): {
  displayCurrency: CurrencyCode;
  coingeckoCurrency: string;
  formatCurrency: (value: number) => string;
  formatNumber: (value: number) => string;
} {
  const { activePortfolio } = usePortfolios();
  const coingeckoCurrency = toCoingeckoCurrency(
    activePortfolio?.currency ?? "USD",
  );
  const format = useFormatter();
  const formatCurrency = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: activePortfolio?.currency ?? "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  const formatNumber = (value: number) =>
    format.number(value, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  return {
    displayCurrency: activePortfolio?.currency ?? "USD",
    coingeckoCurrency,
    formatCurrency,
    formatNumber,
  };
}
