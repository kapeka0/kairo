import { eq } from "drizzle-orm";
import { db } from "../db";
import { wallet, walletAsset } from "../schema";

export type UnifiedWalletRow = {
  id: string;
  walletId: string;
  name: string;
  publicKey: string;
  tokenType: string;
  gradientUrl: string;
  icon: string | null;
  portfolioId: string;
  createdAt: Date;
  updatedAt: Date;
  bipType?: string | null;
};

export const getAllWalletsByPortfolioId = async (
  portfolioId: string,
): Promise<UnifiedWalletRow[]> => {
  const wallets = await db.query.wallet.findMany({
    where: eq(wallet.portfolioId, portfolioId),
    with: { assets: true },
    orderBy: (w, { desc }) => [desc(w.createdAt)],
  });

  return wallets.flatMap((w) =>
    w.assets.map((asset) => ({
      id: asset.id,
      walletId: w.id,
      name: w.name,
      gradientUrl: w.gradientUrl,
      icon: w.icon,
      publicKey: asset.publicKey,
      tokenType: asset.tokenType,
      bipType: asset.bipType,
      portfolioId: w.portfolioId,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    })),
  );
};

export const getWalletsByPortfolioId = getAllWalletsByPortfolioId;

export const getAssetById = async (assetId: string) => {
  return await db.query.walletAsset.findFirst({
    where: eq(walletAsset.id, assetId),
    with: { wallet: { with: { portfolio: true } } },
  });
};

export const getWalletById = async (walletId: string) => {
  return await db.query.wallet.findFirst({
    where: eq(wallet.id, walletId),
    with: { portfolio: true },
  });
};

export const deleteAssetById = async (assetId: string) => {
  const asset = await db.query.walletAsset.findFirst({
    where: eq(walletAsset.id, assetId),
  });

  if (!asset) return;

  await db.delete(walletAsset).where(eq(walletAsset.id, assetId));

  const remaining = await db.query.walletAsset.findMany({
    where: eq(walletAsset.walletId, asset.walletId),
  });

  if (remaining.length === 0) {
    await db.delete(wallet).where(eq(wallet.id, asset.walletId));
  }
};

export const deleteWalletById = async (walletId: string) => {
  await db.delete(wallet).where(eq(wallet.id, walletId));
};

export const isDuplicateAsset = async (
  portfolioId: string,
  publicKey: string,
): Promise<boolean> => {
  const wallets = await db.query.wallet.findMany({
    where: eq(wallet.portfolioId, portfolioId),
    with: { assets: true },
  });

  return wallets.some((w) =>
    w.assets.some(
      (a) => a.publicKey.toLowerCase() === publicKey.toLowerCase(),
    ),
  );
};
