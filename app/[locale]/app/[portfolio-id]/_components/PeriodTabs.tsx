"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBalanceHistory } from "@/lib/hooks/useBalanceHistory";
import { PERIOD_VALUES, usePeriod } from "@/lib/hooks/usePeriod";
import { Period } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface PeriodTabsProps {
  className?: string;
}

export function PeriodTabs({ className }: PeriodTabsProps) {
  const [period, setPeriod] = usePeriod();
  const t = useTranslations("BalanceChart");
  const { isPending } = useBalanceHistory(period);
  const getPeriodLabel = (p: Period): string => {
    switch (p) {
      case "7d":
        return "1W";
      case "30d":
        return "1M";
      case "90d":
        return "3M";
      case "180d":
        return "6M";
      case "365d":
        return "1Y";
      default:
        return p;
    }
  };

  return isPending ? (
    <Skeleton className="h-6 w-52" />
  ) : (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {PERIOD_VALUES.map((p) => (
        <Tooltip key={p}>
          <TooltipTrigger
            render={
              <button
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-2.5 py-0.5 text-xs font-medium rounded transition-colors",
                  period === p
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              />
            }
          >
            {getPeriodLabel(p)}
          </TooltipTrigger>
          <TooltipContent>{t(p)}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
