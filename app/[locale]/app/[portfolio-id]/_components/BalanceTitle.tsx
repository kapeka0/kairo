"use client";
import { GradientText } from "@/components/global/GradientText";
import { PrivacyValue } from "@/components/privacy-value";
import { Skeleton } from "@/components/ui/skeleton";
import { activePortfolioBalanceInUserCurrencyAtom } from "@/lib/atoms/PortfolioAtoms";
import { useCurrencyRates } from "@/lib/hooks/useCurrencyRates";
import { usePortfolios } from "@/lib/hooks/usePortfolios";
import { CurrencyCode } from "@/lib/types";
import { CURRENCIES } from "@/lib/utils/constants";
import NumberFlow from "@number-flow/react";
import { useAtomValue } from "jotai";
import { useLocale } from "next-intl";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { useEffect, useState } from "react";

const CURRENCY_VALUES: CurrencyCode[] = ["USD", "EUR", "GBP", "JPY", "CNY"];

type Props = {};

const BalanceTitle = (props: Props) => {
  const activePortfolioBalance = useAtomValue(
    activePortfolioBalanceInUserCurrencyAtom,
  );

  const [displayValue, setdisplayValue] = useState<number>(0);
  const locale = useLocale();
  const { activePortfolio } = usePortfolios();
  const currency = activePortfolio?.currency;

  const { convertAmount } = useCurrencyRates(currency);

  const [urlCurrency, setUrlCurrency] = useQueryState(
    "currency",
    parseAsStringEnum<CurrencyCode>(CURRENCY_VALUES),
  );

  const displayCurrency: CurrencyCode = urlCurrency ?? ((currency ?? "USD") as CurrencyCode);

  useEffect(() => {
    if (activePortfolioBalance !== 0) {
      setdisplayValue(activePortfolioBalance);
    }
  }, [activePortfolioBalance]);

  const setNextCurrency = () => {
    const currencies = CURRENCIES.map((c) => c.value as CurrencyCode);
    const currentIndex = currencies.indexOf(displayCurrency);
    const nextIndex = (currentIndex + 1) % currencies.length;
    setUrlCurrency(currencies[nextIndex]);
  };

  const rawBalance = displayValue;
  const displayBalance = convertAmount(rawBalance, displayCurrency);

  return (
    <PrivacyValue>
      {displayBalance ? (
        <div className="flex items-end gap-4 ">
          <GradientText
            variant="fire"
            className="text-4xl font-bold tracking-tight tabular-nums cursor-pointer"
            as="h1"
          >
            <NumberFlow
              value={displayBalance}
              locales={locale}
              trend={0}
              // plugins={[continuous]}
              onClick={setNextCurrency}
              format={{
                style: "currency",
                currency: displayCurrency,
                currencySign: "standard",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
                trailingZeroDisplay: "stripIfInteger",
              }}
            />
          </GradientText>
        </div>
      ) : (
        <Skeleton className="h-10 w-48" />
      )}
    </PrivacyValue>
  );
};

export default BalanceTitle;
