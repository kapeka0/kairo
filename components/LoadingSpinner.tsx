import { cn } from "@/lib/utils";
import { Loader } from "lucide-react";
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
  return <Loader className={cn("animate-spin ", sizeMap[size], className)} />;
};

export default LoadingSpinner;
