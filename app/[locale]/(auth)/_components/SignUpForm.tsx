"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeClosed, EyeIcon, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ShinyButton } from "@/components/ui/shiny-button";
import { Link, useRouter } from "@/i18n/routing";
import { signUp } from "../../../../data/actions/user";

function SignUpForm() {
  const router = useRouter();
  const tForm = useTranslations("Auth.zod");
  const tAuth = useTranslations("Auth");
  const tError = useTranslations("Auth.errors");
  const [showPassword, setshowPassword] = useState(false);
  const signUpSchema = z

    .object({
      username: z
        .string()
        .min(3, { message: tForm("usernameLength") })
        .max(20, { message: tForm("usernameMaxLength") })
        .regex(/^[a-zA-Z0-9_]+$/, {
          message: tForm("usernameInvalid"),
        }),
      password: z
        .string()
        .min(8, { message: tForm("passwordLength") })
        .max(20, {
          message: tForm("passwordMaxLength"),
        })
        .regex(/[a-z]/, {
          message: tForm("passwordLowercase"),
        })
        .regex(/[A-Z]/, {
          message: tForm("passwordUppercase"),
        })
        .regex(/[0-9]/, {
          message: tForm("passwordNumber"),
        })
        .regex(/[^a-zA-Z0-9]/, {
          message: tForm("passwordSpecial"),
        }),
      confirmPassword: z
        .string()
        .min(8, { message: tForm("passwordLength") })
        .max(20, {
          message: tForm("passwordMaxLength"),
        })
        .regex(/[a-z]/, {
          message: tForm("passwordLowercase"),
        })
        .regex(/[A-Z]/, {
          message: tForm("passwordUppercase"),
        })
        .regex(/[0-9]/, {
          message: tForm("passwordNumber"),
        })
        .regex(/[^a-zA-Z0-9]/, {
          message: tForm("passwordSpecial"),
        }),
      acceptTerms: z
        .boolean({ message: tAuth("acceptTerms") })
        .refine((data) => data === true, {
          message: tAuth("acceptTerms"),
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: tAuth("passwordMismatch"),
      path: ["confirm"],
    });
  const form = useForm<z.infer<typeof signUpSchema>>({
    mode: "onChange",
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });
  const { execute, isPending } = useAction(signUp, {
    onExecute: () => {},
    onError: (e) => {
      if (e.error.validationErrors?.username) {
        form.setError("username", {
          type: "manual",
          message: tError("existingUsernameDesc"),
        });
        toast.error(tError("existingUsername"), {
          duration: 1500,
        });
      } else {
        console.log("Error", e);
        toast.error(tError("unexpected"), {
          duration: 1500,
        });
      }
    },
    onSuccess: (res) => {
      router.push(
        `/sign-up/success?username=${encodeURIComponent(res.input.username || "")}`,
      );
    },
  });

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    execute({
      username: data.username,
      password: data.password,
      acceptTerms: data.acceptTerms,
      redirect: `${process.env.NEXT_PUBLIC_BASE_URL}/set-up`,
    });
  };

  return (
    <div className="w-full max-w-md space-y-3 overflow-x-hidden px-2">
      <Form {...form}>
        <form
          className="space-y-3 w-full"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className="text-sm text-muted-foreground font-normal">
                  {tAuth("username")}
                </FormLabel>
                <FormControl>
                  <Input
                    disabled={isPending}
                    placeholder={tAuth("usernamePlaceholder")}
                    {...field}
                    className="placeholder:text-muted-foreground/50"
                    type="text"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-0 relative">
                <FormLabel className="text-sm text-muted-foreground font-normal">
                  {tAuth("password")}
                </FormLabel>
                <FormControl className="">
                  <div className="relative">
                    <Input
                      disabled={isPending}
                      placeholder={tAuth("passwordPlaceholder")}
                      {...field}
                      className="placeholder:text-muted-foreground/50"
                      type={showPassword ? "text" : "password"}
                    />
                    <span
                      className="absolute right-1 top-1/2   cursor-pointer text-muted-foreground"
                      onClick={() => setshowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeClosed className="absolute right-2 top-1/2 -translate-y-1/2 size-5" />
                      ) : (
                        <EyeIcon className="absolute right-2 top-1/2 -translate-y-1/2 size-5" />
                      )}
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="space-y-0 relative">
                <FormLabel className="text-sm text-muted-foreground font-normal">
                  {tAuth("confirmPassword")}
                </FormLabel>
                <FormControl className="">
                  <div className="relative">
                    <Input
                      disabled={isPending}
                      placeholder={tAuth("confirmPassword")}
                      {...field}
                      className="placeholder:text-muted-foreground/50"
                      type={showPassword ? "text" : "password"}
                    />
                    <span
                      className="absolute right-1 top-1/2   cursor-pointer text-muted-foreground"
                      onClick={() => setshowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeClosed className="absolute right-2 top-1/2 -translate-y-1/2 size-5" />
                      ) : (
                        <EyeIcon className="absolute right-2 top-1/2 -translate-y-1/2 size-5" />
                      )}
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="acceptTerms"
            render={({ field }) => (
              <FormItem className="space-y-2 ">
                <div className="flex justify-start items-start gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      className="placeholder:text-muted-foreground/50"
                      disabled={isPending}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <p className="text-xs">
                    {tAuth("preTerms")}

                    <Link className="cursor-pointer text-primary" href="/terms">
                      {tAuth("terms")}
                    </Link>
                    {tAuth("inTerms")}
                    <Link
                      className="cursor-pointer text-primary"
                      href="/privacy"
                    >
                      {tAuth("privacy")}
                    </Link>
                  </p>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <ShinyButton className="w-full" disabled={isPending} type="submit">
            {!isPending ? (
              tAuth("signUp")
            ) : (
              <Loader2 className="size-4 animate-spin" />
            )}
          </ShinyButton>
        </form>
      </Form>
    </div>
  );
}

export default SignUpForm;
