"use server";

import { APIError } from "better-auth/api";
import { returnValidationErrors } from "next-safe-action";
import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { actionClient, authActionClient } from "@/lib/safe-actions";
import { devLog } from "../utils";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const signIn = actionClient
  .metadata({ actionName: "signIn" })
  .inputSchema(signInSchema)
  .action(async ({ parsedInput }) => {
    const { email, password } = parsedInput;

    try {
      await auth.api.signInEmail({
        body: { email, password },
        headers: await headers(),
      });

      return { success: true };
    } catch (error) {
      if (error instanceof APIError) {
        if (error.status === 401) {
          returnValidationErrors(signInSchema, {
            _errors: ["Invalid email or password"],
          });
        }
      }
      throw new Error("Sign in failed");
    }
  });

const signUpSchema = z.object({
  name: z.string().min(3).max(50),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .max(100)
    .regex(/[a-z]/)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^a-zA-Z0-9]/),
  acceptTerms: z.boolean().refine((val) => val === true),
  image: z.string(),
});

export const signUp = actionClient
  .metadata({ actionName: "signUp" })
  .inputSchema(signUpSchema)
  .action(async ({ parsedInput }) => {
    const { name, email, password, image } = parsedInput;

    try {
      const result = await auth.api.signUpEmail({
        body: { name, email, password, image },
        headers: await headers(),
      });

      return { success: true, user: result.user };
    } catch (error) {
      if (error instanceof APIError) {
        if (error.status === 400 && error.message.includes("exists")) {
          returnValidationErrors(signUpSchema, {
            email: { _errors: ["Email already in use"] },
          });
        }
      }
      devLog(error);
      throw new Error("Sign up failed");
    }
  });

export const logOut = authActionClient
  .metadata({ actionName: "logOut" })
  .inputSchema(z.object({}))
  .action(async () => {
    try {
      await auth.api.signOut({
        headers: await headers(),
      });
      return { success: true };
    } catch (error) {
      throw new Error("Log out failed");
    }
  });
