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

export const updateBitcoinWalletBalanceById = async function (
  walletId: string,
  balanceInSatoshis: string,
) {
  await db
    .update(bitcoinWallet)
    .set({
      lastBalanceInSatoshis: balanceInSatoshis,
      lastBalanceInSatoshisUpdatedAt: new Date(),
    })
    .where(eq(bitcoinWallet.id, walletId));
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

export const updateWalletBalance = async (
  walletId: string,
  tokenType: TokenType,
  balance: string,
) => {
  switch (tokenType) {
    case TokenType.BTC:
      await updateBitcoinWalletBalanceById(walletId, balance);
      break;
    case TokenType.ETH:
      throw new Error("ETH not yet supported");
    default:
      throw new Error(`Unsupported token type: ${tokenType}`);
  }
};
