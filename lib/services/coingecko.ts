"use server";
import Coingecko from "@coingecko/coingecko-typescript";
import { server_env } from "../env/server";
import { TokenType } from "../types";
import { Currency } from "../utils/constants";
import { getTokenMetadata } from "../utils/token-metadata";

export interface CoinMarketItem {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number | null;
  market_cap: number | null;
  total_volume: number | null;
  price_change_percentage_1h_in_currency: number | null;
  price_change_percentage_24h_in_currency: number | null;
  price_change_percentage_7d_in_currency: number | null;
  sparkline_in_7d: { price: number[] } | null;
}

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

export const getCoinsMarkets = async ({
  currency,
  portfolioCoinIds,
}: {
  currency: string;
  portfolioCoinIds: string[];
}): Promise<CoinMarketItem[]> => {
  const response = await coingeckoClient.coins.markets.get({
    vs_currency: currency,
    category: "layer-1",
    order: "market_cap_desc",
    per_page: 15,
    page: 1,
    sparkline: true,
    price_change_percentage: "1h,24h,7d",
  }) as unknown as CoinMarketItem[];

  const portfolioSet = new Set(portfolioCoinIds);
  const portfolioCoins = response
    .filter((c) => portfolioSet.has(c.id))
    .sort((a, b) => (b.total_volume ?? 0) - (a.total_volume ?? 0));
  const otherCoins = response.filter((c) => !portfolioSet.has(c.id));

  return [...portfolioCoins, ...otherCoins].slice(0, 10);
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
