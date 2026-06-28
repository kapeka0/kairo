"use client";

import NumberFlow from "@number-flow/react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, MoreHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PrivacyValue } from "@/components/privacy-value";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteAsset,
  deleteWallet,
  refreshWalletBalance,
  updateWalletIcon,
} from "@/lib/actions/wallet";
import { usePortfolios } from "@/lib/hooks/usePortfolios";
import { useTokenStats } from "@/lib/hooks/useTokenStats";
import { useWallets } from "@/lib/hooks/useWallets";
import { PhysicalWallet, TokenType, Wallet } from "@/lib/types";
import { getErc20Metadata } from "@/lib/utils/erc20-metadata";
import { devLog } from "@/lib/utils";
import { SUPPORTED_CRYPTOCURRENCIES } from "@/lib/utils/constants";
import { getTokenMetadata } from "@/lib/utils/token-metadata";
import { useAction } from "next-safe-action/hooks";
import WalletIconPicker from "./WalletIconPicker";
import AddAssetDialog from "./AddAssetDialog";

export default function WalletsTable() {
  const params = useParams();
  const portfolioId = params["portfolio-id"] as string;
  const tTable = useTranslations("Wallets.table");
  const queryClient = useQueryClient();
  const {
    data,
    isLoading,
    error,
    walletsSortedByBalance,
    getWalletBalanceInCurrency,
    erc20PricesMap,
  } = useWallets(portfolioId);
  const { getPriceByTokenType } = useTokenStats();
  const { activePortfolio } = usePortfolios();
  const currency = activePortfolio?.currency;
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [addAssetWalletId, setAddAssetWalletId] = useState<string | null>(null);
  const locale = useLocale();

  const { execute } = useAction(updateWalletIcon, {
    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: ["wallets", portfolioId],
      });
      toast.success(tTable("iconUpdated"));
      setEditingWalletId(null);
    },
  });

  const { execute: executeRefresh, isExecuting: isRefreshing } = useAction(
    refreshWalletBalance,
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: ["wallets", portfolioId],
        });
        toast.success(tTable("balanceRefreshed"));
      },
      onError: ({ error }) => {
        devLog("Error refreshing wallet balance:", error);
        toast.error(tTable("refreshFailed"));
      },
    },
  );

  const { execute: executeDeleteAsset, isPending: isDeletingAsset } = useAction(
    deleteAsset,
    {
      onSuccess: async () => {
        await queryClient.refetchQueries({
          queryKey: ["wallets", portfolioId],
        });
        queryClient.refetchQueries();
        toast.success(tTable("walletDeleted"));
      },
      onError: ({ error }) => {
        devLog("Error deleting asset:", error);
        toast.error(tTable("deleteFailed"));
      },
    },
  );

  const { execute: executeDeleteWallet, isPending: isDeletingWallet } =
    useAction(deleteWallet, {
      onSuccess: async () => {
        await queryClient.refetchQueries({
          queryKey: ["wallets", portfolioId],
        });
        queryClient.refetchQueries();
        toast.success(tTable("walletDeleted"));
      },
      onError: ({ error }) => {
        devLog("Error deleting wallet:", error);
        toast.error(tTable("deleteFailed"));
      },
    });

  useEffect(() => {
    const handleClickOutside = () => {
      if (editingWalletId) {
        setEditingWalletId(null);
      }
    };

    if (editingWalletId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [editingWalletId]);

  const handleIconChange = async (walletId: string, icon: string | null) => {
    execute({ walletId, icon });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(tTable("copiedToClipboard"));
    } catch {
      toast.error(tTable("copyFailed"));
    }
  };

  const truncatePublicKey = (publicKey: string) => {
    if (publicKey.length <= 12) return publicKey;
    return `${publicKey.slice(0, 8)}...${publicKey.slice(-4)}`;
  };

  const physicalWallets = useMemo(() => {
    const map = new Map<string, PhysicalWallet>();

    for (const asset of walletsSortedByBalance) {
      const wId = asset.walletId;
      if (!map.has(wId)) {
        map.set(wId, {
          id: wId,
          name: asset.name,
          gradientUrl: asset.gradientUrl,
          icon: asset.icon,
          portfolioId: asset.portfolioId,
          assets: [],
        });
      }
      map.get(wId)!.assets.push(asset);
    }

    return Array.from(map.values());
  }, [walletsSortedByBalance]);

  const getPhysicalWalletBalance = (pw: PhysicalWallet): number => {
    return pw.assets.reduce(
      (sum, asset) => sum + getWalletBalanceInCurrency(asset),
      0,
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xl border p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="pl-13 space-y-2">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-destructive">
        {tTable("errorLoading")}
      </div>
    );
  }

  if (!data?.wallets || data.wallets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">{tTable("noWallets")}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {tTable("noWalletsDescription")}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {physicalWallets.map((pw) => (
          <div key={pw.id} className="rounded-xl border">
            <div className="flex items-center justify-between p-4 pb-2">
              <div className="flex items-center gap-3">
                {editingWalletId === pw.id ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <WalletIconPicker
                      value={pw.icon}
                      gradientUrl={pw.gradientUrl}
                      onValueChange={(icon) => handleIconChange(pw.id, icon)}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingWalletId(pw.id)}
                    className="relative group cursor-pointer"
                  >
                    <Avatar className="rounded-lg after:rounded-lg size-10">
                      <AvatarImage
                        src={pw.icon || pw.gradientUrl}
                        alt={pw.name}
                        className="rounded-lg transition-opacity group-hover:opacity-80"
                      />
                      <AvatarFallback className="rounded-lg">
                        {pw.name?.[0]?.toUpperCase() ?? "W"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="size-4 rounded-full bg-background/90 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                      </div>
                    </div>
                  </button>
                )}
                <div className="flex flex-col">
                  <span className="font-semibold">{pw.name}</span>
                  <PrivacyValue>
                    <NumberFlow
                      locales={locale}
                      format={{
                        style: "currency",
                        currency: currency || "USD",
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }}
                      className="text-xs text-muted-foreground"
                      value={getPhysicalWalletBalance(pw)}
                    />
                  </PrivacyValue>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      nativeButton={false}
                      render={<span></span>}
                    >
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setAddAssetWalletId(pw.id)}
                      >
                        {tTable("addAsset")}
                      </DropdownMenuItem>
                      <AlertDialogTrigger className="w-full">
                        <DropdownMenuItem className="text-destructive hover:text-destructive!">
                          {tTable("delete")}
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {tTable("deleteConfirmTitle")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {tTable("deleteConfirmDescription", {
                          walletName: pw.name,
                        })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {tTable("deleteConfirmCancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => executeDeleteWallet({ walletId: pw.id })}
                      >
                        {tTable("deleteConfirmAction")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="px-4 pb-4 space-y-1">
              {pw.assets.map((asset) => {
                const crypto = SUPPORTED_CRYPTOCURRENCIES.find(
                  (c) => c.value === asset.tokenType,
                );
                const tokenMeta = getTokenMetadata(
                  asset.tokenType as TokenType,
                );
                const rawBalance = asset.lastBalanceInTokens || "0";
                const balanceInTokens =
                  Number(rawBalance) / Math.pow(10, tokenMeta.decimals);

                return (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors group/asset"
                  >
                    <div className="flex items-center gap-3">
                      {crypto && (
                        <Image
                          src={crypto.logo}
                          alt={crypto.value}
                          width={20}
                          height={20}
                          className="shrink-0"
                        />
                      )}
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {crypto?.label || asset.tokenType}
                          </span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(asset.publicKey)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer font-mono"
                        >
                          <PrivacyValue>
                            {truncatePublicKey(asset.publicKey)}
                          </PrivacyValue>
                          <Copy className="size-2.5 opacity-0 group-hover/asset:opacity-100 transition-opacity" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end gap-0.5">
                        {balanceInTokens > 0 && (
                          <PrivacyValue>
                            <span className="text-sm font-medium">
                              {balanceInTokens.toFixed(
                                Math.min(tokenMeta.decimals, 8),
                              )}{" "}
                              {tokenMeta.symbol}
                            </span>
                          </PrivacyValue>
                        )}

                        {asset.erc20Tokens?.map((token) => {
                          const meta = getErc20Metadata(token.symbol);
                          if (!meta || token.balance === "0") return null;
                          const tokenAmount =
                            parseInt(token.balance) /
                            Math.pow(10, token.decimals);
                          return (
                            <PrivacyValue key={token.contract}>
                              <span className="flex items-center gap-1.5 text-sm font-medium">
                                <Image
                                  src={meta.logoPath}
                                  alt={token.symbol}
                                  width={14}
                                  height={14}
                                  className="shrink-0"
                                />
                                {tokenAmount.toLocaleString(locale, {
                                  maximumFractionDigits: 2,
                                })}{" "}
                                {token.symbol}
                              </span>
                            </PrivacyValue>
                          );
                        })}

                        <PrivacyValue>
                          <NumberFlow
                            locales={locale}
                            format={{
                              style: "currency",
                              currency: currency || "USD",
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }}
                            className="text-xs text-muted-foreground"
                            value={getWalletBalanceInCurrency(asset) ?? 0}
                          />
                        </PrivacyValue>
                      </div>

                      <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            nativeButton={false}
                            render={<span></span>}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 opacity-0 group-hover/asset:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              disabled={isRefreshing}
                              onClick={() =>
                                executeRefresh({ assetId: asset.id })
                              }
                            >
                              {isRefreshing
                                ? tTable("refreshing")
                                : tTable("refresh")}
                            </DropdownMenuItem>
                            <AlertDialogTrigger className="w-full">
                              <DropdownMenuItem className="text-destructive hover:text-destructive!">
                                {tTable("delete")}
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent
                          onClick={(e) => e.stopPropagation()}
                        >
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {tTable("deleteConfirmTitle")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {tTable("deleteConfirmDescription", {
                                walletName: `${crypto?.label || asset.tokenType} (${truncatePublicKey(asset.publicKey)})`,
                              })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {tTable("deleteConfirmCancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() =>
                                executeDeleteAsset({ assetId: asset.id })
                              }
                            >
                              {tTable("deleteConfirmAction")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <AddAssetDialog
        walletId={addAssetWalletId}
        portfolioId={portfolioId}
        open={!!addAssetWalletId}
        onOpenChange={(open) => {
          if (!open) setAddAssetWalletId(null);
        }}
      />
    </>
  );
}
