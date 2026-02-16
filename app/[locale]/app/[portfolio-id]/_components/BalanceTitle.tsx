"use client";
import { GradientText } from "@/components/global/GradientText";
import { activePortfolioBalanceInUserCurrencyAtom } from "@/lib/atoms/PortfolioAtoms";
import { useCurrencyRates } from "@/lib/hooks/useCurrencyRates";
import { usePortfolios } from "@/lib/hooks/usePortfolios";
import { CurrencyCode } from "@/lib/types";
import { CURRENCIES } from "@/lib/utils/constants";
import NumberFlow, { continuous } from "@number-flow/react";
import { useAtomValue } from "jotai";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

type Props = {};

const BalanceTitle = (props: Props) => {
  const activePortfolioBalance = useAtomValue(
    activePortfolioBalanceInUserCurrencyAtom,
  );

  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode | null>(
    null,
  );
  const [displayValue, setdisplayValue] = useState<number>(0);
  const locale = useLocale();
  const { activePortfolio } = usePortfolios();
  const currency = activePortfolio?.currency;

  const { convertAmount } = useCurrencyRates(currency);

  useEffect(() => {
    if (currency) {
      setDisplayCurrency(currency);
    }
  }, [currency]);

  useEffect(() => {
    if (activePortfolioBalance !== 0) {
      setdisplayValue(activePortfolioBalance);
    }
  }, [activePortfolioBalance]);

  const setNextCurrency = () => {
    const currencies = CURRENCIES.map((c) => c.value);
    const currentIndex = currencies.indexOf(displayCurrency || "USD");
    const nextIndex = (currentIndex + 1) % currencies.length;
    setDisplayCurrency(currencies[nextIndex] as CurrencyCode);
  };

  const rawBalance = displayValue;
  const displayBalance = displayCurrency
    ? convertAmount(rawBalance, displayCurrency)
    : rawBalance;

  return (
    <GradientText
      variant="fire"
      className="text-4xl font-bold tracking-tight tabular-nums cursor-pointer"
      as="h1"
    >
      <NumberFlow
        value={displayBalance}
        locales={locale}
        trend={0}
        plugins={[continuous]}
        onClick={setNextCurrency}
        format={{
          style: "currency",
          currency: displayCurrency || "USD",
          currencySign: "standard",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          trailingZeroDisplay: "stripIfInteger",
        }}
      />
    </GradientText>
  );
};

export default BalanceTitle;
