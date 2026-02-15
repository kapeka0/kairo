import { db } from "@/lib/db/db";
import { bitcoinTransaction } from "@/lib/db/schema";
import { client_env } from "@/lib/env/client";
import { convertToZpub } from "@/lib/utils/bitcoin";
import axios from "axios";
import axiosRetry, { exponentialDelay } from "axios-retry";
import Bottleneck from "bottleneck";
import { eq } from "drizzle-orm";
import http from "http";
import https from "https";
import { devLog, getRealisticUserAgent } from "../utils";

const BLOCKBOOK_BASE_URL = client_env.NEXT_PUBLIC_BTC_HTTP_BLOCKBOOK_URL;

const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 30000,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 30000,
  rejectUnauthorized: true,
});

const blockbookClient = axios.create({
  baseURL: BLOCKBOOK_BASE_URL,
  timeout: 30000,
  httpAgent,
  httpsAgent,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    DNT: "1",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "cross-site",
  },
});

axiosRetry(blockbookClient, {
  retries: 3,
  retryDelay: (retryCount, error) => {
    const baseDelay = exponentialDelay(retryCount, error);
    const jitter = baseDelay * 0.25;
    const randomJitter = (Math.random() - 0.5) * 2 * jitter;
    const delay = Math.floor(baseDelay + randomJitter);

    devLog(`[Blockbook Retry] Waiting ${delay}ms before retry ${retryCount}`);
    return delay;
  },
  retryCondition: (error) => {
    if (!error.response) {
      return true;
    }

    const status = error.response.status;
    const retryableStatuses = [408, 429, 500, 502, 503, 504];

    return retryableStatuses.includes(status);
  },
  shouldResetTimeout: true,
  onRetry: (retryCount, error, requestConfig) => {
    devLog(
      `[Blockbook Retry] Attempt ${retryCount} for ${requestConfig.url}`,
      error.message
    );
  },
});

const rateLimiter = new Bottleneck({
  maxConcurrent: 5,
  minTime: 200,
  reservoir: 20,
  reservoirRefreshAmount: 20,
  reservoirRefreshInterval: 60 * 1000,
});

blockbookClient.interceptors.request.use(async (config) => {
  config.headers["User-Agent"] = getRealisticUserAgent();

  await rateLimiter.schedule(() => Promise.resolve());

  return config;
});

let circuitBreakerState: "closed" | "open" | "half-open" = "closed";
let failureCount = 0;
let lastFailureTime = 0;
const FAILURE_THRESHOLD = 5;
const CIRCUIT_OPEN_DURATION = 30000;

function checkCircuitBreaker(): void {
  if (circuitBreakerState === "open") {
    const now = Date.now();
    if (now - lastFailureTime >= CIRCUIT_OPEN_DURATION) {
      devLog("[Blockbook Circuit] Half-open, allowing test request");
      circuitBreakerState = "half-open";
    } else {
      throw new Error(
        "Circuit breaker is open. Blockbook service appears down."
      );
    }
  }
}

function recordSuccess(): void {
  if (circuitBreakerState === "half-open") {
    devLog("[Blockbook Circuit] Test request succeeded, closing circuit");
    circuitBreakerState = "closed";
  }
  failureCount = 0;
}

function recordFailure(): void {
  failureCount++;
  lastFailureTime = Date.now();

  if (failureCount >= FAILURE_THRESHOLD) {
    devLog(
      "[Blockbook Circuit] Opening circuit after 5 consecutive failures"
    );
    circuitBreakerState = "open";
  }
}

const pendingRequests = new Map<string, Promise<any>>();

interface BlockbookXpubResponse {
  address: string;
  balance: string;
  totalReceived: string;
  totalSent: string;
  unconfirmedBalance: string;
  unconfirmedTxs: number;
  txs: number;
  transactions?: BlockbookTransaction[];
}

interface BlockbookTransaction {
  txid: string;
  blockHeight?: number;
  blockTime?: number;
  confirmations: number;
  value: string;
  fees?: string;
  vin: Array<{ addresses?: string[]; isAddress: boolean }>;
  vout: Array<{ addresses?: string[]; value: string }>;
}

export async function fetchBlockbookBalance(xpub: string) {
  checkCircuitBreaker();

  const requestKey = `balance:${xpub}`;

  if (pendingRequests.has(requestKey)) {
    devLog(`[Blockbook] Reusing pending request for ${xpub}`);
    return pendingRequests.get(requestKey)!;
  }

  const requestPromise = (async () => {
    try {
      const zpub = convertToZpub(xpub);
      devLog(`[Blockbook] Fetching balance for xpub ${xpub} (zpub: ${zpub})`);

      const response = await blockbookClient.get<BlockbookXpubResponse>(
        `/api/v2/xpub/${zpub}`,
        {
          params: { details: "basic" },
        }
      );

      devLog("[Blockbook] Balance fetched successfully");

      recordSuccess();

      return {
        balance: response.data.balance,
        unconfirmedBalance: response.data.unconfirmedBalance,
        totalReceived: response.data.totalReceived,
        totalSent: response.data.totalSent,
        txCount: response.data.txs,
      };
    } catch (error) {
      recordFailure();

      devLog("[Blockbook]:", error);
      if (axios.isAxiosError(error)) {
        const retryCount = error.config?.["axios-retry"]?.retryCount || 0;

        if (error.response?.status === 404) {
          throw new Error("Invalid xpub or wallet not found on blockchain");
        }
        if (error.response?.status === 403) {
          throw new Error("Access denied by Blockbook API");
        }
        if (error.response?.status === 429) {
          throw new Error("Rate limit exceeded. Please try again in a moment.");
        }
        if (error.response?.status === 503) {
          throw new Error(
            `Blockbook service temporarily unavailable${
              retryCount > 0 ? ` (tried ${retryCount + 1} times)` : ""
            }`
          );
        }
        if (error.code === "ECONNABORTED") {
          throw new Error(
            `Request timeout${
              retryCount > 0 ? ` after ${retryCount + 1} attempts` : ""
            }`
          );
        }
        throw new Error(
          `Blockbook API error: ${error.message}${
            retryCount > 0 ? ` (${retryCount + 1} attempts)` : ""
          }`
        );
      }
      throw new Error("Failed to fetch balance from Blockbook");
    } finally {
      pendingRequests.delete(requestKey);
    }
  })();

  pendingRequests.set(requestKey, requestPromise);
  return requestPromise;
}

export async function fetchAndStoreTransactions(
  walletId: string,
  xpub: string,
  page: number = 1
): Promise<{ hasMore: boolean; txCount: number }> {
  checkCircuitBreaker();

  const requestKey = `transactions:${xpub}:${page}`;

  if (pendingRequests.has(requestKey)) {
    devLog(
      `[Blockbook] Reusing pending transaction request for ${xpub} page ${page}`
    );
    return pendingRequests.get(requestKey)!;
  }

  const requestPromise = (async () => {
    try {
      const zpub = convertToZpub(xpub);

      const response = await blockbookClient.get<BlockbookXpubResponse>(
        `/api/v2/xpub/${zpub}`,
        {
          params: {
            details: "txs",
            page,
            pageSize: 1000,
          },
          timeout: 60000,
        }
      );

      if (
        !response.data.transactions ||
        response.data.transactions.length === 0
      ) {
        recordSuccess();
        return { hasMore: false, txCount: 0 };
      }

      const existingTxids = await db
        .select({ txid: bitcoinTransaction.txid })
        .from(bitcoinTransaction)
        .where(eq(bitcoinTransaction.walletId, walletId));

      const existingSet = new Set(existingTxids.map((t) => t.txid));

      const newTransactions = response.data.transactions
        .filter((tx) => !existingSet.has(tx.txid))
        .map((tx) => {
          const value = BigInt(tx.value);
          let type: "received" | "sent" | "internal";
          if (value > BigInt(0)) type = "received";
          else if (value < BigInt(0)) type = "sent";
          else type = "internal";

          return {
            walletId,
            txid: tx.txid,
            blockHeight: tx.blockHeight?.toString() || null,
            confirmations: tx.confirmations.toString(),
            blockTime: tx.blockTime ? new Date(tx.blockTime * 1000) : null,
            type,
            amountInSatoshis: tx.value,
            feeInSatoshis: tx.fees || null,
          };
        });

      if (newTransactions.length > 0) {
        await db.insert(bitcoinTransaction).values(newTransactions);
      }

      const totalPages = Math.ceil(response.data.txs / 1000);
      const hasMore = page < totalPages;

      recordSuccess();

      return { hasMore, txCount: newTransactions.length };
    } catch (error) {
      recordFailure();

      if (axios.isAxiosError(error)) {
        const retryCount = error.config?.["axios-retry"]?.retryCount || 0;
        devLog(
          `[Blockbook Transactions] Error fetching transactions (attempt ${retryCount + 1}):`,
          error.message
        );

        if (error.response?.status === 429) {
          throw new Error("Rate limit exceeded while fetching transactions");
        }
        if (error.response?.status === 503) {
          throw new Error("Blockbook service temporarily unavailable");
        }
      } else {
        devLog("[Blockbook Transactions] Unexpected error:", error);
      }
      throw error;
    } finally {
      pendingRequests.delete(requestKey);
    }
  })();

  pendingRequests.set(requestKey, requestPromise);
  return requestPromise;
}
