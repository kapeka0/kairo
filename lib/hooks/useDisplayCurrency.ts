"use client";

import { usePortfolios } from "@/lib/hooks/usePortfolios";
import { CurrencyCode } from "@/lib/types";
import { CURRENCIES } from "@/lib/utils/constants";

function toCoingeckoCurrency(code: CurrencyCode): string {
  return (
    CURRENCIES.find((c) => c.value === code)?.coingeckoValue ??
    code.toLowerCase()
  );
}

export function useDisplayCurrency(): {
  displayCurrency: CurrencyCode;
  coingeckoCurrency: string;
} {
  const { activePortfolio } = usePortfolios();
  const coingeckoCurrency = toCoingeckoCurrency(
    activePortfolio?.currency ?? "USD",
  );
  return {
    displayCurrency: activePortfolio?.currency ?? "USD",
    coingeckoCurrency,
  };
}
