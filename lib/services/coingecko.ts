"use server";
import Coingecko from "@coingecko/coingecko-typescript";
import { server_env } from "../env/server";
import { TokenType } from "../types";
import { Currency } from "../utils/constants";
import { getTokenMetadata } from "../utils/token-metadata";

const coingeckoClient = new Coingecko({
  demoAPIKey: server_env.COINGECKO_API_KEY,
  environment: "demo",
});

export const getTokenPrice = async ({
  tokenType,
  currency = "usd",
}: {
  tokenType: TokenType;
  currency: Currency;
}) => {
  try {
    const tokenMetadata = getTokenMetadata(tokenType);

    const response = await coingeckoClient.simple.price.get({
      vs_currencies: currency,
      ids: tokenMetadata.coingeckoId,
    });

    return (response[tokenMetadata.coingeckoId] as Record<Currency, number>)[currency];
  } catch (error) {
    console.error(`Error fetching ${tokenType} price from CoinGecko:`, error);
    throw error;
  }
};

export const getBitcoinPrice = async ({
  currency = "usd",
}: {
  currency: Currency;
}) => {
  return getTokenPrice({ tokenType: TokenType.BTC, currency });
};
