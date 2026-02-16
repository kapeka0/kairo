"use client";

import { CurrencyCode, ExchangeRates, FrankfurterResponse } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export function useCurrencyRates(baseCurrency?: CurrencyCode) {
  const allCurrencies: CurrencyCode[] = ["USD", "EUR", "GBP", "JPY", "CNY"];

  const query = useQuery({
    queryKey: ["currency-rates", baseCurrency],
    queryFn: async () => {
      if (!baseCurrency) {
        throw new Error("Base currency not available");
      }

      const targetCurrencies = allCurrencies
        .filter((c) => c !== baseCurrency)
        .join(",");
      // If more functinality is added we can create a service layer and move this logic there
      const { data } = await axios.get<FrankfurterResponse>(
        `https://api.frankfurter.dev/v1/latest`,
        {
          params: {
            base: baseCurrency,
            symbols: targetCurrencies,
          },
        },
      );

      const rates: ExchangeRates = {
        ...data.rates,
        [baseCurrency]: 1.0,
      } as ExchangeRates;

      return rates;
    },
    staleTime: 3600000,
    enabled: !!baseCurrency,
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const convertAmount = (
    amount: number,
    targetCurrency: CurrencyCode,
  ): number => {
    if (!baseCurrency || !query.data) {
      return amount;
    }

    if (baseCurrency === targetCurrency) {
      return amount;
    }

    const rate = query.data[targetCurrency];
    if (!rate) {
      console.warn(
        `Exchange rate for ${targetCurrency} not found, returning original amount`,
      );
      return amount;
    }

    return amount * rate;
  };

  return {
    rates: query.data,
    convertAmount,
    baseCurrency,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
