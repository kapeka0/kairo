import { cn } from "@/lib/utils";
import React from "react";

type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-10 h-10",
};

const LoadingSpinner: React.FC<Props> = ({ size = "md", className }) => {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-4 border-t-blue-500 border-gray-200",
        sizeMap[size],
        className,
      )}
    />
  );
};

export default LoadingSpinner;
