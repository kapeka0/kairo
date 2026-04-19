"use client";

import LandingNavbar from "@/components/global/LandingNavbar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/routing";
import { useUser } from "@/lib/hooks/useUser";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
  const t = useTranslations("LandingPage");
  const { user, isPending } = useUser();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const logoSrc =
    mounted && resolvedTheme === "dark"
      ? "/images/logos/logo-square-light.svg"
      : "/images/logos/logo-square.svg";

  return (
    <div className="relative min-h-screen">
      <LandingNavbar />
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <Image
          src={logoSrc}
          alt="Kairo"
          width={120}
          height={36}
          className="mb-8 h-20 w-auto"
          priority
        />
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
          {t("description")}
        </p>
        <div className="mt-8">
          {isPending ? (
            <Skeleton className="h-10 w-32" />
          ) : user ? (
            <Link href="/app">
              <Button size="lg">{t("ctaSignedIn")}</Button>
            </Link>
          ) : (
            <Link href="/sign-in">
              <Button size="lg">{t("ctaSignedOut")}</Button>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
