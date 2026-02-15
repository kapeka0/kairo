import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { activePortfolioBalanceInUserCurrencyAtom } from "../atoms/ActivePortfolio";
import { TokenType, Wallet } from "../types";
import { devLog } from "../utils";
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

async function refreshWalletBalance(walletId: string) {
  try {
    await axios.post(`/api/bitcoin/balance/${walletId}`);
  } catch (error) {
    console.error("Failed to refresh wallet balance:", error);
  }
}

function getBTCWalletValueInCurrency(
  wallet: Wallet,
  tokenPrice: number | undefined,
): number {
  if (!tokenPrice) return 0;

  const btcAmount = parseInt(wallet.lastBalanceInTokens || "0") / 1e8;
  return btcAmount * tokenPrice;
}

export function useWallets(portfolioId: string) {
  const [walletsSortedByBalance, setWalletsSortedByBalance] = useState<
    Wallet[]
  >([]);
  const [balancesInCurrency, setBalancesInCurrency] = useState<
    Record<string, number>
  >({});
  const setActivePortfolioBalance = useSetAtom(
    activePortfolioBalanceInUserCurrencyAtom,
  );
  const { btcPrice } = useTokenStats();
  const query = useQuery({
    queryKey: ["wallets", portfolioId],
    queryFn: () => fetchWallets(portfolioId),
    enabled: !!portfolioId,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  const getWalletBalanceInCurrency = useCallback(
    (wallet: Wallet): number => {
      if (!wallet) return 0;

      switch (wallet.tokenType) {
        case TokenType.BTC:
          return getBTCWalletValueInCurrency(wallet, btcPrice);

        default:
          return 0;
      }
    },
    [btcPrice],
  );

  useEffect(() => {
    if (query.data?.wallets) {
      const totalInCurrency = query.data.wallets.reduce(
        (sum, wallet) => sum + getWalletBalanceInCurrency(wallet),
        0,
      );
      devLog("Total portfolio balance in user currency:", totalInCurrency);
      setActivePortfolioBalance(totalInCurrency);

      const sortedWallets = [...query.data.wallets].sort((a, b) => {
        const valueA = getWalletBalanceInCurrency(a);
        const valueB = getWalletBalanceInCurrency(b);
        return valueB - valueA;
      });
      setWalletsSortedByBalance(sortedWallets);

      const balancesMap: Record<string, number> = {};
      query.data.wallets.forEach((wallet) => {
        balancesMap[wallet.id] = getWalletBalanceInCurrency(wallet);
      });
      setBalancesInCurrency(balancesMap);
    }
  }, [
    query.data?.wallets,
    btcPrice,
    setActivePortfolioBalance,
    getWalletBalanceInCurrency,
  ]);

  useEffect(() => {
    if (query.data?.wallets) {
      // Check if any wallet's balance is stale (older than 1 minute) and refresh it
      const now = Date.now();
      const ONE_MINUTE = 1 * 60 * 1000;

      query.data.wallets.forEach((wallet) => {
        const lastUpdate = new Date(
          wallet.lastBalanceInTokensUpdatedAt,
        ).getTime();
        const isStale = now - lastUpdate > ONE_MINUTE;

        if (isStale) {
          devLog(`Wallet ${wallet.name} balance is stale. Refreshing...`);
          refreshWalletBalance(wallet.id);
        }
      });
    }
  }, [query.data]);

  return {
    ...query,
    walletsSortedByBalance,
    balancesInCurrency,
    getWalletBalanceInCurrency,
  };
}
