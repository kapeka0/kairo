"use client";

import { Button } from "@/components/ui/button";
import { useAddressTags } from "@/lib/hooks/useAddressTags";
import { useTransactions } from "@/lib/hooks/useTransactions";
import { FormattedTransaction } from "@/lib/services/blockbook";
import { formatDate } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
// eslint-disable-next-line
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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

  const [allTransactions, setAllTransactions] = useState<
    FormattedTransaction[]
  >([]);

  const {
    transactions,
    totalPages,
    walletCount,
    isPending,
    isError,
    page,
    setPage,
  } = useTransactions(portfolioId, 25);

  const { tagMap, upsertTag, deleteTag } = useAddressTags(portfolioId);

  useEffect(() => {
    if (transactions.length === 0) return;
    if (page === 1) {
      setAllTransactions(transactions);
    } else {
      setAllTransactions((prev) => {
        const existingIds = new Set(prev.map((tx) => tx.txid));
        const newOnes = transactions.filter((tx) => !existingIds.has(tx.txid));
        return [...prev, ...newOnes];
      });
    }
  }, [transactions, page]);

  const handleLoadMore = () => {
    setPage((p) => p + 1);
  };

  const grouped = allTransactions.reduce<
    Record<string, FormattedTransaction[]>
  >((acc, tx) => {
    const day = tx.blockTime > 0 ? formatDayKey(tx.blockTime) : "pending";
    if (!acc[day]) acc[day] = [];
    acc[day].push(tx);
    return acc;
  }, {});

  const sortedDays = Object.keys(grouped).sort((a, b) => {
    if (a === "pending") return -1;
    if (b === "pending") return 1;
    return b.localeCompare(a);
  });

  const hasMore = page < totalPages;

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

      {walletCount === 0 && !isPending ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <p className="text-muted-foreground">{t("noWallets")}</p>
          <p className="text-sm text-muted-foreground">{t("noWalletsDesc")}</p>
        </div>
      ) : allTransactions.length === 0 && !isPending ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <p className="text-muted-foreground">{t("noTransactions")}</p>
          <p className="text-sm text-muted-foreground">
            {t("noTransactionsDesc")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {isPending && allTransactions.length === 0 ? (
            <SkeletonCards />
          ) : (
            <>
              {sortedDays.map((day) => (
                <div key={day} className="flex flex-col gap-2">
                  <DayLabel
                    label={
                      day === "pending"
                        ? t("pending")
                        : formatDayLabel(day, locale)
                    }
                  />
                  <div className="flex flex-col gap-2">
                    {grouped[day].map((tx) => (
                      <TransactionCard
                        key={tx.txid}
                        tx={tx}
                        tagMap={tagMap}
                        onUpsertTag={upsertTag}
                        onDeleteTag={deleteTag}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {isPending && <SkeletonCards />}
            </>
          )}

          {hasMore && !isPending && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={handleLoadMore}>
                {t("loadMore")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
