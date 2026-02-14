"use client";

import { IconPicker } from "@/components/IconPicker";
import { WALLET_ICONS } from "@/lib/utils/constants";

interface WalletIconPickerProps {
  value?: string | null;
  gradientUrl: string;
  onValueChange?: (value: string | null) => void;
}

export default function WalletIconPicker({
  value,
  gradientUrl,
  onValueChange,
}: WalletIconPickerProps) {
  const icons = [
    {
      name: "Default Gradient",
      src: gradientUrl,
    },
    ...WALLET_ICONS,
  ];

  const handleChange = (src: string) => {
    if (src === gradientUrl) {
      onValueChange?.(null);
    } else {
      onValueChange?.(src);
    }
  };

  return (
    <IconPicker
      icons={icons}
      value={value || gradientUrl}
      onValueChange={handleChange}
      defaultOpen={true}
    />
  );
}
