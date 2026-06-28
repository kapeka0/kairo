"use client";
import { GradientText } from "@/components/global/GradientText";
import { PrivacyValue } from "@/components/privacy-value";
import { Skeleton } from "@/components/ui/skeleton";
import { activePortfolioBalanceInUserCurrencyAtom } from "@/lib/atoms/PortfolioAtoms";
import { useCurrencyRates } from "@/lib/hooks/useCurrencyRates";
import { useDisplayCurrency } from "@/lib/hooks/useDisplayCurrency";
import { usePortfolios } from "@/lib/hooks/usePortfolios";
import { useWallets } from "@/lib/hooks/useWallets";
import { useAtomValue } from "jotai";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

const BalanceTitle = () => {
  const activePortfolioBalance = useAtomValue(
    activePortfolioBalanceInUserCurrencyAtom,
  );

  const [displayValue, setDisplayValue] = useState<number>(0);
  const locale = useLocale();
  const { activePortfolio } = usePortfolios();
  const { data, isPending } = useWallets();
  const hasWallets = !!data && data.wallets.length > 0 && !isPending;
  const currency = activePortfolio?.currency;

  const { convertAmount } = useCurrencyRates(currency);
  const { displayCurrency } = useDisplayCurrency();

  useEffect(() => {
    if (activePortfolioBalance !== 0) {
      setDisplayValue(activePortfolioBalance);
    }
  }, [activePortfolioBalance]);

  const displayBalance = convertAmount(displayValue, displayCurrency);

  const formatted =
    displayBalance != null && displayBalance > -1
      ? new Intl.NumberFormat(locale, {
          style: "currency",
          currency: displayCurrency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(displayBalance)
      : null;

  return (
    <PrivacyValue>
      {hasWallets ? (
        formatted != null ? (
          <div className="flex items-end gap-4">
            <GradientText
              variant="fire"
              className="text-4xl font-bold tracking-tight tabular-nums"
              as="h1"
            >
              {formatted}
            </GradientText>
          </div>
        ) : (
          <Skeleton className="h-10 w-48" />
        )
      ) : (
        <Skeleton className="h-10 w-48" />
      )}
    </PrivacyValue>
  );
};

export default BalanceTitle;
