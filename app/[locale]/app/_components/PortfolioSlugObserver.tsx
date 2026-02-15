"use client";

import { activePortfolioIdAtom } from "@/lib/atoms/PortfolioAtoms";
import { devLog } from "@/lib/utils";
import { useAtom } from "jotai";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function PortfolioSlugObserver() {
  const pathname = usePathname();
  const [activePortfolioId, setActivePortfolioId] = useAtom(
    activePortfolioIdAtom,
  );

  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);
    const appIndex = segments.indexOf("app");

    if (appIndex !== -1 && segments[appIndex + 1]) {
      const potentialUuid = segments[appIndex + 1];

      if (
        UUID_REGEX.test(potentialUuid) &&
        potentialUuid !== activePortfolioId
      ) {
        devLog(
          "Updating active portfolio ID to",
          potentialUuid,
          activePortfolioId,
        );
        setActivePortfolioId(potentialUuid);
      }
    }
  }, [pathname, setActivePortfolioId]);

  return null;
}
