import axios from "axios";
import {
  CurrencyCode,
  FrankfurterResponse,
  FrankfurterTimeSeriesResponse,
} from "@/lib/types";

const frankfurterClient = axios.create({
  baseURL: "https://api.frankfurter.dev/v1",
  timeout: 10000,
  headers: { Accept: "application/json" },
});

export async function getLatestRates(
  base: CurrencyCode,
  symbols: CurrencyCode[],
): Promise<FrankfurterResponse> {
  const { data } = await frankfurterClient.get<FrankfurterResponse>("/latest", {
    params: { base, symbols: symbols.join(",") },
  });
  return data;
}

export async function getTimeSeries(
  startDate: string,
  endDate: string,
  base: CurrencyCode,
  symbols: CurrencyCode[],
): Promise<FrankfurterTimeSeriesResponse> {
  const { data } = await frankfurterClient.get<FrankfurterTimeSeriesResponse>(
    `/${startDate}..${endDate}`,
    { params: { base, symbols: symbols.join(",") } },
  );
  return data;
}
