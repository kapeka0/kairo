// @ts-ignore - allow global CSS side-effect import in Next.js app directory
import "../globals.css";

import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import localFont from "next/font/local";

import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { i18nConfig } from "@/i18n/i18nConfig";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

const satoshi = localFont({
  src: [
    {
      path: "../../public/font/Satoshi-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/font/Satoshi-LightItalic.otf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../../public/font/Satoshi-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/font/Satoshi-Italic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/font/Satoshi-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/font/Satoshi-MediumItalic.otf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../../public/font/Satoshi-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/font/Satoshi-BoldItalic.otf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../../public/font/Satoshi-Black.otf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../../public/font/Satoshi-BlackItalic.otf",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-satoshi",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

  if (!routing.locales.includes(locale as any)) {
    console.log("No locale");
    return redirect(`/${cookieLocale || i18nConfig.defaultLocale}/not-found`);
  }
  setRequestLocale(locale);
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* icon */}
        <link
          rel="icon"
          href="/images/logos/logo.svg"
          type="image/svg+xml"
          sizes="any"
        />
        {/* TODO: Remove this for production */}
        <script
          src="https://unpkg.com/react-scan/dist/auto.global.js"
          async
        ></script>
      </head>
      <body
        className={cn(`${satoshi.className}   h-full antialiased `)}
      >
        {" "}
        <NextIntlClientProvider messages={messages}>
          <div className="">
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <main className="relative flex flex-col min-h-screen">
                {/* Providers */}
                {/* Navbar */}
                <div className="grow flex-1">{children}</div>
                {/* Footer */}
              </main>
              <Toaster />
            </ThemeProvider>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
