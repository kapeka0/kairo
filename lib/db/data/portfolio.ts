"use server"

import { portfolio } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { db } from "../db";


export async function getUserPortfoliosById(userId: string) {
     return await db
     .select()
     .from(portfolio)
     .where(eq(portfolio.userId, userId));
   }