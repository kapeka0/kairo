"use server";

import { and, eq } from "drizzle-orm";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

import {
  deleteWalletById,
  getWalletByIdAndTokenType,
} from "@/lib/db/data/wallet";
import { db } from "@/lib/db/db";
import { bitcoinWallet, ethereumWallet, portfolio } from "@/lib/db/schema";
import { authActionClient } from "@/lib/safe-actions";
import { btcBlockbook, ethBlockbook } from "@/lib/services/blockbook";
import { TokenType, type BipType } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { toDescriptor } from "@/lib/utils/bitcoin";
import {
  createBitcoinWalletSchema,
  createEthereumWalletSchema,
} from "@/lib/validations/wallet";

export const createBitcoinWallet = authActionClient
  .metadata({ actionName: "createBitcoinWallet" })
  .inputSchema(createBitcoinWalletSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { name, publicKey, bipType, portfolioId } = parsedInput;

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

    const walletId = generateUUID();
    const gradientUrl = `https://avatar.vercel.sh/${walletId}.svg?gradient=true`;

    const newWallet = await db
      .insert(bitcoinWallet)
      .values({
        id: walletId,
        name,
        gradientUrl,
        publicKey,
        bipType,
        portfolioId,
      })
      .returning();

    return { success: true, wallet: newWallet[0] };
  });

export const createEthereumWallet = authActionClient
  .metadata({ actionName: "createEthereumWallet" })
  .inputSchema(createEthereumWalletSchema)
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

    const existingWallet = await db.query.ethereumWallet.findFirst({
      where: and(
        eq(ethereumWallet.publicKey, publicKey),
        eq(ethereumWallet.portfolioId, portfolioId),
      ),
    });

    if (existingWallet) {
      returnValidationErrors(createEthereumWalletSchema, {
        publicKey: {
          _errors: ["This wallet is already added to your portfolio"],
        },
      });
    }

    const walletId = generateUUID();
    const gradientUrl = `https://avatar.vercel.sh/${walletId}.svg?gradient=true`;

    const newWallet = await db
      .insert(ethereumWallet)
      .values({
        id: walletId,
        name,
        gradientUrl,
        publicKey,
        portfolioId,
      })
      .returning();

    return { success: true, wallet: newWallet[0] };
  });

export const updateWalletIcon = authActionClient
  .metadata({ actionName: "updateWalletIcon" })
  .inputSchema(
    z.object({
      walletId: z.string().uuid(),
      icon: z.string().nullable(),
      tokenType: z.nativeEnum(TokenType).optional().default(TokenType.BTC),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { walletId, icon, tokenType } = parsedInput;

    if (tokenType === TokenType.ETH) {
      const wallet = await db.query.ethereumWallet.findFirst({
        where: eq(ethereumWallet.id, walletId),
        with: { portfolio: true },
      });

      if (!wallet || wallet.portfolio.userId !== ctx.user.id) {
        throw new Error("Wallet not found or does not belong to the user");
      }

      await db
        .update(ethereumWallet)
        .set({ icon })
        .where(eq(ethereumWallet.id, walletId));
    } else {
      const wallet = await db.query.bitcoinWallet.findFirst({
        where: eq(bitcoinWallet.id, walletId),
        with: { portfolio: true },
      });

      if (!wallet || wallet.portfolio.userId !== ctx.user.id) {
        throw new Error("Wallet not found or does not belong to the user");
      }

      await db
        .update(bitcoinWallet)
        .set({ icon })
        .where(eq(bitcoinWallet.id, walletId));
    }

    return { success: true };
  });

export const refreshWalletBalance = authActionClient
  .metadata({ actionName: "refreshWalletBalance" })
  .inputSchema(
    z.object({
      walletId: z.string().uuid(),
      tokenType: z.nativeEnum(TokenType).optional().default(TokenType.BTC),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { walletId, tokenType } = parsedInput;

    if (tokenType === TokenType.ETH) {
      const wallet = await db.query.ethereumWallet.findFirst({
        where: eq(ethereumWallet.id, walletId),
        with: { portfolio: true },
      });

      if (!wallet || wallet.portfolio.userId !== ctx.user.id) {
        throw new Error("Wallet not found");
      }

      const blockbookData = await ethBlockbook.fetchBalance(wallet.publicKey);
      return { success: true, balance: blockbookData.balance };
    } else {
      const wallet = await db.query.bitcoinWallet.findFirst({
        where: eq(bitcoinWallet.id, walletId),
        with: { portfolio: true },
      });

      if (!wallet || wallet.portfolio.userId !== ctx.user.id) {
        throw new Error("Wallet not found");
      }

      const blockbookData = await btcBlockbook.fetchBalance(
        toDescriptor(wallet.publicKey, wallet.bipType as BipType),
      );
      return { success: true, balance: blockbookData.balance };
    }
  });

export const deleteWallet = authActionClient
  .metadata({ actionName: "deleteWallet" })
  .inputSchema(
    z.object({
      walletId: z.string().uuid(),
      tokenType: z.nativeEnum(TokenType),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { walletId, tokenType } = parsedInput;
    const wallet = await getWalletByIdAndTokenType(walletId, tokenType);

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    if (wallet.portfolio.userId !== ctx.user.id) {
      throw new Error("Unauthorized: Wallet does not belong to user");
    }

    await deleteWalletById(walletId, tokenType);

    return { success: true };
  });
