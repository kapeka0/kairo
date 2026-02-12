"use server";

import { returnValidationErrors } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db/db";
import { portfolio } from "@/lib/db/schema";
import { authActionClient } from "@/lib/safe-actions";

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

    const gradientUrl = `https://avatar.vercel.sh/${encodeURIComponent(name)}.svg?gradient=true`;

    try {
      const newPortfolio = await db.insert(portfolio).values({
        name,
        gradientUrl,
        currency,
        userId,
      }).returning();

      revalidatePath("/app");

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
