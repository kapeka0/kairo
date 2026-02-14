"use client";

import { authClient } from "../auth-client";
import { User } from "../types";

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

  return {
    user: session?.user,
    isPending,
    error,
    refetch,
  };
};
