import { useTranslations } from "next-intl";
import { BalancePeriodChange } from "./_components/BalancePeriodChange";
import BalanceTitle from "./_components/BalanceTitle";
import { MarketOverview } from "./_components/MarketOverview";
import PageTitle from "./_components/PageTitle";
import { PeriodTabs } from "./_components/PeriodTabs";
import { PortfolioBalanceChart } from "./_components/PortfolioBalanceChart";

export default function DashboardPage({
  params,
}: {
  params: Promise<{ "portfolio-id": string; locale: string }>;
}) {
  const tDashboard = useTranslations("Dashboard");

  return (
    <div className="flex flex-1 flex-col space-y-3">
      <div className="flex flex-col items-start gap-1">
        <PageTitle text={tDashboard("title")} />
        <BalanceTitle />
        <div className="flex w-full items-end justify-between">
          <BalancePeriodChange />
          <PeriodTabs />
        </div>
      </div>
      <PortfolioBalanceChart />
      <MarketOverview />
    </div>
  );
}
