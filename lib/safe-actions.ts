import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { headers } from "next/headers";

import { debugLog } from "./utils/development";
import { auth } from "./auth";
import type { AuthActionContext } from "./types";

export const actionClient = createSafeActionClient({
  defineMetadataSchema() {
    return z.object({
      //For logging in the SIEM
      actionName: z.string(),
    });
  },
  handleServerError(e, utils) {
    //For logging in the SIEM
    const { clientInput, metadata } = utils;
    //TODO: Log the error in the SIEM
    debugLog("Error occurred", {
      error: e,
      clientInput,
      metadata,
    });

    return e.message;
  },
}).use(async ({ next, clientInput, metadata }) => {
  if (process.env.NODE_ENV === "development") {
    console.log("[i] LOGGING MIDDLEWARE");

    const startTime = performance.now();

    // Here we await the action execution.
    const result = await next();

    const endTime = performance.now();

    console.log("Result ->", result);
    console.log("Client input ->", clientInput);
    console.log("Metadata ->", metadata);
    console.log("Action execution took", endTime - startTime, "ms");

    return result;
  } else {
    // In production, just execute the action without logging
    return await next();
  }
});

//Extended base one with Better Auth authentication
export const authActionClient = actionClient.use(async ({ next }) => {
  // Get the session from Better Auth
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized: You must be logged in to perform this action");
  }

  // Pass the user data to the action context
  return await next<AuthActionContext>({
    ctx: {
      user: session.user,
      session: session.session,
    },
  });
});
