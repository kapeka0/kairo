import { TokenType } from "../types";

export interface TokenMetadata {
  coingeckoId: string;
  decimals: number;
  symbol: string;
  name: string;
  logoPath: string;
}

export const TOKEN_METADATA: Record<TokenType, TokenMetadata> = {
  [TokenType.BTC]: {
    coingeckoId: "bitcoin",
    decimals: 8,
    symbol: "BTC",
    name: "Bitcoin",
    logoPath: "/images/logos/crypto/btc.svg",
  },
  [TokenType.ETH]: {
    coingeckoId: "ethereum",
    decimals: 18,
    symbol: "ETH",
    name: "Ethereum",
    logoPath: "/images/logos/crypto/eth.svg",
  },
};

export function getTokenMetadata(tokenType: TokenType): TokenMetadata {
  return TOKEN_METADATA[tokenType];
}
