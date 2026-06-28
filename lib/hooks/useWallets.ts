"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useCallback, useMemo } from "react";
import { Erc20Token, Wallet } from "../types";
import { devLog } from "../utils";
import { calculateWalletBalanceInCurrency } from "../utils/balance";
import { CURRENCIES } from "../utils/constants";
import { getErc20Metadata } from "../utils/erc20-metadata";
import { usePortfolios } from "./usePortfolios";
import { useTokenStats } from "./useTokenStats";

interface UseWalletsResult {
  wallets: Wallet[];
}

interface WalletBalanceResponse {
  balance: string;
  tokens?: Erc20Token[];
}

async function fetchWallets(portfolioId: string): Promise<UseWalletsResult> {
  try {
    const { data } = await axios.get<UseWalletsResult>(
      `/api/wallets/${portfolioId}`,
    );
    return data;
  } catch (error) {
    devLog("Error fetching wallets:", error);
    throw error;
  }
}

export function useWallets(portfolioId?: string) {
  const { activePortfolio } = usePortfolios();
  const { getPriceByTokenType } = useTokenStats();
  const currentPortfolioId = portfolioId || activePortfolio?.id || "";

  const coingeckoCurrency = useMemo(() => {
    return CURRENCIES.find((c) => c.value === activePortfolio?.currency)?.coingeckoValue;
  }, [activePortfolio?.currency]);

  const query = useQuery({
    queryKey: ["wallets", currentPortfolioId],
    queryFn: () => fetchWallets(currentPortfolioId),
    enabled: !!currentPortfolioId,
    staleTime: 60 * 60 * 1000,
  });

  const wallets = useMemo(
    () => query.data?.wallets ?? [],
    [query.data?.wallets],
  );

  const balanceQueries = useQueries({
    queries: wallets.map((wallet) => ({
      queryKey: ["balance", wallet.id],
      queryFn: async (): Promise<WalletBalanceResponse> => {
        const { data } = await axios.get<WalletBalanceResponse>(
          `/api/wallet/${wallet.id}/balance`,
        );
        return { balance: data.balance, tokens: data.tokens ?? [] };
      },
      staleTime: 120_000,
      enabled: !!portfolioId,
    })),
  });

  const erc20Symbols = useMemo(() => {
    const symbols = new Set<string>();
    balanceQueries.forEach((q) => {
      q.data?.tokens?.forEach((t) => {
        if (getErc20Metadata(t.symbol)) symbols.add(t.symbol.toUpperCase());
      });
    });
    return Array.from(symbols);
  }, [balanceQueries]);

  const erc20PriceQueries = useQueries({
    queries: erc20Symbols.map((symbol) => ({
      queryKey: ["erc20-price", symbol, coingeckoCurrency],
      queryFn: async () => {
        const { data } = await axios.get<{ symbol: string; price: number }>(
          `/api/token/erc20-price`,
          { params: { symbol, currency: coingeckoCurrency } },
        );
        return data;
      },
      staleTime: 60_000,
      enabled: !!coingeckoCurrency && erc20Symbols.length > 0,
    })),
  });

  const erc20PricesMap = useMemo(() => {
    const map: Record<string, number> = {};
    erc20PriceQueries.forEach((q) => {
      if (q.data) map[q.data.symbol] = q.data.price;
    });
    return map;
  }, [erc20PriceQueries]);

  const getWalletBalanceInCurrency = useCallback(
    (wallet: Wallet): number => {
      if (!wallet) return 0;
      return calculateWalletBalanceInCurrency(
        wallet,
        getPriceByTokenType(wallet.tokenType),
        erc20PricesMap,
      );
    },
    [getPriceByTokenType, erc20PricesMap],
  );

  const walletsWithBalance = useMemo(() => {
    if (!wallets.length) return [];

    return wallets.map((wallet, i) => ({
      ...wallet,
      lastBalanceInTokens: balanceQueries[i]?.data?.balance ?? undefined,
      erc20Tokens: balanceQueries[i]?.data?.tokens ?? [],
    }));
  }, [wallets, balanceQueries]);

  const walletsSortedByBalance = useMemo(() => {
    return [...walletsWithBalance].sort((a, b) => {
      return getWalletBalanceInCurrency(b) - getWalletBalanceInCurrency(a);
    });
  }, [walletsWithBalance, getWalletBalanceInCurrency]);

  const balancesInCurrency = useMemo(() => {
    const map: Record<string, number> = {};
    walletsWithBalance.forEach((wallet) => {
      map[wallet.id] = getWalletBalanceInCurrency(wallet);
    });
    return map;
  }, [walletsWithBalance, getWalletBalanceInCurrency]);

  return {
    ...query,
    walletsSortedByBalance,
    balancesInCurrency,
    getWalletBalanceInCurrency,
    erc20PricesMap,
  };
}
