"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addBtcAsset, addEthAsset } from "@/lib/actions/wallet";
import { devLog } from "@/lib/utils";
import {
  bitcoinWalletSchema,
  detectBipType,
  ethereumWalletSchema,
  type BitcoinWalletData,
  type EthereumWalletData,
} from "@/lib/validations/wallet";

interface AssetStep2Props {
  walletId: string;
  cryptocurrency: string;
  portfolioId: string;
  onBack: () => void;
  onSuccess: () => void;
}

export default function AssetStep2({
  walletId,
  cryptocurrency,
  portfolioId,
  onBack,
  onSuccess,
}: AssetStep2Props) {
  if (cryptocurrency === "BTC") {
    return (
      <BtcAssetForm
        walletId={walletId}
        portfolioId={portfolioId}
        onBack={onBack}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <EthAssetForm
      walletId={walletId}
      portfolioId={portfolioId}
      onBack={onBack}
      onSuccess={onSuccess}
    />
  );
}

function BtcAssetForm({
  walletId,
  portfolioId,
  onBack,
  onSuccess,
}: {
  walletId: string;
  portfolioId: string;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const tForm = useTranslations("Wallets.form");
  const tSuccess = useTranslations("Wallets.success");
  const tErrors = useTranslations("Wallets.errors");
  const [detectedBipType, setDetectedBipType] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { execute, isPending } = useAction(addBtcAsset, {
    onError: (e) => {
      devLog("[BtcAssetForm] Error adding asset", e);
      if (e.error.validationErrors?.publicKey) {
        toast.error(tErrors("duplicateXpub"));
      } else {
        toast.error(tErrors("unexpected"));
      }
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: ["wallets", portfolioId],
      });
      queryClient.refetchQueries();
      toast.success(tSuccess("walletAdded"));
      onSuccess();
    },
  });

  const form = useForm<BitcoinWalletData>({
    mode: "onChange",
    resolver: zodResolver(bitcoinWalletSchema),
    defaultValues: { publicKey: "", bipType: undefined },
  });

  const publicKeyValue = useWatch({
    control: form.control,
    name: "publicKey",
    defaultValue: "",
  });

  useEffect(() => {
    if (publicKeyValue && publicKeyValue.length > 10) {
      const bipType = detectBipType(publicKeyValue);
      setDetectedBipType(bipType);
      if (bipType) {
        form.setValue(
          "bipType",
          bipType as "BIP44" | "BIP49" | "BIP84" | "BIP86",
        );
      }
    } else {
      setDetectedBipType(null);
    }
  }, [publicKeyValue, form]);

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

  const onSubmit = (data: BitcoinWalletData) => {
    execute({ walletId, publicKey: data.publicKey, bipType: data.bipType });
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
              {detectedBipType && (
                <FormDescription className="text-xs text-blue-500">
                  {tForm("bipTypeDetected", {
                    bipType: getBipTypeLabel(detectedBipType) || "N/A",
                  })}
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bipType"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormLabel className="text-sm text-muted-foreground font-normal">
                {tForm("addressType")}
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value ?? ""}
                disabled={isPending}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={tForm("selectAddressType")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="w-40">
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
              <FormMessage />
            </FormItem>
          )}
        />
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
              tForm("addAsset")
            ) : (
              <LoadingSpinner className="size-4" />
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function EthAssetForm({
  walletId,
  portfolioId,
  onBack,
  onSuccess,
}: {
  walletId: string;
  portfolioId: string;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const tForm = useTranslations("Wallets.form");
  const tSuccess = useTranslations("Wallets.success");
  const tErrors = useTranslations("Wallets.errors");
  const queryClient = useQueryClient();

  const { execute, isPending } = useAction(addEthAsset, {
    onError: (e) => {
      devLog("[EthAssetForm] Error adding asset", e);
      if (e.error.validationErrors?.publicKey) {
        toast.error(tErrors("invalidEthAddress"));
      } else {
        toast.error(tErrors("unexpected"));
      }
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: ["wallets", portfolioId],
      });
      queryClient.refetchQueries();
      toast.success(tSuccess("walletAdded"));
      onSuccess();
    },
  });

  const form = useForm<EthereumWalletData>({
    mode: "onChange",
    resolver: zodResolver(ethereumWalletSchema),
    defaultValues: { publicKey: "" },
  });

  const onSubmit = (data: EthereumWalletData) => {
    execute({ walletId, publicKey: data.publicKey });
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
                {tForm("ethereumAddress")}
              </FormLabel>
              <FormControl>
                <Input
                  disabled={isPending}
                  placeholder={tForm("ethereumAddressPlaceholder")}
                  {...field}
                  className="placeholder:text-muted-foreground/50 font-mono text-sm"
                />
              </FormControl>
              <FormDescription className="text-xs">
                {tForm("ethereumAddressHelper")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
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
              tForm("addAsset")
            ) : (
              <LoadingSpinner className="size-4" />
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
