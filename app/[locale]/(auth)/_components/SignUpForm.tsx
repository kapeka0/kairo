"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeClosed, EyeIcon, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { signUp } from "@/lib/actions/auth";
import { devLog } from "@/lib/utils";
import { getProfilePicBySeed } from "@/lib/utils/development";
import { toast } from "sonner";

function SignUpForm() {
  const router = useRouter();
  const tForm = useTranslations("Auth.zod");
  const tAuth = useTranslations("Auth");
  const tError = useTranslations("Auth.errors");
  const [showPassword, setshowPassword] = useState(false);
  const signUpSchema = z
    .object({
      name: z
        .string()
        .min(3, { message: tForm("nameLength") })
        .max(50),
      email: z.string().email({ message: tForm("email") }),
      password: z
        .string()
        .min(8, { message: tForm("passwordLength") })
        .max(100, { message: tForm("passwordMaxLength", { length: 100 }) })
        .regex(/[a-z]/, { message: tForm("passwordLowercase") })
        .regex(/[A-Z]/, { message: tForm("passwordUppercase") })
        .regex(/[0-9]/, { message: tForm("passwordNumber") })
        .regex(/[^a-zA-Z0-9]/, { message: tForm("passwordSpecial") }),
      confirmPassword: z.string().min(8).max(100),
      acceptTerms: z.boolean().refine((data) => data === true, {
        message: tAuth("acceptTerms"),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: tAuth("passwordMismatch"),
      path: ["confirmPassword"],
    });
  const form = useForm<z.infer<typeof signUpSchema>>({
    mode: "onChange",
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });
  const { execute, isPending } = useAction(signUp, {
    onError: (e) => {
      devLog(e);
      if (e.error.validationErrors?.email) {
        form.setError("email", {
          type: "manual",
          message: "Email already in use",
        });
        toast.error("Email already exists");
      } else {
        toast.error(e.error.serverError || tError("unexpected"));
      }
    },
    onSuccess: (res) => {
      toast.success("Account created successfully!");
      // router.push(
      //   `/sign-up/success?email=${encodeURIComponent(
      //     res.data?.user?.email || "",
      //   )}`,
      // );
    },
  });

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    execute({
      name: data.name,
      email: data.email,
      password: data.password,
      acceptTerms: data.acceptTerms,
      image: getProfilePicBySeed(data.name),
    });
  };

  return (
    <div className="w-full max-w-md space-y-3 overflow-x-hidden px-2 pb-1">
      <Form {...form}>
        <form
          className="space-y-3 w-full"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className="text-sm text-muted-foreground font-normal">
                  Full Name
                </FormLabel>
                <FormControl>
                  <Input
                    disabled={isPending}
                    placeholder={tAuth("namePlaceholder")}
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
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className="text-sm text-muted-foreground font-normal">
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    disabled={isPending}
                    placeholder={tAuth("emailPlaceholder")}
                    {...field}
                    className="placeholder:text-muted-foreground/50"
                    type="email"
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
