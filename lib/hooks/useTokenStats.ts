"use client";

import { useQueries } from "@tanstack/react-query";
import axios from "axios";
import { useAtom } from "jotai";
import { useCallback, useMemo } from "react";

import { activePortfolioIdAtom } from "@/lib/atoms/PortfolioAtoms";
import { TokenType } from "@/lib/types";
import { CURRENCIES } from "@/lib/utils/constants";
import { usePortfolios } from "./usePortfolios";

interface TokenStatsResponse {
  price: number;
  currency: string;
  tokenType: string;
}

const tokenTypes = Object.values(TokenType);

export function useTokenStats() {
  const [activePortfolioId] = useAtom(activePortfolioIdAtom);
  const { data: portfolios } = usePortfolios();

  const activePortfolio = portfolios?.find((p) => p.id === activePortfolioId);
  const portfolioCurrency = activePortfolio?.currency;

  const coingeckoCurrency = CURRENCIES.find(
    (c) => c.value === portfolioCurrency,
  )?.coingeckoValue;

  const queries = useQueries({
    queries: tokenTypes.map((tokenType) => ({
      queryKey: ["token-price", tokenType, coingeckoCurrency],
      queryFn: async () => {
        if (!coingeckoCurrency) throw new Error("Currency not available");
        const { data } = await axios.get<TokenStatsResponse>(
          `/api/token/price`,
          {
            params: { tokenType, currency: coingeckoCurrency },
          },
        );
        return data;
      },
      refetchInterval: 60_000,
      staleTime: 30_000,
      refetchIntervalInBackground: true,
      enabled: !!activePortfolioId && !!coingeckoCurrency,
      retry: (failureCount: number, error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 400)
          return false;
        return failureCount < 3;
      },
    })),
  });

  const pricesMap = useMemo(() => {
    const map: Partial<Record<TokenType, number>> = {};

    tokenTypes.forEach((tokenType, i) => {
      const price = queries[i]?.data?.price;
      if (price !== undefined) {
        map[tokenType] = price;
      }
    });

    return map;
  }, [queries]);

  const getPriceByTokenType = useCallback(
    (tokenType: TokenType): number | undefined => pricesMap[tokenType],
    [pricesMap],
  );

  const currencyInfo = CURRENCIES.find((c) => c.value === portfolioCurrency);

  return {
    getPriceByTokenType,
    currency: portfolioCurrency,
    currencySymbol: currencyInfo?.symbol,
    isLoading: queries.some((q) => q.isLoading),
    isError: queries.some((q) => q.isError),
  };
}
