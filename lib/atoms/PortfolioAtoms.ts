import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const activePortfolioIdAtom = atomWithStorage<string | null>(
  "activePortfolioId",
  null,
);

export const portfolioBalancesAtom = atom<Record<string, number>>({});

export const activePortfolioBalanceInUserCurrencyAtom = atom((get) => {
  const portfolioBalances = get(portfolioBalancesAtom);
  const activePortfolioId = get(activePortfolioIdAtom);
  return activePortfolioId ? portfolioBalances[activePortfolioId] || 0 : 0;
});
