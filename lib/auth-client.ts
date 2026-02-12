import { createAuthClient } from "better-auth/react";
import { client_env } from "./env/client";

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: client_env.NEXT_PUBLIC_URL,
});

export const { signIn, signUp, useSession } = createAuthClient();
