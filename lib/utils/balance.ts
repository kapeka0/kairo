import { Wallet } from "../types";
import { getTokenMetadata } from "./token-metadata";

export function calculateWalletBalanceInCurrency(
  wallet: Wallet,
  tokenPrice: number | undefined,
): number {
  if (!tokenPrice) return 0;
  if (!wallet.lastBalanceInTokens) return 0;

  const tokenMetadata = getTokenMetadata(wallet.tokenType);
  const decimals = tokenMetadata.decimals;

  const tokenAmount = parseInt(wallet.lastBalanceInTokens) / Math.pow(10, decimals);
  return tokenAmount * tokenPrice;
}

export function satoshisToBtc(satoshis: string): number {
  return parseInt(satoshis || "0") / 1e8;
}
