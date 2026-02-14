import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { devLog } from "../utils";

interface Wallet {
  id: string;
  name: string;
  gradientUrl: string;
  icon: string | null;
  publicKey: string;
  derivationPath: string;
  portfolioId: string;
  lastBalance: string;
  balanceUpdatedAt: Date;
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

export function useWallets(portfolioId: string) {
  return useQuery({
    queryKey: ["wallets", portfolioId],
    queryFn: () => fetchWallets(portfolioId),
    enabled: !!portfolioId,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
