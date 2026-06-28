import { Wallet } from "../types";
import { getTokenMetadata } from "./token-metadata";

export function calculateWalletBalanceInCurrency(
  wallet: Wallet,
  tokenPrice: number | undefined,
  erc20Prices?: Record<string, number>,
): number {
  let total = 0;

  if (tokenPrice && wallet.lastBalanceInTokens) {
    const tokenMetadata = getTokenMetadata(wallet.tokenType);
    const tokenAmount = parseInt(wallet.lastBalanceInTokens) / Math.pow(10, tokenMetadata.decimals);
    total += tokenAmount * tokenPrice;
  }

  if (erc20Prices && wallet.erc20Tokens) {
    for (const token of wallet.erc20Tokens) {
      const price = erc20Prices[token.symbol.toUpperCase()];
      if (price !== undefined && token.balance) {
        const amount = parseInt(token.balance) / Math.pow(10, token.decimals);
        total += amount * price;
      }
    }
  }

  return total;
}

export function satoshisToBtc(satoshis: string): number {
  return parseInt(satoshis || "0") / 1e8;
}
