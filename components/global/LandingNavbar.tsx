"use client";

import LangToggle from "@/components/global/LangToggle";
import { ThemeToggle } from "@/components/global/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/routing";
import { useUser } from "@/lib/hooks/useUser";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";

function LandingNavbar() {
  const t = useTranslations("Navbar");
  const { user, isPending } = useUser();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const logoSrc =
    mounted && resolvedTheme === "light"
      ? "/images/logos/logo-dark.svg"
      : "/images/logos/logo-light.svg";

  return (
    <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5">
      <Link href="/" className="flex items-center">
        <Image
          src={logoSrc}
          alt="Kairo"
          width={80}
          height={24}
          className="h-6 w-auto"
          priority
        />
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <LangToggle />
        {isPending ? (
          <Skeleton className="h-9 w-24" />
        ) : user ? (
          <Link href="/app">
            <Button>{t("dashboard")}</Button>
          </Link>
        ) : (
          <Link href="/sign-in">
            <Button>{t("signIn")}</Button>
          </Link>
        )}
      </div>
    </header>
  );
}

export default LandingNavbar;
