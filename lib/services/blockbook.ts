import { client_env } from "@/lib/env/client";
import axios from "axios";
import axiosRetry, { exponentialDelay } from "axios-retry";
import Bottleneck from "bottleneck";
import http from "http";
import https from "https";
import { devLog, getRealisticUserAgent } from "../utils";

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
  vin: Array<{
    addresses?: string[];
    isAddress: boolean;
    isOwn?: boolean;
    value?: string;
  }>;
  vout: Array<{ addresses?: string[]; value: string; isOwn?: boolean }>;
}

interface BlockbookEthToken {
  type: "ERC20" | "ERC721" | "ERC1155";
  name: string;
  contract: string;
  symbol: string;
  decimals: number;
  balance: string;
  transfers?: number;
}

interface BlockbookEthTransaction extends BlockbookTransaction {
  tokenTransfers?: Array<{
    type: "ERC20" | "ERC721" | "ERC1155";
    from: string;
    to: string;
    contract: string;
    name: string;
    symbol: string;
    decimals: number;
    value: string;
  }>;
  ethereumSpecific?: {
    status: number;
    nonce: number;
    gasLimit: number;
    gasUsed: number;
    gasPrice: string;
  };
}

interface BlockbookEthAddressResponse {
  address: string;
  balance: string;
  unconfirmedBalance: string;
  unconfirmedTxs: number;
  txs: number;
  nonTokenTxs?: number;
  nonce?: string;
  tokens?: BlockbookEthToken[];
  transactions?: BlockbookEthTransaction[];
}

export interface FormattedTransaction {
  txid: string;
  type: "received" | "sent" | "internal";
  amountInSatoshis: string;
  feeInSatoshis: string | null;
  blockTime: number;
  confirmations: number;
  externalAddresses: string[];
  walletId?: string;
  walletName?: string;
  walletIcon?: string | null;
  walletGradientUrl?: string;
  historicalPriceUsd?: number | null;
  tokenType?: string;
  tokenTransfers?: Array<{
    type: "ERC20" | "ERC721" | "ERC1155";
    from: string;
    to: string;
    contract: string;
    name: string;
    symbol: string;
    decimals: number;
    value: string;
  }>;
}

interface BlockbookBalanceHistoryEntry {
  time: number;
  txs: number;
  received: string;
  sent: string;
  sentToSelf: string;
  rates: { usd: number };
}

interface BlockbookServiceConfig {
  baseUrl: string;
  endpoint: "xpub" | "address";
  formatTransactions: (rawTxs: any[], walletAddress?: string) => FormattedTransaction[];
}

function formatBlockbookTransactions(
  rawTxs: BlockbookTransaction[],
): FormattedTransaction[] {
  return rawTxs.map((tx) => {
    const ownVoutSum = tx.vout
      .filter((v) => v.isOwn)
      .reduce((sum, v) => sum + BigInt(v.value), BigInt(0));
    const ownVinSum = tx.vin
      .filter((v) => v.isOwn && v.value)
      .reduce((sum, v) => sum + BigInt(v.value!), BigInt(0));

    let type: "received" | "sent" | "internal";
    let netAmount: bigint;
    if (ownVinSum > BigInt(0)) {
      type = "sent";
      netAmount = ownVinSum - ownVoutSum;
    } else if (ownVoutSum > BigInt(0)) {
      type = "received";
      netAmount = ownVoutSum;
    } else {
      type = "internal";
      netAmount = BigInt(0);
    }

    let externalAddresses: string[];
    if (type === "received") {
      externalAddresses = tx.vin
        .filter((v) => !v.isOwn)
        .flatMap((v) => v.addresses ?? []);
    } else if (type === "sent") {
      externalAddresses = tx.vout
        .filter((v) => !v.isOwn)
        .flatMap((v) => v.addresses ?? []);
    } else {
      externalAddresses = [];
    }

    return {
      txid: tx.txid,
      type,
      amountInSatoshis: netAmount.toString(),
      feeInSatoshis: tx.fees ?? null,
      blockTime: tx.blockTime ?? 0,
      confirmations: tx.confirmations,
      externalAddresses,
    };
  });
}

function formatEthBlockbookTransactions(
  rawTxs: BlockbookEthTransaction[],
  walletAddress?: string,
): FormattedTransaction[] {
  const addr = walletAddress?.toLowerCase() ?? "";
  return rawTxs.map((tx) => {
    const sender = tx.vin[0]?.addresses?.[0]?.toLowerCase();
    const receiver = tx.vout[0]?.addresses?.[0]?.toLowerCase();
    const amount = tx.vout[0]?.value ?? "0";

    let type: "received" | "sent" | "internal";
    let externalAddresses: string[];

    if (addr && sender === addr) {
      type = "sent";
      externalAddresses = receiver ? [tx.vout[0].addresses![0]] : [];
    } else if (addr && receiver === addr) {
      type = "received";
      externalAddresses = sender ? [tx.vin[0].addresses![0]] : [];
    } else {
      type = "internal";
      externalAddresses = [];
    }

    return {
      txid: tx.txid,
      type,
      amountInSatoshis: amount,
      feeInSatoshis: tx.fees ?? null,
      blockTime: tx.blockTime ?? 0,
      confirmations: tx.confirmations,
      externalAddresses,
      tokenTransfers: tx.tokenTransfers,
    };
  });
}

function createBlockbookService(config: BlockbookServiceConfig) {
  const client = axios.create({
    baseURL: config.baseUrl,
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

  axiosRetry(client, {
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
      if (!error.response) return true;
      const status = error.response.status;
      return [408, 429, 500, 502, 503, 504].includes(status);
    },
    shouldResetTimeout: true,
    onRetry: (retryCount, error, requestConfig) => {
      devLog(
        `[Blockbook Retry] Attempt ${retryCount} for ${requestConfig.url}`,
        error.message,
      );
    },
  });

  const rateLimiter = new Bottleneck({
    maxConcurrent: 3,
    minTime: 200,
    reservoir: 20,
    reservoirRefreshAmount: 20,
    reservoirRefreshInterval: 60 * 1000,
  });

  client.interceptors.request.use(async (cfg) => {
    cfg.headers["User-Agent"] = getRealisticUserAgent();
    await rateLimiter.schedule(() => Promise.resolve());
    return cfg;
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
        throw new Error("Circuit breaker is open. Blockbook service appears down.");
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
      devLog("[Blockbook Circuit] Opening circuit after 5 consecutive failures");
      circuitBreakerState = "open";
    }
  }

  const pendingRequests = new Map<string, Promise<any>>();

  async function fetchBalance(query: string) {
    checkCircuitBreaker();

    const requestKey = `balance:${query}`;
    if (pendingRequests.has(requestKey)) {
      devLog(`[Blockbook] Reusing pending request for ${query}`);
      return pendingRequests.get(requestKey)!;
    }

    const requestPromise = (async () => {
      try {
        devLog(`[Blockbook] Fetching balance for ${query}`);

        const params =
          config.endpoint === "xpub"
            ? { details: "basic" }
            : { details: "tokenBalances", secondary: "usd" };

        const response = await client.get<
          BlockbookXpubResponse | BlockbookEthAddressResponse
        >(`/api/v2/${config.endpoint}/${query}`, { params });

        recordSuccess();

        const data = response.data as any;
        return {
          balance: data.balance,
          unconfirmedBalance: data.unconfirmedBalance,
          totalReceived: data.totalReceived,
          totalSent: data.totalSent,
          txCount: data.txs,
          tokens: (data.tokens ?? []) as BlockbookEthToken[],
        };
      } catch (error) {
        recordFailure();
        devLog("[Blockbook]:", error);
        if (axios.isAxiosError(error)) {
          const retryCount = error.config?.["axios-retry"]?.retryCount || 0;
          if (error.response?.status === 404) {
            throw new Error("Invalid address or wallet not found on blockchain");
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
              }`,
            );
          }
          if (error.code === "ECONNABORTED") {
            throw new Error(
              `Request timeout${
                retryCount > 0 ? ` after ${retryCount + 1} attempts` : ""
              }`,
            );
          }
          throw new Error(
            `Blockbook API error: ${error.message}${
              retryCount > 0 ? ` (${retryCount + 1} attempts)` : ""
            }`,
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

  async function fetchBalanceHistory(
    query: string,
  ): Promise<BlockbookBalanceHistoryEntry[]> {
    checkCircuitBreaker();

    const requestKey = `balancehistory:${query}`;
    if (pendingRequests.has(requestKey)) {
      devLog(`[Blockbook] Reusing pending balance history request for ${query}`);
      return pendingRequests.get(requestKey)!;
    }

    const requestPromise = (async () => {
      try {
        devLog(`[Blockbook] Fetching balance history for ${query}`);

        const response = await client.get<BlockbookBalanceHistoryEntry[]>(
          `/api/v2/balancehistory/${query}`,
          { params: { fiatcurrency: "usd", groupBy: 86400 } },
        );

        recordSuccess();

        if (!Array.isArray(response.data)) {
          return [];
        }

        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return [];
        }
        recordFailure();
        devLog("[Blockbook Balance History]:", error);
        throw error;
      } finally {
        pendingRequests.delete(requestKey);
      }
    })();

    pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  }

  async function fetchTransactions(
    query: string,
    page: number = 1,
    pageSize: number = 25,
  ): Promise<{
    transactions: FormattedTransaction[];
    totalPages: number;
    txCount: number;
  }> {
    checkCircuitBreaker();

    const requestKey = `transactions:${query}:${page}:${pageSize}`;
    if (pendingRequests.has(requestKey)) {
      devLog(
        `[Blockbook] Reusing pending transaction request for ${query} page ${page}`,
      );
      return pendingRequests.get(requestKey)!;
    }

    const requestPromise = (async () => {
      try {
        const response = await client.get<
          BlockbookXpubResponse | BlockbookEthAddressResponse
        >(`/api/v2/${config.endpoint}/${query}`, {
          params: { details: "txs", page, pageSize },
          timeout: 60000,
        });

        const data = response.data as any;

        if (!data.transactions || data.transactions.length === 0) {
          recordSuccess();
          return { transactions: [], totalPages: 1, txCount: 0 };
        }

        const transactions = config.formatTransactions(data.transactions, query);
        const totalPages = Math.ceil(data.txs / pageSize);

        recordSuccess();

        return { transactions, totalPages, txCount: data.txs };
      } catch (error) {
        recordFailure();
        if (axios.isAxiosError(error)) {
          const retryCount = error.config?.["axios-retry"]?.retryCount || 0;
          devLog(
            `[Blockbook Transactions] Error fetching transactions (attempt ${
              retryCount + 1
            }):`,
            error.message,
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

  return { fetchBalance, fetchBalanceHistory, fetchTransactions };
}

export const btcBlockbook = createBlockbookService({
  baseUrl: client_env.NEXT_PUBLIC_BTC_HTTP_BLOCKBOOK_URL,
  endpoint: "xpub",
  formatTransactions: (txs) => formatBlockbookTransactions(txs),
});

export const ethBlockbook = createBlockbookService({
  baseUrl: client_env.NEXT_PUBLIC_ETH_HTTP_BLOCKBOOK_URL,
  endpoint: "address",
  formatTransactions: formatEthBlockbookTransactions,
});

export const fetchBlockbookBalance = (query: string) =>
  btcBlockbook.fetchBalance(query);

export const fetchWalletBalanceHistory = (query: string) =>
  btcBlockbook.fetchBalanceHistory(query);

export const fetchTransactions = (
  query: string,
  page?: number,
  pageSize?: number,
) => btcBlockbook.fetchTransactions(query, page, pageSize);
