"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAtom } from "jotai";
import { activePortfolioIdAtom } from "../atoms/PortfolioAtoms";
import { CoinMarketItem } from "../services/coingecko";
import { useDisplayCurrency } from "./useDisplayCurrency";

export function useMarketCoins() {
  const [activePortfolioId] = useAtom(activePortfolioIdAtom);
  const { coingeckoCurrency } = useDisplayCurrency();

  return useQuery({
    queryKey: ["market-coins", activePortfolioId, coingeckoCurrency],
    queryFn: async () => {
      const { data } = await axios.get<CoinMarketItem[]>("/api/market/coins", {
        params: {
          portfolioId: activePortfolioId,
          currency: coingeckoCurrency,
        },
      });
      return data;
    },
    refetchInterval: 1000 * 60, // 1 minute
    enabled: !!activePortfolioId,
  });
}
