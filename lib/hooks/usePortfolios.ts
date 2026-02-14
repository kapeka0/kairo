"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
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
  return useQuery({
    queryKey: ["portfolios"],
    queryFn: fetchPortfolios,
    staleTime: 1000 * 60 * 5,
    retry: (failureCount, error) => {
      if (error.message === "Unauthorized") {
        return false;
      }
      return failureCount < 3;
    },
  });
};
