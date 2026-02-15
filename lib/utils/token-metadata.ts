import { TokenType } from "../types";

export interface TokenMetadata {
  coingeckoId: string;
  decimals: number;
  symbol: string;
  name: string;
}

export const TOKEN_METADATA: Record<TokenType, TokenMetadata> = {
  [TokenType.BTC]: {
    coingeckoId: "bitcoin",
    decimals: 8,
    symbol: "BTC",
    name: "Bitcoin",
  },
  [TokenType.ETH]: {
    coingeckoId: "ethereum",
    decimals: 18,
    symbol: "ETH",
    name: "Ethereum",
  },
};

export function getTokenMetadata(tokenType: TokenType): TokenMetadata {
  return TOKEN_METADATA[tokenType];
}
