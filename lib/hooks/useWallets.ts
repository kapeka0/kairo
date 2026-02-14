import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect } from "react";
import { devLog } from "../utils";

interface Wallet {
  id: string;
  name: string;
  gradientUrl: string;
  icon: string | null;
  publicKey: string;
  derivationPath: string;
  portfolioId: string;
  lastBalanceInSatoshis: string;
  lastBalanceInSatoshisUpdatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

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

export function useWallets(portfolioId: string) {
  const query = useQuery({
    queryKey: ["wallets", portfolioId],
    queryFn: () => fetchWallets(portfolioId),
    enabled: !!portfolioId,
    staleTime: 60 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data?.wallets) {
      const now = Date.now();
      const FIVE_MINUTES = 5 * 60 * 1000;

      query.data.wallets.forEach((wallet) => {
        const lastUpdate = new Date(wallet.lastBalanceInSatoshisUpdatedAt).getTime();
        const isStale = now - lastUpdate > FIVE_MINUTES;

        if (isStale) {
          refreshWalletBalance(wallet.id);
        }
      });
    }
  }, [query.data]);

  return query;
}
