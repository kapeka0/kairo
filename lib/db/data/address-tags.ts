"use server";

import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { addressTag } from "../schema";

export async function getAddressTagsByPortfolioId(portfolioId: string) {
  const rows = await db
    .select({ address: addressTag.address, tag: addressTag.tag })
    .from(addressTag)
    .where(eq(addressTag.portfolioId, portfolioId));
  return rows;
}

export async function upsertAddressTag(
  portfolioId: string,
  address: string,
  tag: string,
) {
  await db
    .insert(addressTag)
    .values({ portfolioId, address, tag })
    .onConflictDoUpdate({
      target: [addressTag.portfolioId, addressTag.address],
      set: { tag, updatedAt: new Date() },
    });
}

export async function deleteAddressTag(portfolioId: string, address: string) {
  await db
    .delete(addressTag)
    .where(
      and(
        eq(addressTag.portfolioId, portfolioId),
        eq(addressTag.address, address),
      ),
    );
}
