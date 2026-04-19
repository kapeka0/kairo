"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updatePortfolioName } from "@/lib/actions/portfolio";
import { usePortfolios } from "@/lib/hooks/usePortfolios";
import SettingsCardSkeleton from "./SettingsCardSkeleton";

const schema = z.object({
  name: z.string().min(1).max(50),
});

type FormData = z.infer<typeof schema>;

export default function PortfolioNameCard() {
  const t = useTranslations("Settings.name");
  const { activePortfolio, isPending: isPendingActivePortfolio } =
    usePortfolios();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(schema),
    defaultValues: {
      name: activePortfolio?.name ?? "",
    },
  });

  useEffect(() => {
    if (activePortfolio?.name && !form.formState.isDirty) {
      form.reset({ name: activePortfolio.name });
    }
  }, [activePortfolio?.name, form]);

  const { execute, isPending } = useAction(updatePortfolioName, {
    onError: (e) => {
      if (e.error.validationErrors?.name) {
        toast.error(t("errors.duplicateName"));
      } else {
        toast.error(t("errors.unexpected"));
      }
    },
    onSuccess: () => {
      toast.success(t("success"));
      form.reset({ name: form.getValues("name") });
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    },
  });

  const onSubmit = (data: FormData) => {
    if (!activePortfolio) return;
    execute({ portfolioId: activePortfolio.id, name: data.name });
  };

  if (isPendingActivePortfolio || !activePortfolio) {
    return <SettingsCardSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <div className="flex justify-start items-center gap-1">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormControl>
                      <Input
                        disabled={isPending || isPendingActivePortfolio}
                        placeholder={t("placeholder")}
                        {...field}
                        className="placeholder:text-muted-foreground/50 max-w-xs"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />{" "}
              <Button
                type="submit"
                disabled={
                  isPending ||
                  isPendingActivePortfolio ||
                  !form.formState.isDirty
                }
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  t("save")
                )}
              </Button>
            </div>
          </CardContent>
        </form>
      </Form>
    </Card>
  );
}
