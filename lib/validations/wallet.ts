import { z } from "zod";

export const createWalletSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  portfolioId: z.string().uuid(),
});

export const walletStep1Schema = z.object({
  name: z.string().min(1).max(50).trim(),
  cryptocurrency: z.enum(["BTC", "ETH", "USDC"]),
});

const XPUB_PATTERNS = {
  xpub: /^xpub[1-9A-HJ-NP-Za-km-z]{107}$/,
  ypub: /^ypub[1-9A-HJ-NP-Za-km-z]{107}$/,
  zpub: /^zpub[1-9A-HJ-NP-Za-km-z]{107}$/,
};

export function detectBipType(publicKey: string): string | null {
  if (XPUB_PATTERNS.xpub.test(publicKey)) return "BIP44";
  if (XPUB_PATTERNS.ypub.test(publicKey)) return "BIP49";
  if (XPUB_PATTERNS.zpub.test(publicKey)) return "BIP84";
  return null;
}

export const bitcoinWalletSchema = z.object({
  publicKey: z
    .string()
    .min(1, "Extended public key is required")
    .refine(
      (value) =>
        XPUB_PATTERNS.xpub.test(value) ||
        XPUB_PATTERNS.ypub.test(value) ||
        XPUB_PATTERNS.zpub.test(value),
      {
        message:
          "Invalid extended public key format. Must be valid xpub, ypub, or zpub.",
      },
    ),

  bipType: z.enum(["BIP44", "BIP49", "BIP84", "BIP86"]),
});

export const addBtcAssetSchema = z.object({
  walletId: z.string().uuid(),
  publicKey: z
    .string()
    .min(1)
    .refine(
      (value) =>
        XPUB_PATTERNS.xpub.test(value) ||
        XPUB_PATTERNS.ypub.test(value) ||
        XPUB_PATTERNS.zpub.test(value),
      { message: "Invalid extended public key format." },
    ),
  bipType: z.enum(["BIP44", "BIP49", "BIP84", "BIP86"]),
});

export const addEthAssetSchema = z.object({
  walletId: z.string().uuid(),
  publicKey: z
    .string()
    .min(1)
    .regex(/^0x[a-fA-F0-9]{40}$/),
});

export const createBitcoinWalletSchema = walletStep1Schema
  .extend(bitcoinWalletSchema.shape)
  .extend({
    portfolioId: z.string().uuid(),
  });

export const ethereumWalletSchema = z.object({
  publicKey: z
    .string()
    .min(1, "Ethereum address is required")
    .regex(
      /^0x[a-fA-F0-9]{40}$/,
      "Invalid Ethereum address. Must be a 42-character hex string starting with 0x.",
    ),
});

export const createEthereumWalletSchema = walletStep1Schema
  .extend(ethereumWalletSchema.shape)
  .extend({
    portfolioId: z.string().uuid(),
  });

export type WalletStep1Data = z.infer<typeof walletStep1Schema>;
export type BitcoinWalletData = z.infer<typeof bitcoinWalletSchema>;
export type CreateBitcoinWalletData = z.infer<typeof createBitcoinWalletSchema>;
export type EthereumWalletData = z.infer<typeof ethereumWalletSchema>;
export type CreateEthereumWalletData = z.infer<typeof createEthereumWalletSchema>;
