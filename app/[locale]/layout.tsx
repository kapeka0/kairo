// @ts-ignore - allow global CSS side-effect import in Next.js app directory
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import localFont from "next/font/local";
import "../globals.css";

import ClientProviders from "@/components/providers/ClientProviders";
import { Toaster } from "@/components/ui/sonner";
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

  setRequestLocale(locale);
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* icon */}
        <link
          rel="icon"
          href="/images/logos/logo-square.svg"
          type="image/svg+xml"
          sizes="any"
        />

        {process.env.NODE_ENV === "development" && (
          <script
            src="https://unpkg.com/react-scan/dist/auto.global.js"
            async
          ></script>
        )}
      </head>
      <body className={cn(`${satoshi.className}   h-full antialiased `)}>
        <ClientProviders messages={messages} locale={locale}>
          <main className="relative flex flex-col min-h-screen">
            <div className="grow flex-1">{children}</div>
          </main>
          <Toaster />
        </ClientProviders>
      </body>
    </html>
  );
}
