"use client";

import { getLatestRates, getTimeSeries } from "@/lib/services/frankfurter";
import { CurrencyCode, ExchangeRates, FrankfurterTimeSeriesResponse } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

function findClosestRate(
  date: string,
  seriesRates: FrankfurterTimeSeriesResponse["rates"],
  targetCurrency: CurrencyCode,
): number | undefined {
  if (seriesRates[date]?.[targetCurrency] !== undefined) {
    return seriesRates[date][targetCurrency];
  }
  const availableDates = Object.keys(seriesRates).sort();
  let best: string | undefined;
  for (const d of availableDates) {
    if (d <= date) best = d;
    else break;
  }
  if (best !== undefined) return seriesRates[best]?.[targetCurrency];
  const earliest = availableDates[0];
  return earliest ? seriesRates[earliest]?.[targetCurrency] : undefined;
}

export function useCurrencyRates(
  baseCurrency?: CurrencyCode,
  dateRange?: { startDate: string; endDate: string },
) {
  const allCurrencies: CurrencyCode[] = ["USD", "EUR", "GBP", "JPY", "CNY"];
  const targetCurrencies = baseCurrency
    ? allCurrencies.filter((c) => c !== baseCurrency)
    : [];

  const retryFn = (failureCount: number, error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      return false;
    }
    return failureCount < 3;
  };

  const latestQuery = useQuery({
    queryKey: ["currency-rates-latest", baseCurrency],
    queryFn: async () => {
      if (!baseCurrency) {
        throw new Error("Base currency not available");
      }
      const data = await getLatestRates(baseCurrency, targetCurrencies);
      const rates: ExchangeRates = {
        ...data.rates,
        [baseCurrency]: 1.0,
      } as ExchangeRates;
      return rates;
    },
    staleTime: 3600000,
    enabled: !!baseCurrency,
    retry: retryFn,
  });

  const timeSeriesQuery = useQuery({
    queryKey: [
      "currency-rates-series",
      baseCurrency,
      dateRange?.startDate,
      dateRange?.endDate,
    ],
    queryFn: async () => {
      if (!baseCurrency || !dateRange) {
        throw new Error("Base currency or date range not available");
      }
      const data = await getTimeSeries(
        dateRange.startDate,
        dateRange.endDate,
        baseCurrency,
        targetCurrencies,
      );
      return data.rates;
    },
    staleTime: 3600000,
    enabled: !!baseCurrency && !!dateRange,
    retry: retryFn,
  });

  const convertAmount = (
    amount: number,
    targetCurrency: CurrencyCode,
    date?: string,
  ): number => {
    if (!baseCurrency) return amount;
    if (baseCurrency === targetCurrency) return amount;

    if (date && timeSeriesQuery.data) {
      const rate = findClosestRate(date, timeSeriesQuery.data, targetCurrency);
      if (rate !== undefined) return amount * rate;
    }

    if (latestQuery.data) {
      const rate = latestQuery.data[targetCurrency];
      if (rate) return amount * rate;
    }

    return amount;
  };

  return {
    rates: latestQuery.data,
    seriesRates: timeSeriesQuery.data,
    convertAmount,
    baseCurrency,
    isLoading:
      latestQuery.isLoading || (!!dateRange && timeSeriesQuery.isLoading),
    isError: latestQuery.isError,
    error: latestQuery.error,
  };
}
