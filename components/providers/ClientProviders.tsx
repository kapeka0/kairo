"use client";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider } from "jotai";
import { IntlErrorCode, NextIntlClientProvider } from "next-intl";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import React from "react";
import { TooltipProvider } from "../ui/tooltip";

type Props = {
  children: React.ReactNode;
  messages: Record<string, any>;
  locale: string;
};

const queryClient = new QueryClient({
  defaultOptions: {},
});

const ClientProviders = ({ children, messages, locale }: Props) => {
  return (
    <NuqsAdapter>
    <NextIntlClientProvider
      messages={messages}
      locale={locale}
      timeZone="UTC"
      onError={(err) => {
        if (err.code === IntlErrorCode.MISSING_MESSAGE) {
          return;
        }
        throw err;
      }}
    >
      <Provider>
        <QueryClientProvider client={queryClient}>
          {" "}
          <ReactQueryDevtools initialIsOpen={false} />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>{children}</TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </Provider>
    </NextIntlClientProvider>
    </NuqsAdapter>
  );
};

export default ClientProviders;
