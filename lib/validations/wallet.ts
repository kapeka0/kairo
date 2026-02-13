import { z } from "zod";

export const walletStep1Schema = z.object({
  name: z.string().min(1).max(50).trim(),
  cryptocurrency: z.enum(["BTC"]),
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
      { message: "Invalid extended public key format. Must be valid xpub, ypub, or zpub." }
    ),
  derivationPath: z.enum(["BIP44", "BIP49", "BIP84", "BIP86"]),
});

export const createBitcoinWalletSchema = walletStep1Schema
  .extend(bitcoinWalletSchema.shape)
  .extend({
    portfolioId: z.string().uuid(),
  });

export type WalletStep1Data = z.infer<typeof walletStep1Schema>;
export type BitcoinWalletData = z.infer<typeof bitcoinWalletSchema>;
export type CreateBitcoinWalletData = z.infer<typeof createBitcoinWalletSchema>;
