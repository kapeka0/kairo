"use client";

import { FormattedTransaction } from "@/lib/services/blockbook";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";

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

export function useTransactions(portfolioId: string, pageSize: number = 25) {
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["transactions", portfolioId, page, pageSize],
    queryFn: () => fetchTransactionsPage(portfolioId, page, pageSize),
    enabled: !!portfolioId,
    staleTime: 60_000,
  });

  return {
    transactions: query.data?.transactions ?? [],
    totalPages: query.data?.totalPages ?? 1,
    walletCount: query.data?.walletCount ?? 0,
    isLoading: query.isLoading,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    page,
    setPage,
  };
}
