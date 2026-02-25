"use client";

import { Pie, PieChart } from "recharts";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AllocationPieChart({ percentage }: { percentage: number }) {
  const data = [
    { value: percentage, fill: "#60a5fa" },
    { value: 100 - percentage, fill: "hsl(var(--muted))" },
  ];
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span className="inline-flex cursor-default">
            <PieChart width={32} height={32}>
              <Pie
                data={data}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                innerRadius={7}
                outerRadius={15}
                strokeWidth={0}
                isAnimationActive={false}
              />
            </PieChart>
          </span>
        </TooltipTrigger>
        <TooltipContent>{percentage.toFixed(1)}%</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
