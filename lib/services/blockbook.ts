import { db } from "@/lib/db/db";
import { bitcoinTransaction } from "@/lib/db/schema";
import { client_env } from "@/lib/env/client";
import { convertToZpub } from "@/lib/utils/bitcoin";
import axios from "axios";
import { eq } from "drizzle-orm";
import { devLog, getRealisticUserAgent } from "../utils";

const BLOCKBOOK_BASE_URL = client_env.NEXT_PUBLIC_BTC_BLOCKBOOK_URL;

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
    const userAgent = getRealisticUserAgent();
    devLog(
      `[Blockbook] Fetching balance for xpub ${xpub} (zpub: ${zpub}) with user agent: ${userAgent}`,
    );
    const response = await axios.get<BlockbookXpubResponse>(
      `${BLOCKBOOK_BASE_URL}/api/v2/xpub/${zpub}`,
      {
        params: { details: "basic" },
        timeout: 30000,
        headers: {
          "User-Agent": userAgent,
          Accept: "application/json",
        },
      },
    );

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
    const userAgent = getRealisticUserAgent();

    const response = await axios.get<BlockbookXpubResponse>(
      `${BLOCKBOOK_BASE_URL}/api/v2/xpub/${zpub}`,
      {
        params: {
          details: "txs",
          page,
          pageSize: 1000,
        },
        timeout: 60000,
        headers: {
          "User-Agent": userAgent,
          Accept: "application/json",
        },
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
