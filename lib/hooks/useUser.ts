"use client";

import { useEffect } from "react";
import { authClient } from "../auth-client";
import { User } from "../types";
import { devLog } from "../utils";

export const useUser = (): {
  user: User | null | undefined;
  isPending: boolean;
  error: Error | null;
  refetch: () => void;
} => {
  const {
    data: session,
    isPending, //loading state
    error, //error object
    refetch, //refetch the session
  } = authClient.useSession();

  useEffect(() => {
    devLog("useUser session data:", session);
  }, [session]);

  return {
    user: session?.user,
    isPending,
    error,
    refetch,
  };
};
