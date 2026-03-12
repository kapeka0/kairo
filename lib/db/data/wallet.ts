import { TokenType } from "@/lib/types";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { bitcoinWallet } from "../schema";

export const getWalletsByPortfolioId = async (portfolioId: string) => {
  return await db.query.bitcoinWallet.findMany({
    where: eq(bitcoinWallet.portfolioId, portfolioId),
    orderBy: (wallet, { desc }) => [desc(wallet.createdAt)],
  });
};

export const getBitcoinWalletById = async (walletId: string) => {
  return await db.query.bitcoinWallet.findFirst({
    where: eq(bitcoinWallet.id, walletId),
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
      throw new Error("ETH not yet supported");
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
      throw new Error("ETH not yet supported");
    default:
      throw new Error(`Unsupported token type: ${tokenType}`);
  }
};
