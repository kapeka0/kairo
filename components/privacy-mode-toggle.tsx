"use client";

import { IconSwitch } from "@/components/ui/IconSwitch";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { privacyModeAtom } from "@/lib/atoms/PrivacyMode";
import { useAtom } from "jotai";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

export function PrivacyModeToggle() {
  const [privacyMode, setPrivacyMode] = useAtom(privacyModeAtom);
  const tG = useTranslations("Global");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        setPrivacyMode((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setPrivacyMode]);

  return (
    <Tooltip>
      <TooltipTrigger>
        <IconSwitch
          onCheckedChange={(checked) => setPrivacyMode(checked)}
          checked={privacyMode}
          size="sm"
          thumbIcon={(checked) =>
            checked ? <EyeOff className="text-muted-foreground" /> : <Eye />
          }
        />
      </TooltipTrigger>
      <TooltipContent>
        <p className="flex gap-1 items-center text-xs ">
          {tG("privacyMode")}
          <KbdGroup>
            <Kbd>⌘+P</Kbd>
          </KbdGroup>
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
