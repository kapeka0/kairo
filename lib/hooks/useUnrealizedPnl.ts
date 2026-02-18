"use client";

import { useAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { activePortfolioIdAtom } from "../atoms/PortfolioAtoms";

export type UnrealizedPnlData = {
  unrealizedPnlUsd: number;
  unrealizedPnlPercent: number;
  pmp: number;
  costBasisUsd: number;
  currentValueUsd: number;
} | null;

export function useUnrealizedPnl() {
  const [activePortfolioId] = useAtom(activePortfolioIdAtom);

  const query = useQuery({
    queryKey: ["unrealized-pnl", activePortfolioId],
    queryFn: async () => {
      const { data } = await axios.get<UnrealizedPnlData>(
        `/api/portfolio/${activePortfolioId}/unrealized-pnl`,
      );
      return data;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!activePortfolioId,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
