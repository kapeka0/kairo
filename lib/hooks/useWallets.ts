import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { activePortfolioBalanceInUserCurrencyAtom } from "../atoms/ActivePortfolio";
import { TokenType, Wallet } from "../types";
import { devLog } from "../utils";
import { useBlockbookWebSocket } from "./useBlockbookWebSocket";
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

async function refreshWalletBalanceWithHTTP(walletId: string) {
  try {
    await axios.post(`/api/bitcoin/balance/${walletId}`);
  } catch (error) {
    devLog("Failed to refresh wallet balance:", error);
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
  const queryClient = useQueryClient();
  const { isConnected, getAccountInfo } = useBlockbookWebSocket();
  const query = useQuery({
    queryKey: ["wallets", portfolioId],
    queryFn: () => fetchWallets(portfolioId),
    enabled: !!portfolioId,
    staleTime: 60 * 60 * 1000,
  });

  const refreshWalletBalanceWS = useCallback(
    async (wallet: Wallet) => {
      try {
        devLog(`[WS] Fetching balance for wallet ${wallet.name} via WebSocket`);
        const response = await getAccountInfo(wallet.publicKey, {
          details: "basic",
          page: 1,
          pageSize: 1,
        });

        if (response?.balance !== undefined) {
          devLog(
            `[WS] Updated balance for wallet ${wallet.name}: ${response.balance}`,
          );

          queryClient.setQueryData(["wallets", portfolioId], (oldData: any) => {
            if (!oldData?.wallets) return oldData;

            return {
              ...oldData,
              wallets: oldData.wallets.map((w: Wallet) =>
                w.id === wallet.id
                  ? {
                      ...w,
                      lastBalanceInTokens: response.balance,
                      lastBalanceInTokensUpdatedAt: new Date().toISOString(),
                    }
                  : w,
              ),
            };
          });
        }
      } catch (error) {
        devLog(
          `[WS] Failed, falling back to API route for ${wallet.name}:`,
          error,
        );
        throw error;
      }
    },
    [getAccountInfo, portfolioId, queryClient],
  );

  const refreshWalletBalanceWithFallback = useCallback(
    async (wallet: Wallet) => {
      if (isConnected) {
        devLog(
          `[WS] Attempting to refresh balance for wallet ${wallet.name} via WebSocket`,
        );
        await refreshWalletBalanceWS(wallet);
      } else {
        devLog(
          `[WS] Not connected, using API route to refresh balance for wallet ${wallet.name}`,
        );
        await refreshWalletBalanceWithHTTP(wallet.id);
      }
    },
    [isConnected, refreshWalletBalanceWS],
  );
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
          refreshWalletBalanceWithFallback(wallet);
        }
      });
    }
  }, [query.data, refreshWalletBalanceWithFallback]);

  return {
    ...query,
    walletsSortedByBalance,
    balancesInCurrency,
    getWalletBalanceInCurrency,
    refreshWalletBalanceWithFallback,
  };
}
