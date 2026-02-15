import { z } from "zod";
import { TokenType } from "@/lib/types";
import { CURRENCIES } from "@/lib/utils/constants";

export const updateWalletBalanceSchema = z.object({
  walletId: z.string().uuid("Invalid wallet ID format"),
  tokenType: z.nativeEnum(TokenType, {
    errorMap: () => ({
      message: `Token type must be one of: ${Object.values(TokenType).join(", ")}`
    }),
  }),
  balance: z
    .string()
    .regex(/^\d+$/, "Balance must be a numeric string")
    .refine(
      (val) => {
        try {
          const num = BigInt(val);
          return num >= BigInt(0);
        } catch {
          return false;
        }
      },
      { message: "Balance must be a non-negative integer" }
    ),
});

export const getTokenPriceSchema = z.object({
  currency: z
    .string()
    .refine(
      (val) => CURRENCIES.some((c) => c.coingeckoValue === val),
      {
        message: `Currency must be one of: ${CURRENCIES.map(c => c.coingeckoValue).join(", ")}`
      }
    ),
  tokenType: z.nativeEnum(TokenType, {
    errorMap: () => ({
      message: `Token type must be one of: ${Object.values(TokenType).join(", ")}`
    }),
  }),
});

export const walletIdParamSchema = z.object({
  walletId: z.string().uuid("Invalid wallet ID format"),
});

export const portfolioIdParamSchema = z.object({
  portfolioId: z.string().uuid("Invalid portfolio ID format"),
});

export type UpdateWalletBalanceInput = z.infer<typeof updateWalletBalanceSchema>;
export type GetTokenPriceInput = z.infer<typeof getTokenPriceSchema>;
export type WalletIdParam = z.infer<typeof walletIdParamSchema>;
export type PortfolioIdParam = z.infer<typeof portfolioIdParamSchema>;
