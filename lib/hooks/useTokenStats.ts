"use client";

import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import axios from "axios";

import { activePortfolioIdAtom } from "@/lib/atoms/ActivePortfolio";
import { CURRENCIES } from "@/lib/utils/constants";
import { usePortfolios } from "./usePortfolios";

interface TokenStatsResponse {
  price: number;
  currency: string;
}

export function useTokenStats() {
  const [activePortfolioId] = useAtom(activePortfolioIdAtom);
  const { data: portfolios } = usePortfolios();

  const activePortfolio = portfolios?.find((p) => p.id === activePortfolioId);
  const portfolioCurrency = activePortfolio?.currency;

  const coingeckoCurrency = CURRENCIES.find(
    (c) => c.value === portfolioCurrency,
  )?.coingeckoValue;

  const query = useQuery({
    queryKey: ["token-stats", coingeckoCurrency],
    queryFn: async () => {
      const { data } = await axios.get<TokenStatsResponse>(
        `/api/bitcoin/price?currency=${coingeckoCurrency}`,
      );
      return data;
    },
    enabled: !!activePortfolioId && !!coingeckoCurrency,
    refetchInterval: 60000,
    staleTime: 30000,
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const currencyInfo = CURRENCIES.find((c) => c.value === portfolioCurrency);

  return {
    btcPrice: query.data?.price,
    currency: portfolioCurrency,
    currencySymbol: currencyInfo?.symbol,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
