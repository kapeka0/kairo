import { account, session, user, verification } from "@/lib/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db/db";
import { client_env } from "./env/client";

export const auth = betterAuth({
  baseURL: client_env.NEXT_PUBLIC_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, account, session, verification },
  }),
  emailAndPassword: {
    enabled: true,
  },
  experimental: { joins: true },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
