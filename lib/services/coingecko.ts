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

export const getHistoricalTokenPrices = async (
  tokenType: TokenType,
  days: number,
): Promise<Map<string, number>> => {
  const tokenMetadata = getTokenMetadata(tokenType);
  const response = await coingeckoClient.coins.marketChart.get(
    tokenMetadata.coingeckoId,
    {
      vs_currency: "usd",
      days: days.toString(),
    },
  );

  const prices = response.prices ?? [];
  const dailyMap = new Map<string, number>();

  for (const [timestamp, price] of prices) {
    const date = new Date(timestamp).toISOString().slice(0, 10);
    dailyMap.set(date, price);
  }

  return dailyMap;
};
