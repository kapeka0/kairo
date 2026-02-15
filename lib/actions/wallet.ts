"use server";

import { and, eq } from "drizzle-orm";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

import {
  getBitcoinWalletById,
  getWalletByIdAndTokenType,
  updateBitcoinWalletBalanceById,
} from "@/lib/db/data/wallet";
import { db } from "@/lib/db/db";
import { bitcoinWallet, portfolio } from "@/lib/db/schema";
import { authActionClient } from "@/lib/safe-actions";
import {
  fetchAndStoreTransactions,
  fetchBlockbookBalance,
} from "@/lib/services/blockbook";
import { TokenType } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { createBitcoinWalletSchema } from "@/lib/validations/wallet";

export const createBitcoinWallet = authActionClient
  .metadata({ actionName: "createBitcoinWallet" })
  .inputSchema(createBitcoinWalletSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { name, publicKey, portfolioId } = parsedInput;

    const portfolioExists = await db.query.portfolio.findFirst({
      where: and(
        eq(portfolio.id, portfolioId),
        eq(portfolio.userId, ctx.user.id),
      ),
    });

    if (!portfolioExists) {
      throw new Error("Portfolio not found or does not belong to the user");
    }

    const existingWallet = await db.query.bitcoinWallet.findFirst({
      where: and(
        eq(bitcoinWallet.publicKey, publicKey),
        eq(bitcoinWallet.portfolioId, portfolioId),
      ),
    });

    if (existingWallet) {
      returnValidationErrors(createBitcoinWalletSchema, {
        publicKey: {
          _errors: ["This wallet is already added to your portfolio"],
        },
      });
    }

    let balance = "0";
    try {
      const blockbookData = await fetchBlockbookBalance(publicKey);
      balance = blockbookData.balance;
    } catch (error) {
      console.error("Failed to fetch initial balance:", error);
    }

    const walletId = generateUUID();
    const gradientUrl = `https://avatar.vercel.sh/${walletId}.svg?gradient=true`;

    const newWallet = await db
      .insert(bitcoinWallet)
      .values({
        id: walletId,
        name,
        gradientUrl,
        publicKey,
        portfolioId,
        lastBalanceInSatoshis: balance,
        lastBalanceInSatoshisUpdatedAt: new Date(),
      })
      .returning();

    if (balance !== "0") {
      fetchAndStoreTransactions(walletId, publicKey).catch((error) => {
        console.error("Failed to fetch initial transactions:", error);
      });
    }

    return { success: true, wallet: newWallet[0] };
  });

export const updateWalletIcon = authActionClient
  .metadata({ actionName: "updateWalletIcon" })
  .inputSchema(
    z.object({
      walletId: z.string().uuid(),
      icon: z.string().nullable(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { walletId, icon } = parsedInput;

    const wallet = await db.query.bitcoinWallet.findFirst({
      where: eq(bitcoinWallet.id, walletId),
      with: {
        portfolio: true,
      },
    });

    if (!wallet || wallet.portfolio.userId !== ctx.user.id) {
      throw new Error("Wallet not found or does not belong to the user");
    }

    await db
      .update(bitcoinWallet)
      .set({ icon })
      .where(eq(bitcoinWallet.id, walletId));

    return { success: true };
  });

export const refreshWalletBalance = authActionClient
  .metadata({ actionName: "refreshWalletBalance" })
  .inputSchema(z.object({ walletId: z.string().uuid() }))
  .action(async ({ parsedInput, ctx }) => {
    const { walletId } = parsedInput;

    const wallet = await db.query.bitcoinWallet.findFirst({
      where: eq(bitcoinWallet.id, walletId),
      with: { portfolio: true },
    });

    if (!wallet || wallet.portfolio.userId !== ctx.user.id) {
      throw new Error("Wallet not found");
    }

    const blockbookData = await fetchBlockbookBalance(wallet.publicKey);

    await db
      .update(bitcoinWallet)
      .set({
        lastBalanceInSatoshis: blockbookData.balance,
        lastBalanceInSatoshisUpdatedAt: new Date(),
      })
      .where(eq(bitcoinWallet.id, walletId));

    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const result = await fetchAndStoreTransactions(
        walletId,
        wallet.publicKey,
        page,
      );
      hasMore = result.hasMore;
      page++;
    }

    return { success: true, balance: blockbookData.balance };
  });

const updateWalletBalanceSchema = z.object({
  walletId: z.string().uuid(),
  tokenType: z.nativeEnum(TokenType),
  balance: z.string().regex(/^\d+$/),
});

export const updateWalletBalance = authActionClient
  .metadata({ actionName: "updateWalletBalance" })
  .inputSchema(updateWalletBalanceSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { walletId, tokenType, balance } = parsedInput;

    const wallet = await getWalletByIdAndTokenType(walletId, tokenType);

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    if (wallet.portfolio.userId !== ctx.user.id) {
      throw new Error("Unauthorized: Wallet does not belong to user");
    }

    switch (tokenType) {
      case TokenType.BTC:
        await updateBitcoinWalletBalanceById(walletId, balance);
        break;
      case TokenType.ETH:
        throw new Error("ETH support coming soon");
      default:
        throw new Error(`Unsupported token type: ${tokenType}`);
    }

    return {
      success: true,
      walletId,
      tokenType,
      balance,
      updatedAt: new Date().toISOString(),
    };
  });

const syncWalletTransactionsSchema = z.object({
  walletId: z.string().uuid(),
});

export const syncWalletTransactions = authActionClient
  .metadata({ actionName: "syncWalletTransactions" })
  .inputSchema(syncWalletTransactionsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { walletId } = parsedInput;

    const wallet = await getBitcoinWalletById(walletId);

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    if (wallet.portfolio.userId !== ctx.user.id) {
      throw new Error("Unauthorized: Wallet does not belong to user");
    }

    let totalTxCount = 0;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const result = await fetchAndStoreTransactions(
        walletId,
        wallet.publicKey,
        page,
      );
      hasMore = result.hasMore;
      totalTxCount += result.txCount;
      page++;
    }

    return {
      success: true,
      walletId,
      transactionCount: totalTxCount,
    };
  });
