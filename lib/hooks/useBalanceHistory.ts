"use client";

import { useAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { activePortfolioIdAtom } from "../atoms/PortfolioAtoms";
import { Period } from "../types";

export type BalanceHistoryEntry = {
  date: string;
  totalUsd: number;
};

export function useBalanceHistory(period: Period) {
  const [activePortfolioId] = useAtom(activePortfolioIdAtom);

  const query = useQuery({
    queryKey: ["balance-history", activePortfolioId, period],
    queryFn: async () => {
      const { data } = await axios.get<BalanceHistoryEntry[]>(
        `/api/portfolio/${activePortfolioId}/balance-history`,
        { params: { period } },
      );
      return data;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!activePortfolioId,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
