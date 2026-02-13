"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_CRYPTOCURRENCIES } from "@/lib/utils/constants";
import {
  walletStep1Schema,
  type WalletStep1Data,
} from "@/lib/validations/wallet";

interface WalletStep1Props {
  defaultValues?: WalletStep1Data;
  onNext: (data: WalletStep1Data) => void;
}

export default function WalletStep1({
  defaultValues,
  onNext,
}: WalletStep1Props) {
  const tForm = useTranslations("Wallets.form");

  const form = useForm<WalletStep1Data>({
    mode: "onChange",
    resolver: zodResolver(walletStep1Schema),
    defaultValues: defaultValues || {
      name: "",
      cryptocurrency: "BTC",
    },
  });

  const onSubmit = (data: WalletStep1Data) => {
    onNext(data);
  };

  return (
    <Form {...form}>
      <form
        className="space-y-4 w-full pb-1"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormLabel className="text-sm text-muted-foreground font-normal">
                {tForm("walletName")}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={tForm("walletNamePlaceholder")}
                  {...field}
                  className="placeholder:text-muted-foreground/50"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cryptocurrency"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormLabel className="text-sm text-muted-foreground font-normal">
                {tForm("cryptocurrency")}
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={tForm("selectCryptocurrency")}>
                      {field.value && (
                        <div className="flex items-center gap-2">
                          <Image
                            src={
                              SUPPORTED_CRYPTOCURRENCIES.find(
                                (c) => c.value === field.value,
                              )?.logo || ""
                            }
                            alt={field.value}
                            width={16}
                            height={16}
                            className="shrink-0"
                          />
                          <span>
                            {SUPPORTED_CRYPTOCURRENCIES.find(
                              (c) => c.value === field.value,
                            )?.label || field.value}
                          </span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SUPPORTED_CRYPTOCURRENCIES.map((crypto) => (
                    <SelectItem key={crypto.value} value={crypto.value}>
                      <div className="flex items-center gap-2">
                        <Image
                          src={crypto.logo}
                          alt={crypto.value}
                          width={16}
                          height={16}
                          className="shrink-0"
                        />
                        <span>{crypto.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" type="submit">
          {tForm("next")}
        </Button>
      </form>
    </Form>
  );
}
