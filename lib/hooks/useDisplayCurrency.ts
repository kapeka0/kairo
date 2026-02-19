"use client";

import { usePortfolios } from "@/lib/hooks/usePortfolios";
import { CurrencyCode } from "@/lib/types";
import { CURRENCIES } from "@/lib/utils/constants";
import { parseAsStringEnum, useQueryState } from "nuqs";

export const CURRENCY_VALUES: CurrencyCode[] = CURRENCIES.map(
  (c) => c.value as CurrencyCode,
);

export function useDisplayCurrency() {
  const { activePortfolio } = usePortfolios();
  const portfolioCurrency = (activePortfolio?.currency ?? "USD") as CurrencyCode;

  const [urlCurrency, setUrlCurrency] = useQueryState(
    "currency",
    parseAsStringEnum<CurrencyCode>(CURRENCY_VALUES),
  );

  const displayCurrency: CurrencyCode = urlCurrency ?? portfolioCurrency;

  return [displayCurrency, setUrlCurrency] as const;
}
