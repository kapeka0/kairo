import { updateWalletBalance } from "@/lib/actions/wallet";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { TokenType, Wallet } from "../types";
import { devLog } from "../utils";
import { calculateWalletBalanceInCurrency } from "../utils/balance";
import { useBlockbookWebSocket } from "./useBlockbookWebSocket";
import { useTokenStats } from "./useTokenStats";

interface UseWalletsResult {
  wallets: Wallet[];
}

const WALLETS_BALLANCE_STALE_TIME_IN_MS = 60 * 1000; // 1 minute

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
  const [walletsSortedByBalance, setWalletsSortedByBalance] = useState<
    Wallet[]
  >([]);
  const [balancesInCurrency, setBalancesInCurrency] = useState<
    Record<string, number>
  >({});
  const { btcPrice } = useTokenStats();
  const queryClient = useQueryClient();
  const { isConnected, getAccountInfo } = useBlockbookWebSocket();
  const query = useQuery({
    queryKey: ["wallets", portfolioId],
    queryFn: () => fetchWallets(portfolioId),
    enabled: !!portfolioId,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  const { execute: executeUpdateBalance } = useAction(updateWalletBalance, {
    onError: (e) => {
      devLog("Failed to update wallet balance:", e.error.serverError);
      queryClient.invalidateQueries({ queryKey: ["wallets", portfolioId] });
    },
  });
  const walletsRef = useRef<Wallet[]>([]);
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

          return response.balance;
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

  const refreshWalletBalanceWithHTTP = useCallback(
    async (wallet: Wallet) => {
      try {
        const { data } = await axios.get(`/api/wallet/${wallet.id}/balance`);

        queryClient.setQueryData(["wallets", portfolioId], (oldData: any) => {
          if (!oldData?.wallets) return oldData;

          return {
            ...oldData,
            wallets: oldData.wallets.map((w: Wallet) =>
              w.id === wallet.id
                ? {
                    ...w,
                    lastBalanceInTokens: data.balance,
                    lastBalanceInTokensUpdatedAt: new Date().toISOString(),
                  }
                : w,
            ),
          };
        });

        return data.balance;
      } catch (error) {
        devLog("Failed to refresh wallet balance:", error);
        queryClient.invalidateQueries({ queryKey: ["wallets", portfolioId] });
      }
    },
    [portfolioId, queryClient],
  );

  const refreshWalletBalanceWithFallback = useCallback(
    async (wallet: Wallet) => {
      let newBalance: string | undefined;
      if (isConnected) {
        devLog(
          `[WS] Attempting to refresh balance for wallet ${wallet.name} via WebSocket`,
        );
        newBalance = await refreshWalletBalanceWS(wallet);
      } else {
        devLog(
          `[WS] Not connected, using API route to refresh balance for wallet ${wallet.name}`,
        );
        newBalance = await refreshWalletBalanceWithHTTP(wallet);
      }
      if (newBalance)
        executeUpdateBalance({
          walletId: wallet.id,
          tokenType: wallet.tokenType,
          balance: newBalance,
        });
    },
    [
      isConnected,
      refreshWalletBalanceWS,
      refreshWalletBalanceWithHTTP,
      executeUpdateBalance,
    ],
  );

  const getWalletBalanceInCurrency = useCallback(
    (wallet: Wallet): number => {
      if (!wallet) return 0;

      switch (wallet.tokenType) {
        case TokenType.BTC:
          return calculateWalletBalanceInCurrency(wallet, btcPrice);
        case TokenType.ETH:
          return 0;
        default:
          return 0;
      }
    },
    [btcPrice],
  );

  useEffect(() => {
    if (query.data?.wallets) {
      walletsRef.current = query.data.wallets;
    }
  }, [query.data?.wallets]);

  useEffect(() => {
    if (query.data?.wallets) {
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
  }, [query.data?.wallets, btcPrice, getWalletBalanceInCurrency]);

  useEffect(() => {
    if (!portfolioId) return;
    const checkStaleWallets = () => {
      const wallets = walletsRef.current;
      if (!wallets.length) return;

      devLog("Checking for stale wallet balances...");
      const now = Date.now();

      wallets.forEach((wallet) => {
        const lastUpdate = new Date(
          wallet.lastBalanceInTokensUpdatedAt,
        ).getTime();

        const isStale = now - lastUpdate > WALLETS_BALLANCE_STALE_TIME_IN_MS;

        if (isStale) {
          devLog(`Balance for wallet ${wallet.name} is stale, refreshing...`);
          refreshWalletBalanceWithFallback(wallet);
        }
      });
    };
    // Execute immediately and then every minute
    checkStaleWallets();
    const interval = setInterval(
      checkStaleWallets,
      WALLETS_BALLANCE_STALE_TIME_IN_MS,
    );

    return () => clearInterval(interval);
  }, [portfolioId, refreshWalletBalanceWithFallback]);

  return {
    ...query,
    walletsSortedByBalance,
    balancesInCurrency,
    getWalletBalanceInCurrency,
    refreshWalletBalanceWithFallback,
  };
}
