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
import { useWallets } from "@/lib/hooks/useWallets";
import { TokenType } from "@/lib/types";
import { TOKEN_METADATA } from "@/lib/utils/token-metadata";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { AllocationPieChart } from "./AllocationPieChart";

export function TokenAllocationTable() {
  const portfolioId = useAtomValue(activePortfolioIdAtom);
  const t = useTranslations("Dashboard.tokenAllocation");
  const locale = useLocale();
  const { activePortfolio } = usePortfolios();
  const currency = activePortfolio?.currency;
  const { walletsSortedByBalance, isLoading, getWalletBalanceInCurrency } =
    useWallets(portfolioId!);

  const grouped = useMemo(() => {
    return walletsSortedByBalance.reduce<
      Record<
        string,
        { tokenType: TokenType; totalRaw: number; totalValue: number }
      >
    >((acc, wallet) => {
      const key = wallet.tokenType;
      if (!acc[key]) {
        acc[key] = { tokenType: wallet.tokenType, totalRaw: 0, totalValue: 0 };
      }
      acc[key].totalRaw += parseInt(wallet.lastBalanceInTokens || "0");
      acc[key].totalValue += getWalletBalanceInCurrency(wallet);
      return acc;
    }, {});
  }, [walletsSortedByBalance, getWalletBalanceInCurrency]);

  const groupedValues = Object.values(grouped);
  const totalPortfolioValue = useMemo(() => {
    return groupedValues.reduce((sum, item) => sum + item.totalValue, 0);
  }, [groupedValues]);

  const rows = useMemo(() => {
    return groupedValues
      .sort((a, b) => b.totalValue - a.totalValue)
      .map(({ tokenType, totalRaw, totalValue }) => {
        const metadata = TOKEN_METADATA[tokenType];
        const totalTokens = totalRaw / Math.pow(10, metadata.decimals);
        const percentage =
          totalPortfolioValue > 0
            ? (totalValue / totalPortfolioValue) * 100
            : 0;
        return { tokenType, metadata, totalTokens, totalValue, percentage };
      });
  }, [groupedValues, totalPortfolioValue]);

  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

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
            {rows.map(
              ({
                tokenType,
                metadata,
                totalTokens,
                totalValue,
                percentage,
              }) => (
                <TableRow key={tokenType}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Image
                        src={metadata.logoPath}
                        alt={metadata.symbol}
                        width={24}
                        height={24}
                      />
                      <span className="font-medium">{metadata.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <PrivacyValue>
                      <span className="font-medium">
                        {totalTokens.toFixed(Math.min(metadata.decimals, 8))}{" "}
                        {metadata.symbol}
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
              ),
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
