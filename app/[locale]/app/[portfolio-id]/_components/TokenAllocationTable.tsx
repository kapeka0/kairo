"use client";

import NumberFlow from "@number-flow/react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

import { PrivacyValue } from "@/components/privacy-value";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { activePortfolioIdAtom } from "@/lib/atoms/PortfolioAtoms";
import { usePortfolios } from "@/lib/hooks/usePortfolios";
import { useTokenStats } from "@/lib/hooks/useTokenStats";
import { useWallets } from "@/lib/hooks/useWallets";
import { TokenType } from "@/lib/types";
import { getErc20Metadata } from "@/lib/utils/erc20-metadata";
import { TOKEN_METADATA } from "@/lib/utils/token-metadata";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { AllocationPieChart } from "./AllocationPieChart";

interface AllocationRow {
  key: string;
  logoPath: string;
  name: string;
  symbol: string;
  totalTokens: number;
  totalValue: number;
  percentage: number;
}

export function TokenAllocationTable() {
  const portfolioId = useAtomValue(activePortfolioIdAtom);
  const t = useTranslations("Dashboard.tokenAllocation");
  const locale = useLocale();
  const { activePortfolio } = usePortfolios();
  const currency = activePortfolio?.currency;
  const { walletsSortedByBalance, isLoading, erc20PricesMap } = useWallets(portfolioId!);
  const { getPriceByTokenType } = useTokenStats();

  const rows = useMemo(() => {
    const nativeMap: Record<string, { totalTokens: number; totalValue: number }> = {};
    const erc20Map: Record<string, { totalTokens: number; totalValue: number; symbol: string }> = {};

    for (const wallet of walletsSortedByBalance) {
      const meta = TOKEN_METADATA[wallet.tokenType as TokenType];
      const price = getPriceByTokenType(wallet.tokenType as TokenType) ?? 0;
      const nativeRaw = parseInt(wallet.lastBalanceInTokens || "0");

      if (nativeRaw > 0 && meta) {
        const amount = nativeRaw / Math.pow(10, meta.decimals);
        if (!nativeMap[wallet.tokenType]) {
          nativeMap[wallet.tokenType] = { totalTokens: 0, totalValue: 0 };
        }
        nativeMap[wallet.tokenType].totalTokens += amount;
        nativeMap[wallet.tokenType].totalValue += amount * price;
      }

      for (const token of wallet.erc20Tokens ?? []) {
        if (token.balance === "0") continue;
        const erc20Meta = getErc20Metadata(token.symbol);
        if (!erc20Meta) continue;
        const amount = parseInt(token.balance) / Math.pow(10, token.decimals);
        const tokenPrice = erc20PricesMap[token.symbol.toUpperCase()] ?? 0;
        const sym = token.symbol.toUpperCase();
        if (!erc20Map[sym]) {
          erc20Map[sym] = { totalTokens: 0, totalValue: 0, symbol: token.symbol };
        }
        erc20Map[sym].totalTokens += amount;
        erc20Map[sym].totalValue += amount * tokenPrice;
      }
    }

    const combined: Omit<AllocationRow, "percentage">[] = [];

    for (const [tokenType, { totalTokens, totalValue }] of Object.entries(nativeMap)) {
      const meta = TOKEN_METADATA[tokenType as TokenType];
      if (!meta) continue;
      combined.push({
        key: tokenType,
        logoPath: meta.logoPath,
        name: meta.name,
        symbol: meta.symbol,
        totalTokens,
        totalValue,
      });
    }

    for (const [sym, { totalTokens, totalValue }] of Object.entries(erc20Map)) {
      const meta = getErc20Metadata(sym);
      if (!meta) continue;
      combined.push({
        key: sym,
        logoPath: meta.logoPath,
        name: meta.name,
        symbol: sym,
        totalTokens,
        totalValue,
      });
    }

    const grandTotal = combined.reduce((sum, r) => sum + r.totalValue, 0);

    return combined
      .sort((a, b) => b.totalValue - a.totalValue)
      .map((r) => ({
        ...r,
        percentage: grandTotal > 0 ? (r.totalValue / grandTotal) * 100 : 0,
      }));
  }, [walletsSortedByBalance, getPriceByTokenType, erc20PricesMap]);

  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;
  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("token")}</TableHead>
              <TableHead>{t("amount")}</TableHead>
              <TableHead>{t("value")}</TableHead>
              <TableHead className="text-right">{t("allocation")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ key, logoPath, name, symbol, totalTokens, totalValue, percentage }) => (
              <TableRow key={key}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Image src={logoPath} alt={symbol} width={24} height={24} />
                    <span className="font-medium">{name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <PrivacyValue>
                    <span className="font-medium">
                      {totalTokens.toLocaleString(locale, {
                        maximumFractionDigits: symbol === "BTC" ? 8 : 2,
                      })}{" "}
                      {symbol}
                    </span>
                  </PrivacyValue>
                </TableCell>
                <TableCell>
                  <PrivacyValue>
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
                      value={totalValue}
                    />
                  </PrivacyValue>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <AllocationPieChart percentage={percentage} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
