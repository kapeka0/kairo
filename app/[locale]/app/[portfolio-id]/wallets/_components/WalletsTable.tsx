"use client";

import NumberFlow from "@number-flow/react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, MoreHorizontal, RefreshCcw } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import Image from "next/image";
//eslint-disable-next-line
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import TimeAgoIntl from "@/components/global/TimeAgoIntl";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  deleteWallet,
  refreshWalletBalance,
  updateWalletIcon,
} from "@/lib/actions/wallet";
import { usePortfolios } from "@/lib/hooks/usePortfolios";
import { useTokenStats } from "@/lib/hooks/useTokenStats";
import { useWallets } from "@/lib/hooks/useWallets";
import { TokenType } from "@/lib/types";
import { devLog } from "@/lib/utils";
import { formatBtc, satoshisToBtc } from "@/lib/utils/bitcoin";
import { SUPPORTED_CRYPTOCURRENCIES } from "@/lib/utils/constants";
import { useAction } from "next-safe-action/hooks";
import WalletIconPicker from "./WalletIconPicker";

export default function WalletsTable() {
  const params = useParams();
  const portfolioId = params["portfolio-id"] as string;
  const tTable = useTranslations("Wallets.table");
  const format = useFormatter();
  const queryClient = useQueryClient();
  const {
    data,
    isLoading,
    error,
    walletsSortedByBalance,
    getWalletBalanceInCurrency,
  } = useWallets(portfolioId);
  const { getPriceByTokenType } = useTokenStats();
  const { activePortfolio } = usePortfolios();
  const currency = activePortfolio?.currency;
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
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
  const { execute: executeDelete, isPending: isDeleting } = useAction(
    deleteWallet,
    {
      onSuccess: async () => {
        // Reset wallet query first so the next requests have the correct data, then reset all queries to clear any wallet-related data from the cache
        await queryClient.refetchQueries({
          queryKey: ["wallets", portfolioId],
        });
        // Reset all app queries to ensure all wallet-related data is cleared from the cache, don't await to avoid blocking the UI
        queryClient.refetchQueries();
        toast.success(tTable("walletDeleted"));
      },
      onError: ({ error }) => {
        devLog("Error deleting wallet:", error);
        toast.error(tTable("deleteFailed"));
      },
    },
  );

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
    } catch (err) {
      toast.error(tTable("copyFailed"));
    }
  };

  const truncatePublicKey = (publicKey: string) => {
    if (publicKey.length <= 12) return publicKey;
    return `${publicKey.slice(0, 8)}...${publicKey.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tTable("name")}</TableHead>
              <TableHead>{tTable("balance")}</TableHead>
              <TableHead>{tTable("publicKey")}</TableHead>
              <TableHead className="w-12.5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[100, 90, 80, 70, 60].map((width, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-8 rounded-md" />
                    <div className="flex flex-col gap-2">
                      <Skeleton
                        className="h-4"
                        style={{ width: `${width}%` }}
                      />
                      <Skeleton
                        className="h-3"
                        style={{ width: `${width * 0.6}%` }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-2">
                    <Skeleton
                      className="h-4"
                      style={{ width: `${width * 0.7}%` }}
                    />
                    <Skeleton
                      className="h-3"
                      style={{ width: `${width * 0.5}%` }}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton
                    className="h-4"
                    style={{ width: `${width * 0.8}%` }}
                  />
                </TableCell>
                <TableCell>
                  <Skeleton className="size-8 rounded-md" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tTable("name")}</TableHead>
              <TableHead>{tTable("balance")}</TableHead>
              <TableHead>{tTable("publicKey")}</TableHead>
              <TableHead className="w-12.5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {walletsSortedByBalance.map((wallet) => {
              const crypto = SUPPORTED_CRYPTOCURRENCIES.find(
                (c) => c.value === "BTC",
              );
              const balanceInBTC = satoshisToBtc(
                wallet.lastBalanceInTokens || "0",
              );

              return (
                <TableRow key={wallet.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {editingWalletId === wallet.id ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <WalletIconPicker
                            value={wallet.icon}
                            gradientUrl={wallet.gradientUrl}
                            onValueChange={(icon) =>
                              handleIconChange(wallet.id, icon)
                            }
                          />
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingWalletId(wallet.id)}
                          className="relative group cursor-pointer"
                        >
                          <Avatar className={"rounded-lg after:rounded-lg"}>
                            <AvatarImage
                              src={wallet.icon || wallet.gradientUrl}
                              alt={wallet.name}
                              className="rounded-lg transition-opacity group-hover:opacity-80"
                            />
                            <AvatarFallback className={"rounded-lg"}>
                              {wallet.name?.[0]?.toUpperCase() ?? "W"}
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
                        <span className="font-medium">{wallet.name}</span>
                        {crypto && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Image
                              src={crypto.logo}
                              alt="BTC"
                              width={12}
                              height={12}
                            />
                            {crypto.value}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <Tooltip>
                        <TooltipTrigger>
                          {" "}
                          <PrivacyValue className="cursor-help">
                            <span className="font-medium">
                              {formatBtc(balanceInBTC)}
                            </span>
                          </PrivacyValue>
                        </TooltipTrigger>
                        <TooltipContent className={"flex items-center gap-1 "}>
                          <RefreshCcw className="size-3  inline" />
                          <TimeAgoIntl
                            className="text-xs"
                            date={wallet.lastBalanceInTokensUpdatedAt}
                          />
                        </TooltipContent>
                      </Tooltip>

                      {getPriceByTokenType(wallet.tokenType) !== undefined && (
                        <PrivacyValue>
                          <span className="text-xs text-muted-foreground">
                            <NumberFlow
                              locales={locale}
                              format={{
                                style: "currency",
                                currency: currency || "USD",
                                currencySign: "standard",
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                                trailingZeroDisplay: "stripIfInteger",
                              }}
                              value={getWalletBalanceInCurrency(wallet) ?? 0}
                            />
                          </span>
                        </PrivacyValue>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => copyToClipboard(wallet.publicKey)}
                      className="flex items-center gap-2 font-mono text-sm hover:text-primary transition-colors group cursor-pointer"
                    >
                      <PrivacyValue>
                        {truncatePublicKey(wallet.publicKey)}
                      </PrivacyValue>
                      <Copy className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </TableCell>
                  <TableCell>
                    {" "}
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          nativeButton={false}
                          render={<span></span>}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem disabled>
                            {tTable("viewDetails")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={isRefreshing}
                            onClick={() =>
                              executeRefresh({ walletId: wallet.id })
                            }
                          >
                            {isRefreshing
                              ? tTable("refreshing")
                              : tTable("refresh")}
                          </DropdownMenuItem>{" "}
                          <AlertDialogTrigger className="w-full">
                            {" "}
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
                              walletName: wallet?.name ?? "",
                            })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            {tTable("deleteConfirmCancel")}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                              if (wallet) {
                                executeDelete({
                                  walletId: wallet.id,
                                  tokenType: wallet.tokenType as TokenType,
                                });
                              }
                            }}
                          >
                            {tTable("deleteConfirmAction")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
