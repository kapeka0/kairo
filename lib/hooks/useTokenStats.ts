"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAtom } from "jotai";

import { activePortfolioIdAtom } from "@/lib/atoms/PortfolioAtoms";
import { TokenType } from "@/lib/types";
import { CURRENCIES } from "@/lib/utils/constants";
import { usePortfolios } from "./usePortfolios";

interface TokenStatsResponse {
  price: number;
  currency: string;
  tokenType: string;
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
    queryKey: ["token-price", TokenType.BTC, coingeckoCurrency],
    queryFn: async () => {
      if (!coingeckoCurrency) {
        throw new Error("Currency not available");
      }

      const { data } = await axios.get<TokenStatsResponse>(`/api/token/price`, {
        params: {
          tokenType: TokenType.BTC,
          currency: coingeckoCurrency,
        },
      });

      return data;
    },
    refetchInterval: 60000,
    staleTime: 30000,
    refetchIntervalInBackground: true,
    enabled: !!activePortfolioId && !!coingeckoCurrency,
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
