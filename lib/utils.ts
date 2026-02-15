import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import UserAgent from "user-agents";
import { v4 as uuidv4 } from "uuid";
import { BitcoinWallet, Wallet } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function devLog(...args: any[]) {
  if (process.env.NODE_ENV === "development") {
    console.log("[DEV]", ...args);
  }
}

export const generateUUID = (): string => {
  return uuidv4();
};

export function getRealisticUserAgent(): string {
  const deviceDistribution = [
    { type: "desktop", weight: 70 },
    { type: "mobile", weight: 25 },
    { type: "tablet", weight: 5 },
  ];

  const total = deviceDistribution.reduce((a, b) => a + b.weight, 0);
  const rand = Math.random();

  let acc = 0;
  let deviceCategory: "desktop" | "mobile" | "tablet" = "desktop";

  for (const entry of deviceDistribution) {
    acc += entry.weight / total;
    if (rand <= acc) {
      deviceCategory = entry.type as any;
      break;
    }
  }
  const ua = new UserAgent({
    deviceCategory,
  });

  return ua.toString();
}

export const mapBTCWalletToWallet = (wallet: BitcoinWallet): Wallet => ({
  id: wallet.id,
  name: wallet.name,
  gradientUrl: wallet.gradientUrl,
  icon: wallet.icon,
  publicKey: wallet.publicKey,
  portfolioId: wallet.portfolioId,
  lastBalanceInTokens: wallet.lastBalanceInSatoshis,
  lastBalanceInTokensUpdatedAt: wallet.lastBalanceInSatoshisUpdatedAt,
  createdAt: wallet.createdAt,
  updatedAt: wallet.updatedAt,
  tokenType: wallet.tokenType,
});
