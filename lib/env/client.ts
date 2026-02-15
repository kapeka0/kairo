import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const client_env = createEnv({
  client: {
    NEXT_PUBLIC_URL: z.string().url(),
    NEXT_PUBLIC_BTC_HTTP_BLOCKBOOK_URL: z.string().url(),
    NEXT_PUBLIC_BTC_WSS_BLOCKBOOK_URL: z.string().url(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NEXT_PUBLIC_BTC_HTTP_BLOCKBOOK_URL:
      process.env.NEXT_PUBLIC_BTC_HTTP_BLOCKBOOK_URL,
    NEXT_PUBLIC_BTC_WSS_BLOCKBOOK_URL:
      process.env.NEXT_PUBLIC_BTC_WSS_BLOCKBOOK_URL,
  },
});
