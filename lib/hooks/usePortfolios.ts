"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAtom } from "jotai";
import { activePortfolioIdAtom } from "../atoms/PortfolioAtoms";
import { PortfoliosResponse } from "../types";
import { devLog } from "../utils";

const fetchPortfolios = async (): Promise<PortfoliosResponse> => {
  try {
    const { data } = await axios.get<PortfoliosResponse>("/api/portfolio");
    return data;
  } catch (error) {
    devLog("Error fetching portfolios:", error);
    throw error;
  }
};

export const usePortfolios = () => {
  const [activePortfolioId] = useAtom(activePortfolioIdAtom);
  const query = useQuery({
    queryKey: ["portfolios"],
    queryFn: fetchPortfolios,
    staleTime: 1000 * 60 * 5,
  });
  const activePortfolio = query.data?.find((p) => p.id === activePortfolioId);

  return {
    ...query,
    activePortfolio,
  };
};
