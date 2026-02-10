"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeClosed, EyeIcon, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
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
import { signIn } from "@/data/actions/user";

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string(),
});

type SignInFormData = z.infer<typeof formSchema>;

function SignInForm() {
  const tAuth = useTranslations("Auth");
  const tError = useTranslations("Auth.errors");
  const [showPassword, setshowPassword] = useState(false);
  const { execute, isPending, result } = useAction(signIn, {
    onError: (error) => {
      console.log("Error a", error);
      toast.error(tError("unexpected"));
    },
    onSuccess: (data) => {
      console.log("Data", data);
      toast.success(tAuth("signUpSuccess"));
    },
  });
  useEffect(() => {
    console.log(result);
  }, [result]);

  const form = useForm<SignInFormData>({
    mode: "onChange",
    resolver: zodResolver(formSchema),

    defaultValues: {
      username: "",
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
                {result?.validationErrors?.username && (
                  <FormMessage>{tAuth("invalidUsername")}</FormMessage>
                )}
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
