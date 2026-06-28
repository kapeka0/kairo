import { TokenType } from "@/lib/types";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { bitcoinWallet, ethereumWallet } from "../schema";

export type UnifiedWalletRow = {
  id: string;
  name: string;
  publicKey: string;
  tokenType: string;
  gradientUrl: string;
  icon: string | null;
  portfolioId: string;
  createdAt: Date;
  updatedAt: Date;
  bipType?: string;
};

export const getWalletsByPortfolioId = async (portfolioId: string) => {
  return await db.query.bitcoinWallet.findMany({
    where: eq(bitcoinWallet.portfolioId, portfolioId),
    orderBy: (wallet, { desc }) => [desc(wallet.createdAt)],
  });
};

export const getAllWalletsByPortfolioId = async (
  portfolioId: string,
): Promise<UnifiedWalletRow[]> => {
  const [btcWallets, ethWallets] = await Promise.all([
    db.query.bitcoinWallet.findMany({
      where: eq(bitcoinWallet.portfolioId, portfolioId),
      orderBy: (wallet, { desc }) => [desc(wallet.createdAt)],
    }),
    db.query.ethereumWallet.findMany({
      where: eq(ethereumWallet.portfolioId, portfolioId),
      orderBy: (wallet, { desc }) => [desc(wallet.createdAt)],
    }),
  ]);

  return [
    ...btcWallets.map((w) => ({ ...w, bipType: w.bipType })),
    ...ethWallets.map((w) => ({ ...w, bipType: undefined })),
  ];
};

export const getBitcoinWalletById = async (walletId: string) => {
  return await db.query.bitcoinWallet.findFirst({
    where: eq(bitcoinWallet.id, walletId),
    with: {
      portfolio: true,
    },
  });
};

export const getEthereumWalletById = async (walletId: string) => {
  return await db.query.ethereumWallet.findFirst({
    where: eq(ethereumWallet.id, walletId),
    with: {
      portfolio: true,
    },
  });
};

export const getWalletByIdAndTokenType = async (
  walletId: string,
  tokenType: TokenType,
) => {
  switch (tokenType) {
    case TokenType.BTC:
      return await getBitcoinWalletById(walletId);
    case TokenType.ETH:
      return await getEthereumWalletById(walletId);
    default:
      throw new Error(`Unsupported token type: ${tokenType}`);
  }
};

export const deleteWalletById = async (
  walletId: string,
  tokenType: TokenType,
) => {
  switch (tokenType) {
    case TokenType.BTC:
      await db.delete(bitcoinWallet).where(eq(bitcoinWallet.id, walletId));
      break;
    case TokenType.ETH:
      await db.delete(ethereumWallet).where(eq(ethereumWallet.id, walletId));
      break;
    default:
      throw new Error(`Unsupported token type: ${tokenType}`);
  }
};
