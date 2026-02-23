"use client";

import { FormattedTransaction } from "@/lib/services/blockbook";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";

interface TransactionsResponse {
  transactions: FormattedTransaction[];
  totalPages: number;
  walletCount: number;
}

async function fetchTransactionsPage(
  portfolioId: string,
  page: number,
  pageSize: number,
): Promise<TransactionsResponse> {
  const { data } = await axios.get<TransactionsResponse>(
    `/api/portfolio/${portfolioId}/transactions`,
    { params: { page, pageSize } },
  );
  return data;
}

export function useTransactions(portfolioId: string, pageSize: number = 1000) {
  const query = useInfiniteQuery({
    queryKey: ["transactions", portfolioId, pageSize],
    queryFn: ({ pageParam }) =>
      fetchTransactionsPage(portfolioId, pageParam as number, pageSize),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length + 1;
      return nextPage <= lastPage.totalPages ? nextPage : undefined;
    },
    enabled: !!portfolioId,
    staleTime: 60_000, //  1 minute
    refetchInterval: 60_000, // 1 minute
  });

  const allTransactions =
    query.data?.pages.flatMap((p) => p.transactions) ?? [];
  const walletCount = query.data?.pages[0]?.walletCount ?? 0;

  return {
    transactions: allTransactions,
    walletCount,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
  };
}
