import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const server_env = createEnv({
  server: {
    DB_HOST: z.string().min(1),
    DB_PORT: z.string().min(1),
    POSTGRES_USER: z.string().min(1),
    POSTGRES_PASSWORD: z.string().min(1),
    POSTGRES_DB: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(20),
  },
  experimental__runtimeEnv: process.env,
});
