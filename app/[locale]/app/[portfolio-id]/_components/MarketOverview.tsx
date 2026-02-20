"use client";

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
import { useDisplayCurrency } from "@/lib/hooks/useDisplayCurrency";
import { useMarketCoins } from "@/lib/hooks/useMarketCoins";
import { CoinMarketItem } from "@/lib/services/coingecko";
import { cn } from "@/lib/utils";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import { Triangle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { memo, useMemo } from "react";
import { Line, LineChart, YAxis } from "recharts";

function PercentageCell({
  value,
  locale,
}: {
  value: number | null;
  locale: string;
}) {
  if (value === null) {
    return <span className="text-muted-foreground tabular-nums">—</span>;
  }
  const isPositive = value >= 0;
  return (
    <span
      className={cn(
        "flex items-center gap-0.5 tabular-nums justify-end",
        isPositive ? "text-green-500" : "text-red-500",
      )}
    >
      {isPositive ? (
        <Triangle className="size-2.5 fill-current stroke-none" />
      ) : (
        <Triangle className="size-2.5 fill rotate-180 fill-current stroke-none" />
      )}
      <NumberFlow
        locales={locale}
        value={Math.abs(value)}
        format={{
          style: "decimal",
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
          trailingZeroDisplay: "stripIfInteger",
        }}
      />
      %
    </span>
  );
}

const SparklineCell = memo(function SparklineCell({
  coin,
}: {
  coin: CoinMarketItem;
}) {
  const prices = coin.sparkline_in_7d?.price;
  const isUp = (coin.price_change_percentage_7d_in_currency ?? 0) >= 0;
  const stroke = isUp ? "#22c55e" : "#ef4444";
  const data = useMemo(() => prices?.map((p) => ({ v: p })), [prices]);

  if (!prices || prices.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <LineChart
      width={80}
      height={32}
      data={data}
      margin={{ top: 2, right: 0, left: 0, bottom: 2 }}
    >
      <YAxis domain={["dataMin", "dataMax"]} hide />
      <Line
        dataKey="v"
        dot={false}
        strokeWidth={1.5}
        stroke={stroke}
        isAnimationActive={false}
      />
    </LineChart>
  );
});

const CoinRow = memo(function CoinRow({
  coin,
  locale,
  currency,
}: {
  coin: CoinMarketItem;
  locale: string;
  currency: string;
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <Image
            src={coin.image}
            alt={coin.name}
            width={24}
            height={24}
            className="rounded-full"
            unoptimized
          />
          <div className="flex flex-col">
            <span className="font-medium leading-tight">{coin.name}</span>
            <span className="text-muted-foreground text-xs uppercase">
              {coin.symbol}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums font-mono">
        {coin.current_price === null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <NumberFlow
            locales={locale}
            value={coin.current_price}
            format={{
              style: "currency",
              currency,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
              trailingZeroDisplay: "stripIfInteger",
            }}
          />
        )}
      </TableCell>
      <TableCell className="text-right">
        <PercentageCell
          value={coin.price_change_percentage_1h_in_currency}
          locale={locale}
        />
      </TableCell>
      <TableCell className="text-right">
        <PercentageCell
          value={coin.price_change_percentage_24h_in_currency}
          locale={locale}
        />
      </TableCell>
      <TableCell className="text-right">
        <PercentageCell
          value={coin.price_change_percentage_7d_in_currency}
          locale={locale}
        />
      </TableCell>
      <TableCell className="text-right tabular-nums font-mono hidden md:table-cell">
        {coin.total_volume === null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <NumberFlow
            locales={locale}
            value={coin.total_volume}
            format={{
              style: "currency",
              currency,
              notation: "compact",
              maximumFractionDigits: 2,
              trailingZeroDisplay: "stripIfInteger",
            }}
          />
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums font-mono hidden md:table-cell">
        {coin.market_cap === null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <NumberFlow
            locales={locale}
            value={coin.market_cap}
            format={{
              style: "currency",
              currency,
              notation: "compact",
              maximumFractionDigits: 2,
              trailingZeroDisplay: "stripIfInteger",
            }}
          />
        )}
      </TableCell>
      <TableCell className="text-right hidden lg:table-cell">
        <div className="flex justify-end">
          <SparklineCell coin={coin} />
        </div>
      </TableCell>
    </TableRow>
  );
});

export function MarketOverview() {
  const t = useTranslations("MarketOverview");
  const locale = useLocale();
  const { displayCurrency } = useDisplayCurrency();
  const { data: coins, isPending, isError } = useMarketCoins();

  if (isPending) {
    return <Skeleton className="h-75 w-full rounded-xl" />;
  }

  if (isError || !coins) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <NumberFlowGroup>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("coin")}</TableHead>
                <TableHead className="text-right">{t("price")}</TableHead>
                <TableHead className="text-right">{t("change1h")}</TableHead>
                <TableHead className="text-right">{t("change24h")}</TableHead>
                <TableHead className="text-right">{t("change7d")}</TableHead>
                <TableHead className="text-right hidden md:table-cell">
                  {t("volume")}
                </TableHead>
                <TableHead className="text-right hidden md:table-cell">
                  {t("marketCap")}
                </TableHead>
                <TableHead className="text-right hidden lg:table-cell">
                  {t("chart7d")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coins.map((coin) => (
                <CoinRow
                  key={coin.id}
                  coin={coin}
                  locale={locale}
                  currency={displayCurrency}
                />
              ))}
            </TableBody>
          </Table>
        </NumberFlowGroup>
      </CardContent>
    </Card>
  );
}
