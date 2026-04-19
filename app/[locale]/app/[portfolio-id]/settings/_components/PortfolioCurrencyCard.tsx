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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updatePortfolioCurrency } from "@/lib/actions/portfolio";
import { usePortfolios } from "@/lib/hooks/usePortfolios";
import { CURRENCIES } from "@/lib/utils/constants";
import SettingsCardSkeleton from "./SettingsCardSkeleton";

const schema = z.object({
  currency: z.enum(["USD", "EUR", "GBP", "JPY", "CNY"]),
});

type FormData = z.infer<typeof schema>;

export default function PortfolioCurrencyCard() {
  const t = useTranslations("Settings.currency");
  const { activePortfolio, isPending: isPendingActivePortfolio } =
    usePortfolios();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    mode: "onChange",
    resolver: zodResolver(schema),
    defaultValues: {
      currency: (activePortfolio?.currency as FormData["currency"]) ?? "USD",
    },
  });

  useEffect(() => {
    if (activePortfolio?.currency && !form.formState.isDirty) {
      form.reset({
        currency: activePortfolio.currency as FormData["currency"],
      });
    }
  }, [activePortfolio?.currency, form]);

  const { execute, isPending } = useAction(updatePortfolioCurrency, {
    onError: () => {
      toast.error(t("errors.unexpected"));
    },
    onSuccess: () => {
      toast.success(t("success"));
      form.reset({ currency: form.getValues("currency") });
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
    },
  });

  const onSubmit = (data: FormData) => {
    if (!activePortfolio) return;
    execute({ portfolioId: activePortfolio.id, currency: data.currency });
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
                name="currency"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isPending || isPendingActivePortfolio}
                    >
                      <FormControl>
                        <SelectTrigger className="max-w-xs">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="min-w-50">
                        {CURRENCIES.map((currency) => (
                          <SelectItem
                            key={currency.value}
                            value={currency.value}
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                {currency.symbol}
                              </span>
                              {currency.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
