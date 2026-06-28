"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
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
import { createEthereumWallet } from "@/lib/actions/wallet";
import { devLog } from "@/lib/utils";
import {
  ethereumWalletSchema,
  type EthereumWalletData,
} from "@/lib/validations/wallet";

interface EthereumWalletFormProps {
  walletName: string;
  cryptocurrency: string;
  portfolioId: string;
  onBack: () => void;
  onSuccess: () => void;
}

export default function EthereumWalletForm({
  walletName,
  portfolioId,
  onBack,
  onSuccess,
}: EthereumWalletFormProps) {
  const tForm = useTranslations("Wallets.form");
  const tSuccess = useTranslations("Wallets.success");
  const tErrors = useTranslations("Wallets.errors");
  const queryClient = useQueryClient();

  const { execute, isPending } = useAction(createEthereumWallet, {
    onError: (e) => {
      devLog("[EthereumWalletForm] Error creating wallet", e);

      if (e.error.validationErrors?.publicKey) {
        toast.error(tErrors("invalidEthAddress"));
      } else {
        toast.error(tErrors("unexpected"));
      }
    },
    onSuccess: async ({ data }) => {
      await queryClient.refetchQueries({
        queryKey: ["wallets", portfolioId],
      });
      queryClient.refetchQueries();
      toast.success(tSuccess("walletAdded"), {
        description: tSuccess("walletAddedDescription", {
          walletName: data.wallet.name,
        }),
      });

      devLog("[EthereumWalletForm] Wallet created successfully", data);
      onSuccess();
    },
  });

  const form = useForm<EthereumWalletData>({
    mode: "onChange",
    resolver: zodResolver(ethereumWalletSchema),
    defaultValues: {
      publicKey: "",
    },
  });

  const onSubmit = (data: EthereumWalletData) => {
    execute({
      name: walletName,
      publicKey: data.publicKey,
      cryptocurrency: "ETH",
      portfolioId,
    });
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
              tForm("addWallet")
            ) : (
              <LoadingSpinner className="size-4" />
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
