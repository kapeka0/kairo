"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { deleteAddressTag, upsertAddressTag } from "@/lib/db/data/address-tags";
import { db } from "@/lib/db/db";
import { portfolio } from "@/lib/db/schema";
import { authActionClient } from "@/lib/safe-actions";

export const upsertAddressTagAction = authActionClient
  .metadata({ actionName: "upsertAddressTag" })
  .inputSchema(
    z.object({
      portfolioId: z.string().uuid(),
      address: z.string().min(1),
      tag: z.string().min(1),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const portfolioExists = await db.query.portfolio.findFirst({
      where: and(
        eq(portfolio.id, parsedInput.portfolioId),
        eq(portfolio.userId, ctx.user.id),
      ),
    });
    if (!portfolioExists)
      throw new Error("Portfolio not found or does not belong to the user");
    await upsertAddressTag(parsedInput.portfolioId, parsedInput.address, parsedInput.tag);
    return { success: true };
  });

export const deleteAddressTagAction = authActionClient
  .metadata({ actionName: "deleteAddressTag" })
  .inputSchema(
    z.object({
      portfolioId: z.string().uuid(),
      address: z.string().min(1),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const portfolioExists = await db.query.portfolio.findFirst({
      where: and(
        eq(portfolio.id, parsedInput.portfolioId),
        eq(portfolio.userId, ctx.user.id),
      ),
    });
    if (!portfolioExists)
      throw new Error("Portfolio not found or does not belong to the user");
    await deleteAddressTag(parsedInput.portfolioId, parsedInput.address);
    return { success: true };
  });
