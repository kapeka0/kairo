"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Bottleneck from "bottleneck";
import { useAtom, useSetAtom } from "jotai";
import { useCallback, useEffect } from "react";
import {
  activePortfolioIdAtom,
  portfolioBalancesAtom,
} from "../atoms/PortfolioAtoms";
import { Portfolio, PortfoliosResponse, TokenType, Wallet } from "../types";
import { devLog } from "../utils";
import { calculateWalletBalanceInCurrency } from "../utils/balance";
import { CURRENCIES } from "../utils/constants";

interface WalletsResponse {
  wallets: Wallet[];
}

interface TokenPriceResponse {
  price: number;
  currency: string;
  tokenType: string;
}

const fetchPortfolios = async (): Promise<PortfoliosResponse> => {
  try {
    const { data } = await axios.get<PortfoliosResponse>("/api/portfolio");
    return data;
  } catch (error) {
    devLog("Error fetching portfolios:", error);
    throw error;
  }
};

const portfolioLimiter = new Bottleneck({
  maxConcurrent: 3, // three portfolios at the same time
  minTime: 500, // at least 500ms between each portfolio processing
});

export const usePortfolios = () => {
  const setPortfolioBalances = useSetAtom(portfolioBalancesAtom);
  const [activePortfolioId] = useAtom(activePortfolioIdAtom);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["portfolios"],
    queryFn: fetchPortfolios,
    staleTime: 1000 * 60 * 5,
  });

  const calculatePortfolioBalance = useCallback(
    async (portfolio: Portfolio) => {
      try {
        const coingeckoCurrency = CURRENCIES.find(
          (c) => c.value === portfolio.currency,
        )?.coingeckoValue;

        if (!coingeckoCurrency) {
          devLog(`No coingecko currency mapping for ${portfolio.currency}`);
          return 0;
        }

        const { data: walletsData } = await axios.get<WalletsResponse>(
          `/api/wallets/${portfolio.id}`,
        );
        const wallets = walletsData.wallets;

        // Set cache data
        queryClient.setQueryData(["wallets", portfolio.id], {
          wallets,
        });

        if (!wallets || wallets.length === 0) {
          setPortfolioBalances((prev) => ({ ...prev, [portfolio.id]: 0 }));
          return 0;
        }

        const walletsByTokenType = wallets.reduce((acc, wallet) => {
          if (!acc[wallet.tokenType]) acc[wallet.tokenType] = [];
          acc[wallet.tokenType].push(wallet);
          return acc;
        }, {} as Record<TokenType, Wallet[]>);

        // Fetch prices for all token types in parallel, if we add a lot of token types this could be optimized by caching prices or fetching them in batches
        const pricePromises = Object.keys(walletsByTokenType).map((tokenType) =>
          axios.get<TokenPriceResponse>(`/api/token/price`, {
            params: {
              tokenType,
              currency: coingeckoCurrency,
            },
          }),
        );

        const priceResponses = await Promise.all(pricePromises);
        // @ts-expect-error - We know the tokenType will be a valid key in the priceMap
        const priceMap: Record<TokenType, number> = {};

        priceResponses.forEach((response) => {
          priceMap[response.data.tokenType as TokenType] = response.data.price;
        });

        let totalBalance = 0;

        for (const [tokenType, tokenWallets] of Object.entries(
          walletsByTokenType,
        )) {
          const tokenPrice = priceMap[tokenType as TokenType];

          for (const wallet of tokenWallets) {
            totalBalance += calculateWalletBalanceInCurrency(
              wallet,
              tokenPrice,
            );
          }
        }

        setPortfolioBalances((prev) => ({
          ...prev,
          [portfolio.id]: totalBalance,
        }));

        return totalBalance;
      } catch (error) {
        devLog(
          `Error calculating balance for portfolio ${portfolio.id}:`,
          error,
        );
        return 0;
      }
    },
    [setPortfolioBalances, queryClient],
  );

  useEffect(() => {
    if (!query.data || !activePortfolioId) return;

    const activePortfolio = query.data.find((p) => p.id === activePortfolioId);
    if (activePortfolio) {
      calculatePortfolioBalance(activePortfolio);
    }
  }, [query.data, activePortfolioId, calculatePortfolioBalance]);

  useEffect(() => {
    if (!query.data || query.data.length === 0) return;

    const inactivePortfolios = query.data.filter(
      (p) => p.id !== activePortfolioId,
    );

    Promise.all(
      inactivePortfolios.map((portfolio) =>
        portfolioLimiter.schedule(() => calculatePortfolioBalance(portfolio)),
      ),
    );
  }, [query.data, activePortfolioId, calculatePortfolioBalance]);

  return {
    ...query,
    calculatePortfolioBalance,
  };
};
