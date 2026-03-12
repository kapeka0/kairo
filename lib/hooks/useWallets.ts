import { useQueries, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useCallback, useMemo } from "react";
import { Wallet } from "../types";
import { devLog } from "../utils";
import { calculateWalletBalanceInCurrency } from "../utils/balance";
import { useTokenStats } from "./useTokenStats";

interface UseWalletsResult {
  wallets: Wallet[];
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

export function useWallets(portfolioId: string) {
  const { getPriceByTokenType } = useTokenStats();
  const query = useQuery({
    queryKey: ["wallets", portfolioId],
    queryFn: () => fetchWallets(portfolioId),
    enabled: !!portfolioId,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  const wallets = useMemo(
    () => query.data?.wallets ?? [],
    [query.data?.wallets],
  );

  const balanceQueries = useQueries({
    queries: wallets.map((wallet) => ({
      queryKey: ["balance", wallet.id],
      queryFn: async () => {
        const { data } = await axios.get(`/api/wallet/${wallet.id}/balance`);
        return data.balance as string;
      },
      staleTime: 120_000, // 2 minutes
      enabled: !!portfolioId,
    })),
  });

  const getWalletBalanceInCurrency = useCallback(
    (wallet: Wallet): number => {
      if (!wallet) return 0;
      return calculateWalletBalanceInCurrency(
        wallet,
        getPriceByTokenType(wallet.tokenType),
      );
    },
    [getPriceByTokenType],
  );

  const walletsWithBalance = useMemo(() => {
    if (!wallets.length) return [];

    return wallets.map((wallet, i) => ({
      ...wallet,
      lastBalanceInTokens: balanceQueries[i]?.data ?? undefined,
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
  };
}
