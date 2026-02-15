"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeClosed, EyeIcon, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { signIn } from "@/lib/actions/auth";
import { activePortfolioIdAtom } from "@/lib/atoms/PortfolioAtoms";
import { useAtomValue } from "jotai";
import { useRouter } from "next/router";
import { toast } from "sonner";

const formSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string(),
});

type SignInFormData = z.infer<typeof formSchema>;

function SignInForm() {
  const tAuth = useTranslations("Auth");
  const tError = useTranslations("Auth.errors");
  const [showPassword, setshowPassword] = useState(false);
  const activePortfolioId = useAtomValue(activePortfolioIdAtom);
  const router = useRouter();
  const { execute, isPending, result } = useAction(signIn, {
    onError: (e) => {
      if (e.error.validationErrors?._errors) {
        const errorMessage = e.error.validationErrors._errors[0];
        toast.error(errorMessage);
      } else {
        toast.error(e.error.serverError || tError("unexpected"));
      }
    },
    onSuccess: () => {
      toast.success("Welcome back!");
      if (activePortfolioId) {
        router.push(`/app/${activePortfolioId}`);
      } else {
        router.push("/app");
      }
    },
  });

  useEffect(() => {
    console.log(result);
  }, [result]);

  const form = useForm<SignInFormData>({
    mode: "onChange",
    resolver: zodResolver(formSchema),

    defaultValues: {
      email: "",
      password: "",
    },
  });
  const onSubmit = async (data: SignInFormData) => {
    execute(data);
  };
  return (
    <div className="w-full max-w-md space-y-3 overflow-x-hidden px-2">
      <Form {...form}>
        <form
          className="space-y-3 w-full pb-1"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className="text-sm text-muted-foreground font-normal">
                  {tAuth("email")}
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
                {result?.validationErrors ? (
                  <FormMessage>{tAuth("loginError")}</FormMessage>
                ) : null}
              </FormItem>
            )}
          />
          <ShinyButton className="w-full" disabled={isPending} type="submit">
            {!isPending ? (
              tAuth("signIn")
            ) : (
              <Loader2 className="size-4 animate-spin" />
            )}
          </ShinyButton>
        </form>
      </Form>
    </div>
  );
}

export default SignInForm;
