"use server";

import { and, eq } from "drizzle-orm";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

import { db } from "@/lib/db/db";
import { bitcoinWallet, portfolio } from "@/lib/db/schema";
import { authActionClient } from "@/lib/safe-actions";
import { createBitcoinWalletSchema } from "@/lib/validations/wallet";
import { generateUUID } from "@/lib/utils";

export const createBitcoinWallet = authActionClient
  .metadata({ actionName: "createBitcoinWallet" })
  .inputSchema(createBitcoinWalletSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { name, publicKey, derivationPath, portfolioId } = parsedInput;

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
        derivationPath,
        portfolioId,
      })
      .returning();

    return { success: true, wallet: newWallet[0], bipType: derivationPath };
  });

export const updateWalletIcon = authActionClient
  .metadata({ actionName: "updateWalletIcon" })
  .inputSchema(
    z.object({
      walletId: z.string().uuid(),
      icon: z.string().nullable(),
    })
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
