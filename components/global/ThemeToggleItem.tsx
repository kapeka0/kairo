"use client";

import { MonitorCog, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function ThemeToggleItem() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("Global");
  return (
    <DropdownMenuItem
      onClick={() =>
        setTheme(
          theme === "light" ? "dark" : theme === "dark" ? "system" : "light",
        )
      }
    >
      {theme === "light" ? (
        <Sun className="" />
      ) : theme === "dark" ? (
        <Moon className="" />
      ) : (
        <MonitorCog className="" />
      )}
      {theme === "light"
        ? t("light")
        : theme === "dark"
        ? t("dark")
        : t("system")}
    </DropdownMenuItem>
  );
}
