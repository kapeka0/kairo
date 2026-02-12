import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const client_env = createEnv({
  client: {
    // NEXT_PUBLIC variables that should be accessible in the client-side code:
    //  NEXT_PUBLIC_SUPABASE_URL: z.string(),
    NEXT_PUBLIC_URL: z.string().url(),
  },
  runtimeEnv: {
    //NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
  },
});
