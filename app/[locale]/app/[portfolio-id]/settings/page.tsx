"use client";

import { useTranslations } from "next-intl";
import PageTitle from "../_components/PageTitle";
import DeletePortfolioCard from "./_components/DeletePortfolioCard";
import PortfolioCurrencyCard from "./_components/PortfolioCurrencyCard";
import PortfolioNameCard from "./_components/PortfolioNameCard";

export default function SettingsPage() {
  const t = useTranslations("Settings");

  return (
    <div className="flex flex-1 flex-col space-y-6">
      <PageTitle text={t("title")} />
      <div className="space-y-4 w-full">
        <PortfolioNameCard />
        <PortfolioCurrencyCard />
      </div>
      <div className="w-full space-y-2">
        <p className="text-sm font-medium text-destructive">{t("danger")}</p>
        <DeletePortfolioCard />
      </div>
    </div>
  );
}
