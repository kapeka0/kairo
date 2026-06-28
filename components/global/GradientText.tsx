import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

type GradientVariant = "sunset" | "ocean" | "aurora" | "fire" | "candy";

const gradientColorMap: Record<GradientVariant, [string, string, string]> = {
  sunset: ["#f87171", "#fbbf24", "#c084fc"],
  ocean: ["#06b6d4", "#3b82f6", "#8b5cf6"],
  aurora: ["#34d399", "#22d3ee", "#a78bfa"],
  fire: ["#f97316", "#ef4444", "#ec4899"],
  candy: ["#f472b6", "#c084fc", "#60a5fa"],
};

interface GradientTextProps {
  children: ReactNode;
  variant?: GradientVariant;
  className?: string;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div";
}

export function GradientText({
  children,
  variant = "sunset",
  className,
  as: Component = "span",
}: GradientTextProps) {
  const [from, via, to] = gradientColorMap[variant];
  const style: CSSProperties = {
    backgroundImage: `linear-gradient(to right, ${from}, ${via}, ${to})`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: "transparent",
  };

  return (
    <Component className={cn("inline-block", className)} style={style}>
      {children}
    </Component>
  );
}
