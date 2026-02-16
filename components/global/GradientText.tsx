import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type GradientVariant = "sunset" | "ocean" | "aurora" | "fire" | "candy";

const gradientMap: Record<GradientVariant, string> = {
  sunset: "from-[#f87171] via-[#fbbf24] to-[#c084fc]",
  ocean: "from-[#06b6d4] via-[#3b82f6] to-[#8b5cf6]",
  aurora: "from-[#34d399] via-[#22d3ee] to-[#a78bfa]",
  fire: "from-[#f97316] via-[#ef4444] to-[#ec4899]",
  candy: "from-[#f472b6] via-[#c084fc] to-[#60a5fa]",
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
  return (
    <Component
      className={cn(
        "bg-linear-to-r bg-clip-text text-transparent",
        gradientMap[variant],
        className,
      )}
    >
      {children}
    </Component>
  );
}
