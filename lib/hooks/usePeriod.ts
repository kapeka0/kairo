"use client";

import { Period } from "@/lib/types";
import { parseAsStringEnum, useQueryState } from "nuqs";

export const PERIOD_VALUES: Period[] = ["7d", "30d", "90d", "180d", "365d"];

export function usePeriod() {
  return useQueryState<Period>(
    "period",
    parseAsStringEnum<Period>(PERIOD_VALUES).withDefault("30d"),
  );
}
