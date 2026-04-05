"use server";

import { returnValidationErrors } from "next-safe-action";
import { z } from "zod";

import { existsPortfolioByIdAndUserId } from "@/lib/db/data/portfolio";
import { db } from "@/lib/db/db";
import { portfolio } from "@/lib/db/schema";
import { authActionClient } from "@/lib/safe-actions";
import { and, eq } from "drizzle-orm";

const createPortfolioSchema = z.object({
  name: z.string().min(1).max(50),
  currency: z.enum(["USD", "EUR", "GBP", "JPY", "CNY"]),
});

export const createPortfolio = authActionClient
  .metadata({ actionName: "createPortfolio" })
  .inputSchema(createPortfolioSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { name, currency } = parsedInput;
    const userId = ctx.user.id;

    const gradientUrl = `https://avatar.vercel.sh/${encodeURIComponent(
      name,
    )}.svg?gradient=true`;

    try {
      const newPortfolio = await db
        .insert(portfolio)
        .values({
          name,
          gradientUrl,
          currency,
          userId,
        })
        .returning();

      return { success: true, portfolio: newPortfolio[0] };
    } catch (error) {
      if (error instanceof Error && error.message.includes("duplicate")) {
        returnValidationErrors(createPortfolioSchema, {
          name: { _errors: ["A portfolio with this name already exists"] },
        });
      }
      throw error;
    }
  });

const updatePortfolioNameSchema = z.object({
  portfolioId: z.string().uuid(),
  name: z.string().min(1).max(50),
});

export const updatePortfolioName = authActionClient
  .metadata({ actionName: "updatePortfolioName" })
  .inputSchema(updatePortfolioNameSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { portfolioId, name } = parsedInput;

    const existing = await existsPortfolioByIdAndUserId(
      portfolioId,
      ctx.user.id,
    );
    if (!existing) throw new Error("Portfolio not found");

    const gradientUrl = `https://avatar.vercel.sh/${encodeURIComponent(
      name,
    )}.svg?gradient=true`;

    try {
      await db
        .update(portfolio)
        .set({ name, gradientUrl })
        .where(
          and(eq(portfolio.id, portfolioId), eq(portfolio.userId, ctx.user.id)),
        );

      return { success: true };
    } catch (error) {
      if (error instanceof Error && error.message.includes("duplicate")) {
        returnValidationErrors(updatePortfolioNameSchema, {
          name: { _errors: ["A portfolio with this name already exists"] },
        });
      }
      throw error;
    }
  });

const updatePortfolioCurrencySchema = z.object({
  portfolioId: z.string().uuid(),
  currency: z.enum(["USD", "EUR", "GBP", "JPY", "CNY"]),
});

export const updatePortfolioCurrency = authActionClient
  .metadata({ actionName: "updatePortfolioCurrency" })
  .inputSchema(updatePortfolioCurrencySchema)
  .action(async ({ parsedInput, ctx }) => {
    const { portfolioId, currency } = parsedInput;

    const existing = await existsPortfolioByIdAndUserId(
      portfolioId,
      ctx.user.id,
    );
    if (!existing) throw new Error("Portfolio not found");

    await db
      .update(portfolio)
      .set({ currency })
      .where(
        and(eq(portfolio.id, portfolioId), eq(portfolio.userId, ctx.user.id)),
      );

    return { success: true };
  });

const deletePortfolioSchema = z.object({
  portfolioId: z.string().uuid(),
});

export const deletePortfolio = authActionClient
  .metadata({ actionName: "deletePortfolio" })
  .inputSchema(deletePortfolioSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { portfolioId } = parsedInput;

    const existing = await existsPortfolioByIdAndUserId(
      portfolioId,
      ctx.user.id,
    );
    if (!existing) throw new Error("Portfolio not found");

    await db
      .delete(portfolio)
      .where(
        and(eq(portfolio.id, portfolioId), eq(portfolio.userId, ctx.user.id)),
      );

    return { success: true };
  });
