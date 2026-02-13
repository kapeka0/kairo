import { useQuery } from "@tanstack/react-query";

interface Wallet {
  id: string;
  name: string;
  gradientUrl: string;
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
  const response = await fetch(`/api/wallets/${portfolioId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch wallets");
  }

  return response.json();
}

export function useWallets(portfolioId: string) {
  return useQuery({
    queryKey: ["wallets", portfolioId],
    queryFn: () => fetchWallets(portfolioId),
    enabled: !!portfolioId,
  });
}
