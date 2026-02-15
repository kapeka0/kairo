import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const activePortfolioIdAtom = atomWithStorage<string | null>(
  "activePortfolioId",
  null,
);

export const activePortfolioBalanceInUserCurrencyAtom = atom<number>(0);
