"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createBitcoinWallet } from "@/lib/actions/wallet";
import { devLog } from "@/lib/utils";
import {
  bitcoinWalletSchema,
  type BitcoinWalletData,
} from "@/lib/validations/wallet";

interface BitcoinWalletFormProps {
  walletName: string;
  cryptocurrency: string;
  portfolioId: string;
  onBack: () => void;
  onSuccess: () => void;
}

export default function BitcoinWalletForm({
  walletName,
  cryptocurrency,
  portfolioId,
  onBack,
  onSuccess,
}: BitcoinWalletFormProps) {
  const tForm = useTranslations("Wallets.form");
  const tSuccess = useTranslations("Wallets.success");
  const tErrors = useTranslations("Wallets.errors");
  const [detectedBipType, setDetectedBipType] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { execute, isPending } = useAction(createBitcoinWallet, {
    onError: (e) => {
      devLog("[BitcoinWalletForm] Error creating wallet", e);

      if (e.error.validationErrors?.publicKey) {
        toast.error(tErrors("invalidXpubFormat"));
      } else if (e.error.validationErrors?.name) {
        toast.error(tErrors("duplicateName"));
      } else {
        toast.error(tErrors("unexpected"));
      }
    },
    onSuccess: ({ data }) => {
      toast.success(tSuccess("walletAdded"), {
        description: tSuccess("walletAddedDescription", {
          walletName: data.wallet.name,
        }),
      });
      queryClient.invalidateQueries({ queryKey: ["wallets", portfolioId] });
      devLog("[BitcoinWalletForm] Wallet created successfully", data);
      onSuccess();
    },
  });

  const form = useForm<BitcoinWalletData>({
    mode: "onChange",
    resolver: zodResolver(bitcoinWalletSchema),
    defaultValues: {
      publicKey: "",
      // derivationPath: "BIP44",
    },
  });

  const publicKeyValue = form.watch("publicKey");

  // useEffect(() => {
  //   if (publicKeyValue && publicKeyValue.length > 10) {
  //     const bipType = detectBipType(publicKeyValue);
  //     setDetectedBipType(bipType);
  //     if (bipType) {
  //       form.setValue(
  //         "derivationPath",
  //         bipType as "BIP44" | "BIP49" | "BIP84" | "BIP86",
  //       );
  //     }
  //   } else {
  //     setDetectedBipType(null);
  //   }
  // }, [publicKeyValue, form]);

  const onSubmit = async (data: BitcoinWalletData) => {
    execute({
      name: walletName,
      publicKey: data.publicKey,
      // derivationPath: data.derivationPath,
      cryptocurrency: "BTC",
      portfolioId,
    });
  };

  const getBipTypeLabel = (bipType: string | null) => {
    if (!bipType) return null;
    switch (bipType) {
      case "BIP44":
        return tForm("bipTypeLegacy");
      case "BIP49":
        return tForm("bipTypeNestedSegwit");
      case "BIP84":
        return tForm("bipTypeNativeSegwit");
      case "BIP86":
        return tForm("bipTypeTaproot");
      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form
        className="space-y-4 w-full pb-1"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="publicKey"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormLabel className="text-sm text-muted-foreground font-normal">
                {tForm("extendedPublicKey")}
              </FormLabel>
              <FormControl>
                <Input
                  disabled={isPending}
                  placeholder={tForm("extendedPublicKeyPlaceholder")}
                  {...field}
                  className="placeholder:text-muted-foreground/50 font-mono text-sm"
                />
              </FormControl>
              {/* {detectedBipType && (
                <FormDescription className="text-xs text-blue-500">
                  {tForm("bipTypeDetected", {
                    bipType: getBipTypeLabel(detectedBipType) || "N/A",
                  })}
                </FormDescription>
              )} */}
              <FormDescription className="text-xs">
                {tForm("extendedPublicKeyHelper")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* <FormField
          control={form.control}
          name="derivationPath"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormLabel className="text-sm text-muted-foreground font-normal">
                {tForm("addressType")}
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isPending}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={tForm("selectAddressType")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="BIP44">
                    {tForm("bipTypeLegacy")}
                  </SelectItem>
                  <SelectItem value="BIP49">
                    {tForm("bipTypeNestedSegwit")}
                  </SelectItem>
                  <SelectItem value="BIP84">
                    {tForm("bipTypeNativeSegwit")}
                  </SelectItem>
                  <SelectItem value="BIP86">
                    {tForm("bipTypeTaproot")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription className="text-xs">
                {tForm("addressTypeHelper")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        /> */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onBack}
            disabled={isPending}
          >
            {tForm("back")}
          </Button>
          <Button className="flex-1" disabled={isPending} type="submit">
            {!isPending ? (
              tForm("addWallet")
            ) : (
              <LoadingSpinner className="size-4 " />
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
