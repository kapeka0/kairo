import { db } from "@/lib/db/db";
import { bitcoinTransaction } from "@/lib/db/schema";
import { client_env } from "@/lib/env/client";
import { convertToZpub } from "@/lib/utils/bitcoin";
import axios from "axios";
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

blockbookClient.interceptors.request.use((config) => {
  config.headers["User-Agent"] = getRealisticUserAgent();
  return config;
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
  vin: Array<{ addresses?: string[]; isAddress: boolean }>;
  vout: Array<{ addresses?: string[]; value: string }>;
}

export async function fetchBlockbookBalance(xpub: string) {
  try {
    const zpub = convertToZpub(xpub);
    devLog(`[Blockbook] Fetching balance for xpub ${xpub} (zpub: ${zpub})`);

    const response = await blockbookClient.get<BlockbookXpubResponse>(
      `/api/v2/xpub/${zpub}`,
      {
        params: { details: "basic" },
      },
    );

    devLog("[Blockbook] Balance fetched successfully");

    return {
      balance: response.data.balance,
      unconfirmedBalance: response.data.unconfirmedBalance,
      totalReceived: response.data.totalReceived,
      totalSent: response.data.totalSent,
      txCount: response.data.txs,
    };
  } catch (error) {
    devLog("[Blockbook]:", error);
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error("Invalid xpub or wallet not found on blockchain");
      }
      if (error.response?.status === 403) {
        throw new Error("Access denied by Blockbook API");
      }
      if (error.response?.status === 503) {
        throw new Error("Blockbook service temporarily unavailable");
      }
      if (error.code === "ECONNABORTED") {
        throw new Error("Blockbook request timeout");
      }
      throw new Error(`Blockbook API error: ${error.message}`);
    }
    throw new Error("Failed to fetch balance from Blockbook");
  }
}

export async function fetchAndStoreTransactions(
  walletId: string,
  xpub: string,
  page: number = 1,
): Promise<{ hasMore: boolean; txCount: number }> {
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
      },
    );

    if (
      !response.data.transactions ||
      response.data.transactions.length === 0
    ) {
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

    return { hasMore, txCount: newTransactions.length };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
}
