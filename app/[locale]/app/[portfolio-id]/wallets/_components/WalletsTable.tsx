"use client";

import Image from "next/image";

import { useQueryClient } from "@tanstack/react-query";
import { Copy, MoreHorizontal } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
//eslint-disable-next-line
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PrivacyValue } from "@/components/privacy-value";
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
import { refreshWalletBalance, updateWalletIcon } from "@/lib/actions/wallet";
import { useTokenStats } from "@/lib/hooks/useTokenStats";
import { useWallets } from "@/lib/hooks/useWallets";
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
  const { data, isLoading, error } = useWallets(portfolioId);
  const { btcPrice, currency, currencySymbol } = useTokenStats();
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);

  const { execute } = useAction(updateWalletIcon, {
    onSuccess: async () => {
      await queryClient.invalidateQueries({
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
        toast.error(error.serverError || tTable("refreshFailed"));
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

  const calculateFiatValue = (satoshis: string): string | null => {
    if (!btcPrice) return null;
    const btcAmount = satoshisToBtc(satoshis);
    const fiatValue = btcAmount * btcPrice;
    return format.number(fiatValue, {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const truncatePublicKey = (publicKey: string) => {
    if (publicKey.length <= 12) return publicKey;
    return `${publicKey.slice(0, 8)}...${publicKey.slice(-4)}`;
  };

  const formatDate = (date: Date) => {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "N/A";
    return format.dateTime(dateObj, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
          {data.wallets.map((wallet) => {
            const crypto = SUPPORTED_CRYPTOCURRENCIES.find(
              (c) => c.value === "BTC",
            );
            const balanceInBTC = satoshisToBtc(
              wallet.lastBalanceInSatoshis || "0",
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
                        <Image
                          src={wallet.icon || wallet.gradientUrl}
                          alt={wallet.name}
                          width={32}
                          height={32}
                          className="rounded-lg transition-opacity group-hover:opacity-80"
                        />
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
                    <PrivacyValue className="cursor-help">
                      <span className="font-medium">
                        {formatBtc(balanceInBTC)}
                      </span>
                    </PrivacyValue>

                    {btcPrice && (
                      <PrivacyValue>
                        <span className="text-xs text-muted-foreground">
                          {calculateFiatValue(wallet.lastBalanceInSatoshis)}
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
                      <DropdownMenuItem disabled>
                        {tTable("viewDetails")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={isRefreshing}
                        onClick={() => executeRefresh({ walletId: wallet.id })}
                      >
                        {isRefreshing
                          ? tTable("refreshing")
                          : tTable("refreshBalance")}
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled className="text-destructive">
                        {tTable("deleteWallet")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
