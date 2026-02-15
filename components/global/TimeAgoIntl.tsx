"use client";

import { useLocale } from "next-intl";
import ReactTimeAgo from "react-timeago";

import { cn } from "@/lib/utils";

type Props = {
  date: string | number | Date;
  className?: string;
  live?: boolean;
  minPeriod?: number;
  maxPeriod?: number;
  title?: string;
  component?: string | React.FC;
  style?: "default" | "short" | "narrow";
};

const TimeAgoIntl = ({
  date,
  className,
  live = true,
  minPeriod = 60,
  maxPeriod = 86400,
  title,
  component = "time",
  style = "default",
}: Props) => {
  const locale = useLocale();

  // Custom formatter using Intl.RelativeTimeFormat
  const formatter = (value: number, unit: string, suffix: string) => {
    const rtf = new Intl.RelativeTimeFormat(locale, {
      numeric: "auto",
      style:
        style === "short" ? "short" : style === "narrow" ? "narrow" : "long",
    });

    // Map react-timeago units to Intl.RelativeTimeFormat units
    const unitMap: Record<string, Intl.RelativeTimeFormatUnit> = {
      second: "second",
      minute: "minute",
      hour: "hour",
      day: "day",
      week: "week",
      month: "month",
      year: "year",
    };

    const intlUnit = unitMap[unit] || "second";
    const timeValue = suffix === "ago" ? -Math.abs(value) : Math.abs(value);

    return rtf.format(timeValue, intlUnit);
  };

  return (
    <ReactTimeAgo
      date={date}
      formatter={formatter}
      live={live}
      minPeriod={minPeriod}
      maxPeriod={maxPeriod}
      title={title}
      component={component}
      //@ts-expect-error type mismatch with react-timeago
      className={cn("text-sm ", className)}
    />
  );
};

export default TimeAgoIntl;
