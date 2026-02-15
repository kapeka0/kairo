"use server";
import Coingecko from "@coingecko/coingecko-typescript";
import { server_env } from "../env/server";
import { Currency } from "../utils/constants";

const coingeckoClient = new Coingecko({
  demoAPIKey: server_env.COINGECKO_API_KEY,
  // demoAPIKey: process.env['COINGECKO_DEMO_API_KEY'], // Optional, for Demo API access
  environment: "demo", // 'demo' to initialize the client with Demo API access
});

export const getBitcoinPrice = async ({
  currency = "usd",
}: {
  currency: Currency;
}) => {
  try {
    const response = await coingeckoClient.simple.price.get({
      vs_currencies: currency,
      ids: "bitcoin",
    });
    return (response.bitcoin as Record<Currency, number>)[currency];
  } catch (error) {
    console.error("Error fetching Bitcoin price from CoinGecko:", error);
    throw error;
  }
};
