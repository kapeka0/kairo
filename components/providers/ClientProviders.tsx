"use client";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider } from 'jotai';
import { IntlErrorCode, NextIntlClientProvider } from "next-intl";
import React from "react";

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
    <NextIntlClientProvider
      messages={messages}
      locale={locale}
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
            {children}
          </ThemeProvider>
        </QueryClientProvider>
      </Provider>
    </NextIntlClientProvider>
  );
};

export default ClientProviders;
