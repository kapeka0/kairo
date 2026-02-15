"use client";

import { privacyModeAtom } from "@/lib/atoms/LocalSettings";
import { cn } from "@/lib/utils";
import { useAtom } from "jotai";

interface PrivacyValueProps {
  children: React.ReactNode;
  className?: string;
}

export function PrivacyValue({ children, className }: PrivacyValueProps) {
  const [privacyMode] = useAtom(privacyModeAtom);

  if (!privacyMode) {
    return <span className={className}>{children}</span>;
  }

  return (
    <span
      className={cn(
        "relative inline-block",
        "blur-sm select-none",
        "transition-all duration-200",
        className,
      )}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}
