"use client";

import { PrivacyValue } from "@/components/privacy-value";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDisplayCurrency } from "@/lib/hooks/useDisplayCurrency";
import { useTokenStats } from "@/lib/hooks/useTokenStats";
import { FormattedTransaction } from "@/lib/services/blockbook";
import { TokenType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getTokenMetadata } from "@/lib/utils/token-metadata";
import NumberFlow from "@number-flow/react";
import { ArrowDownLeft, ArrowUpRight, Triangle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useMemo } from "react";
import AddressCell from "./AddressCell";

const formatTime = (blockTime: number, locale: string): string =>
  new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(blockTime * 1000));

interface TransactionCardProps {
  tx: FormattedTransaction;
  tagMap: Record<string, string>;
  onUpsertTag: (address: string, tag: string) => void;
  onDeleteTag: (address: string) => void;
}

const TransactionCard = ({
  tx,
  tagMap,
  onUpsertTag,
  onDeleteTag,
}: TransactionCardProps) => {
  const t = useTranslations("Transactions");
  const locale = useLocale();
  const { displayCurrency, formatCurrency, formatNumber } =
    useDisplayCurrency();
  const isReceived = tx.type === "received";
  const isSent = tx.type === "sent";
  const tokenMeta = getTokenMetadata(
    (tx.tokenType as TokenType) ?? TokenType.BTC,
  );
  const { getPriceByTokenType } = useTokenStats();
  const displayDecimals = Math.min(tokenMeta.decimals, 8);
  const nativeAmount =
    parseInt(tx.amountInSatoshis) / Math.pow(10, tokenMeta.decimals);
  const historicalValue =
    tx.historicalPriceUsd != null ? nativeAmount * tx.historicalPriceUsd : null;
  const primaryAddress = tx.externalAddresses[0];
  const currentValue = useMemo(() => {
    const currentPrice = getPriceByTokenType(tx.tokenType as TokenType);
    if (currentPrice == null) return null;
    return nativeAmount * currentPrice;
  }, [getPriceByTokenType, tx.tokenType, nativeAmount]);
  const changePercent = useMemo(() => {
    if (historicalValue == null || currentValue == null) return null;
    if (historicalValue === 0) return null;
    return ((currentValue - historicalValue) / historicalValue) * 100;
  }, [historicalValue, currentValue]);
  return (
    <div className="flex items-center gap-6 px-5 py-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
      <Tooltip>
        <TooltipTrigger>
          <div className="relative w-fit">
            <Avatar className={"rounded-lg after:rounded-lg"}>
              <AvatarImage
                src={tx.walletIcon || tx.walletGradientUrl || ""}
                alt={tx.walletName || t("wallet")}
                className=" rounded-lg"
              />
              <AvatarFallback className="rounded-lg">
                {tx.walletName?.[0]?.toUpperCase() ?? "W"}
              </AvatarFallback>
            </Avatar>

            <div
              className={cn(
                "flex items-center justify-center size-5 rounded-full absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4",
                isReceived
                  ? "bg-green-200 text-green-900 dark:bg-green-950 dark:text-green-500 "
                  : isSent
                  ? "bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-500"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {isReceived ? (
                <ArrowDownLeft className="size-3" />
              ) : (
                <ArrowUpRight className="size-3" />
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>{tx.walletName || t("wallet")}</TooltipContent>
      </Tooltip>

      <div className="flex flex-col shrink-0 w-20">
        <span className="text-sm font-medium">
          {isReceived ? t("received") : isSent ? t("sent") : t("internal")}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {tx.blockTime > 0 ? formatTime(tx.blockTime, locale) : t("pending")}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0 w-24">
        <Image
          src={tokenMeta.logoPath}
          alt={tokenMeta.symbol}
          width={20}
          height={20}
          className="rounded-full"
        />
        <span className="text-sm font-medium">{tokenMeta.name}</span>
      </div>

      <div className="flex-1  hidden md:block">
        {primaryAddress ? (
          <AddressCell
            address={primaryAddress}
            tag={tagMap[primaryAddress]}
            onUpsert={onUpsertTag}
            onDelete={onDeleteTag}
          />
        ) : (
          <span className="text-xs text-muted-foreground italic">
            {t("internal")}
          </span>
        )}
      </div>

      <PrivacyValue className="ml-auto text-right shrink-0 flex flex-col items-end gap-1">
        <span className={cn("text-sm  tabular-nums flex items-center gap-1")}>
          <span
            className={cn(
              isReceived
                ? "text-green-500"
                : isSent
                ? "text-red-400"
                : "text-foreground",
            )}
          >
            {isReceived ? "+" : isSent ? "−" : ""}
          </span>
          <Tooltip>
            <TooltipTrigger>
              <p className="select-text">
                {nativeAmount.toFixed(displayDecimals)} {tokenMeta.symbol}
              </p>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex items-center gap-1">
                {" "}
                <p>{formatCurrency(currentValue!)}</p>
                {changePercent && (
                  <span
                    className={cn("flex items-center gap-0.5", {
                      "text-green-500": changePercent > 0,
                      "text-red-500": changePercent < 0,
                    })}
                  >
                    ({" "}
                    <Triangle
                      className={cn(
                        "size-2 fill-current stroke-none",
                        changePercent > 0 ? "rotate-0" : "rotate-180",
                      )}
                    />
                    {formatNumber(Math.abs(changePercent))}%)
                  </span>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </span>
        {historicalValue != null ? (
          <NumberFlow
            locales={locale}
            value={historicalValue}
            format={{
              style: "currency",
              currency: displayCurrency,
              currencySign: "standard",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
              trailingZeroDisplay: "stripIfInteger",
            }}
            className="text-xs tabular-nums text-muted-foreground"
          />
        ) : null}
      </PrivacyValue>
    </div>
  );
};

export default TransactionCard;
