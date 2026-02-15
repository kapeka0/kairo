"use server";

import { portfolio } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { db } from "../db";

export async function getUserPortfoliosById(userId: string) {
  return await db.select().from(portfolio).where(eq(portfolio.userId, userId));
}

export async function existsPortfolioByIdAndUserId(
  portfolioId: string,
  userId: string,
) {
  return await db.query.portfolio.findFirst({
    where: and(eq(portfolio.id, portfolioId), eq(portfolio.userId, userId)),
  });
}
