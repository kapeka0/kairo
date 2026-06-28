"use server";

import { and, eq } from "drizzle-orm";
import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

import {
  deleteAssetById,
  deleteWalletById,
  getAssetById,
  getWalletById,
  isDuplicateAsset,
} from "@/lib/db/data/wallet";
import { db } from "@/lib/db/db";
import { portfolio, wallet, walletAsset } from "@/lib/db/schema";
import { authActionClient } from "@/lib/safe-actions";
import { btcBlockbook, ethBlockbook } from "@/lib/services/blockbook";
import { TokenType, type BipType } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { toDescriptor } from "@/lib/utils/bitcoin";
import {
  addBtcAssetSchema,
  addEthAssetSchema,
  createBitcoinWalletSchema,
  createEthereumWalletSchema,
  createWalletSchema,
} from "@/lib/validations/wallet";

export const createWallet = authActionClient
  .metadata({ actionName: "createWallet" })
  .inputSchema(createWalletSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { name, portfolioId } = parsedInput;

    const portfolioExists = await db.query.portfolio.findFirst({
      where: and(
        eq(portfolio.id, portfolioId),
        eq(portfolio.userId, ctx.user.id),
      ),
    });

    if (!portfolioExists) {
      throw new Error("Portfolio not found or does not belong to the user");
    }

    const walletId = generateUUID();
    const gradientUrl = `https://avatar.vercel.sh/${walletId}.svg?gradient=true`;

    const newWallet = await db
      .insert(wallet)
      .values({
        id: walletId,
        name,
        gradientUrl,
        portfolioId,
      })
      .returning();

    return { success: true, wallet: newWallet[0] };
  });

export const addBtcAsset = authActionClient
  .metadata({ actionName: "addBtcAsset" })
  .inputSchema(addBtcAssetSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { walletId, publicKey, bipType } = parsedInput;

    const parentWallet = await getWalletById(walletId);

    if (!parentWallet || parentWallet.portfolio.userId !== ctx.user.id) {
      throw new Error("Wallet not found or does not belong to the user");
    }

    const duplicate = await isDuplicateAsset(
      parentWallet.portfolioId,
      publicKey,
    );
    if (duplicate) {
      returnValidationErrors(addBtcAssetSchema, {
        publicKey: {
          _errors: ["This address is already added to your portfolio"],
        },
      });
    }

    const assetId = generateUUID();

    const newAsset = await db
      .insert(walletAsset)
      .values({
        id: assetId,
        walletId,
        tokenType: "BTC",
        publicKey,
        bipType,
      })
      .returning();

    return { success: true, asset: newAsset[0] };
  });

export const addEthAsset = authActionClient
  .metadata({ actionName: "addEthAsset" })
  .inputSchema(addEthAssetSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { walletId, publicKey } = parsedInput;

    const parentWallet = await getWalletById(walletId);

    if (!parentWallet || parentWallet.portfolio.userId !== ctx.user.id) {
      throw new Error("Wallet not found or does not belong to the user");
    }

    const duplicate = await isDuplicateAsset(
      parentWallet.portfolioId,
      publicKey,
    );
    if (duplicate) {
      returnValidationErrors(addEthAssetSchema, {
        publicKey: {
          _errors: ["This address is already added to your portfolio"],
        },
      });
    }

    const assetId = generateUUID();

    const newAsset = await db
      .insert(walletAsset)
      .values({
        id: assetId,
        walletId,
        tokenType: "ETH",
        publicKey,
      })
      .returning();

    return { success: true, asset: newAsset[0] };
  });

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

    const duplicate = await isDuplicateAsset(portfolioId, publicKey);
    if (duplicate) {
      returnValidationErrors(createBitcoinWalletSchema, {
        publicKey: {
          _errors: ["This wallet is already added to your portfolio"],
        },
      });
    }

    const walletId = generateUUID();
    const gradientUrl = `https://avatar.vercel.sh/${walletId}.svg?gradient=true`;

    const newWallet = await db
      .insert(wallet)
      .values({
        id: walletId,
        name,
        gradientUrl,
        portfolioId,
      })
      .returning();

    await db.insert(walletAsset).values({
      id: generateUUID(),
      walletId,
      tokenType: "BTC",
      publicKey,
      bipType,
    });

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

    const duplicate = await isDuplicateAsset(portfolioId, publicKey);
    if (duplicate) {
      returnValidationErrors(createEthereumWalletSchema, {
        publicKey: {
          _errors: ["This wallet is already added to your portfolio"],
        },
      });
    }

    const walletId = generateUUID();
    const gradientUrl = `https://avatar.vercel.sh/${walletId}.svg?gradient=true`;

    const newWallet = await db
      .insert(wallet)
      .values({
        id: walletId,
        name,
        gradientUrl,
        portfolioId,
      })
      .returning();

    await db.insert(walletAsset).values({
      id: generateUUID(),
      walletId,
      tokenType: "ETH",
      publicKey,
    });

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
    const { walletId: wId, icon } = parsedInput;

    const w = await getWalletById(wId);

    if (!w || w.portfolio.userId !== ctx.user.id) {
      throw new Error("Wallet not found or does not belong to the user");
    }

    await db.update(wallet).set({ icon }).where(eq(wallet.id, wId));

    return { success: true };
  });

export const refreshWalletBalance = authActionClient
  .metadata({ actionName: "refreshWalletBalance" })
  .inputSchema(
    z.object({
      assetId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { assetId } = parsedInput;

    const asset = await getAssetById(assetId);

    if (!asset || asset.wallet.portfolio.userId !== ctx.user.id) {
      throw new Error("Asset not found");
    }

    if (asset.tokenType === "ETH") {
      const blockbookData = await ethBlockbook.fetchBalance(asset.publicKey);
      return { success: true, balance: blockbookData.balance };
    } else {
      const blockbookData = await btcBlockbook.fetchBalance(
        toDescriptor(asset.publicKey, asset.bipType as BipType),
      );
      return { success: true, balance: blockbookData.balance };
    }
  });

export const deleteAsset = authActionClient
  .metadata({ actionName: "deleteAsset" })
  .inputSchema(
    z.object({
      assetId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { assetId } = parsedInput;
    const asset = await getAssetById(assetId);

    if (!asset) {
      throw new Error("Asset not found");
    }

    if (asset.wallet.portfolio.userId !== ctx.user.id) {
      throw new Error("Unauthorized: Asset does not belong to user");
    }

    await deleteAssetById(assetId);

    return { success: true };
  });

export const deleteWallet = authActionClient
  .metadata({ actionName: "deleteWallet" })
  .inputSchema(
    z.object({
      walletId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { walletId: wId } = parsedInput;
    const w = await getWalletById(wId);

    if (!w) {
      throw new Error("Wallet not found");
    }

    if (w.portfolio.userId !== ctx.user.id) {
      throw new Error("Unauthorized: Wallet does not belong to user");
    }

    await deleteWalletById(wId);

    return { success: true };
  });
