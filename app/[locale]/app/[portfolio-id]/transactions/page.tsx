"use client";

import { useTokenStats } from "@/lib/hooks/useTokenStats";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { FormattedTransaction } from "@/lib/services/blockbook";
import { TokenType } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
// eslint-disable-next-line
import { useParams } from "next/navigation";
import InfiniteScroll from "react-infinite-scroll-component";
import DayLabel from "./_components/DayLabel";
import SkeletonCards from "./_components/SkeletonCards";
import TransactionCard from "./_components/TransactionCard";

const formatDayKey = (blockTime: number): string =>
  new Date(blockTime * 1000).toISOString().slice(0, 10);

const formatDayLabel = (dayKey: string, locale: string): string =>
  formatDate(
    dayKey,
    { day: "numeric", month: "long", year: "numeric" },
    locale,
  );

const TransactionsPage = () => {
  const params = useParams();
  const portfolioId = params["portfolio-id"] as string;
  const t = useTranslations("Transactions");
  const locale = useLocale();

  const {
    transactions,
    walletCount,
    fetchNextPage,
    hasNextPage,
    isPending,
    isError,
  } = useTransactions(portfolioId);

  const { getPriceByTokenType } = useTokenStats();

  const grouped = transactions.reduce<Record<string, FormattedTransaction[]>>(
    (acc, tx) => {
      const day = tx.blockTime > 0 ? formatDayKey(tx.blockTime) : "pending";
      if (!acc[day]) acc[day] = [];
      acc[day].push(tx);
      return acc;
    },
    {},
  );

  const sortedDays = Object.keys(grouped).sort((a, b) => {
    if (a === "pending") return -1;
    if (b === "pending") return 1;
    return b.localeCompare(a);
  });

  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <div className="flex items-center justify-center py-12 text-destructive text-sm">
          {t("error")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

      {isPending ? (
        <SkeletonCards />
      ) : walletCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <p className="text-muted-foreground">{t("noWallets")}</p>
          <p className="text-sm text-muted-foreground">{t("noWalletsDesc")}</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <p className="text-muted-foreground">{t("noTransactions")}</p>
          <p className="text-sm text-muted-foreground">
            {t("noTransactionsDesc")}
          </p>
        </div>
      ) : (
        <InfiniteScroll
          dataLength={transactions.length}
          next={fetchNextPage}
          hasMore={hasNextPage}
          loader={<SkeletonCards />}
          scrollThreshold={0.5}
          className="overflow-x-hidden!"
        >
          {sortedDays.map((day) => (
            <div key={day} className="flex flex-col gap-2 mb-6">
              <DayLabel
                label={
                  day === "pending" ? t("pending") : formatDayLabel(day, locale)
                }
              />
              <div className="flex flex-col gap-2">
                {grouped[day].map((tx) => (
                  <TransactionCard
                    key={tx.txid}
                    tx={tx}
                    tokenPrice={
                      tx.tokenType
                        ? getPriceByTokenType(tx.tokenType as TokenType) ?? 0
                        : 0
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </InfiniteScroll>
      )}
    </div>
  );
};

export default TransactionsPage;
