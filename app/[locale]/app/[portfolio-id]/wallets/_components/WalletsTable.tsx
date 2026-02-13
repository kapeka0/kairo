"use client";

import Image from "next/image";

import { Copy, MoreHorizontal, RefreshCcw } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
//eslint-disable-next-line
import { useParams } from "next/navigation";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWallets } from "@/lib/hooks/useWallets";
import { SUPPORTED_CRYPTOCURRENCIES } from "@/lib/utils/constants";

export default function WalletsTable() {
  const params = useParams();
  const portfolioId = params["portfolio-id"] as string;
  const tTable = useTranslations("Wallets.table");
  const format = useFormatter();
  const { data, isLoading, error } = useWallets(portfolioId);

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

  const formatDate = (date: Date) => {
    const dateObj = new Date(date);
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
            return (
              <TableRow key={wallet.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Image
                      src={wallet.gradientUrl}
                      alt={wallet.name}
                      width={32}
                      height={32}
                      className="rounded-lg"
                    />
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <PrivacyValue className="flex flex-col cursor-help">
                          <span className="font-medium">
                            {wallet.lastBalance} BTC
                          </span>
                          {/* TODO: Create a function to fetch the current price of BTC and calculate the user configured currency */}
                          <span className="text-xs text-muted-foreground">
                            $
                            {(parseFloat(wallet.lastBalance) * 100000).toFixed(
                              2,
                            )}
                          </span>
                        </PrivacyValue>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs flex items-center gap-1">
                          <RefreshCcw className="size-3 " />
                          {formatDate(wallet.balanceUpdatedAt)}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                      <DropdownMenuItem disabled>
                        {tTable("refreshBalance")}
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
