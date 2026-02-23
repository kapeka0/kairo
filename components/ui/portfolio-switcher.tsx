"use client";

import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Bottleneck from "bottleneck";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { ChevronsUpDown, Plus } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

import CreatePortfolioModal from "@/app/[locale]/app/create/_components/CreatePortfolioModal";
import { PrivacyValue } from "@/components/privacy-value";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname, useRouter } from "@/i18n/routing";
import {
  activePortfolioBalanceInUserCurrencyAtom,
  activePortfolioIdAtom,
  portfolioBalancesAtom,
} from "@/lib/atoms/PortfolioAtoms";
import { usePortfolios } from "@/lib/hooks/usePortfolios";
import { Portfolio, TokenType, Wallet } from "@/lib/types";
import { devLog } from "@/lib/utils";
import { calculateWalletBalanceInCurrency } from "@/lib/utils/balance";
import { CURRENCIES } from "@/lib/utils/constants";

interface WalletsResponse {
  wallets: Wallet[];
}

interface TokenPriceResponse {
  price: number;
  currency: string;
  tokenType: string;
}

const portfolioLimiter = new Bottleneck({
  maxConcurrent: 3,
  minTime: 500,
});

export function PortfolioSwitcher() {
  const t = useTranslations("PortfolioSwitcher");
  const router = useRouter();
  const pathname = usePathname();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const activePortfolioBalance = useAtomValue(
    activePortfolioBalanceInUserCurrencyAtom,
  );
  const portfolioBalances = useAtomValue(portfolioBalancesAtom);
  const setPortfolioBalances = useSetAtom(portfolioBalancesAtom);
  const format = useFormatter();
  const queryClient = useQueryClient();

  const getCurrencySymbol = (currencyCode: string) => {
    return (
      CURRENCIES.find((c) => c.value === currencyCode)?.symbol || currencyCode
    );
  };
  const { isMobile } = useSidebar();
  const { data: portfolios, isLoading } = usePortfolios();
  const [activePortfolioId, setActivePortfolioId] = useAtom(
    activePortfolioIdAtom,
  );

  const activePortfolio = useMemo(() => {
    if (!portfolios || portfolios.length === 0) return null;

    if (activePortfolioId) {
      const found = portfolios.find((p) => p.id === activePortfolioId);
      if (found) return found;
    }

    return portfolios[0];
  }, [portfolios, activePortfolioId]);

  useEffect(() => {
    if (activePortfolio && activePortfolio.id !== activePortfolioId) {
      setActivePortfolioId(activePortfolio.id);
    }
  }, [activePortfolio, activePortfolioId, setActivePortfolioId]);

  const calculatePortfolioBalance = useCallback(
    async (portfolio: Portfolio) => {
      try {
        const coingeckoCurrency = CURRENCIES.find(
          (c) => c.value === portfolio.currency,
        )?.coingeckoValue;

        if (!coingeckoCurrency) {
          devLog(`No coingecko currency mapping for ${portfolio.currency}`);
          return 0;
        }

        const { data: walletsData } = await axios.get<WalletsResponse>(
          `/api/wallets/${portfolio.id}`,
        );
        const wallets = walletsData.wallets;

        queryClient.setQueryData(["wallets", portfolio.id], { wallets });

        if (!wallets || wallets.length === 0) {
          setPortfolioBalances((prev) => ({ ...prev, [portfolio.id]: 0 }));
          return 0;
        }

        const walletsByTokenType = wallets.reduce((acc, wallet) => {
          if (!acc[wallet.tokenType]) acc[wallet.tokenType] = [];
          acc[wallet.tokenType].push(wallet);
          return acc;
        }, {} as Record<TokenType, Wallet[]>);

        const pricePromises = Object.keys(walletsByTokenType).map((tokenType) =>
          axios.get<TokenPriceResponse>(`/api/token/price`, {
            params: { tokenType, currency: coingeckoCurrency },
          }),
        );

        const priceResponses = await Promise.all(pricePromises);
        // @ts-expect-error - We know the tokenType will be a valid key in the priceMap
        const priceMap: Record<TokenType, number> = {};

        priceResponses.forEach((response) => {
          priceMap[response.data.tokenType as TokenType] = response.data.price;
        });

        let totalBalance = 0;

        for (const [tokenType, tokenWallets] of Object.entries(
          walletsByTokenType,
        )) {
          const tokenPrice = priceMap[tokenType as TokenType];

          for (const wallet of tokenWallets) {
            totalBalance += calculateWalletBalanceInCurrency(
              wallet,
              tokenPrice,
            );
          }
        }

        setPortfolioBalances((prev) => ({
          ...prev,
          [portfolio.id]: totalBalance,
        }));

        return totalBalance;
      } catch (error) {
        devLog(
          `Error calculating balance for portfolio ${portfolio.id}:`,
          error,
        );
        return 0;
      }
    },
    [setPortfolioBalances, queryClient],
  );

  useEffect(() => {
    if (!portfolios || !activePortfolioId) return;

    const active = portfolios.find((p) => p.id === activePortfolioId);
    if (active) {
      calculatePortfolioBalance(active);
    }
  }, [portfolios, activePortfolioId, calculatePortfolioBalance]);

  useEffect(() => {
    if (!portfolios || portfolios.length === 0) return;

    const inactivePortfolios = portfolios.filter(
      (p) => p.id !== activePortfolioId,
    );

    Promise.all(
      inactivePortfolios.map((portfolio) =>
        portfolioLimiter.schedule(() => calculatePortfolioBalance(portfolio)),
      ),
    );
  }, [portfolios, activePortfolioId, calculatePortfolioBalance]);

  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled className="w-full">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted animate-pulse" />
            <div className="grid flex-1 text-left text-sm leading-tight gap-1">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-3 w-16 bg-muted animate-pulse rounded" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!portfolios || portfolios.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <CreatePortfolioModal
            open={isCreateModalOpen}
            onOpenChange={setIsCreateModalOpen}
            triggerButton={
              <SidebarMenuButton size="lg" className="w-full">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg border-2 border-dashed">
                  <Plus className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {t("createPortfolio")}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {t("getStarted")}
                  </span>
                </div>
              </SidebarMenuButton>
            }
          />
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!activePortfolio) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              />
            }
          >
            <Avatar className="size-8 rounded-lg">
              <AvatarImage
                src={activePortfolio.gradientUrl}
                alt={activePortfolio.name}
                className="rounded-lg"
              />
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {activePortfolio.name}
              </span>{" "}
              <span className="truncate text-xs text-muted-foreground">
                {" "}
                <PrivacyValue>
                  {format.number(activePortfolioBalance, {
                    style: "currency",
                    currency: activePortfolio.currency,
                  })}
                </PrivacyValue>
              </span>{" "}
            </div>
            <ChevronsUpDown className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                {t("portfolios")}
              </DropdownMenuLabel>
              {portfolios.map((portfolio, index) => {
                const balance = portfolioBalances[portfolio.id];
                const hasBalance = balance !== undefined;

                return (
                  <DropdownMenuItem
                    key={portfolio.id}
                    onClick={() => {
                      setActivePortfolioId(portfolio.id);
                      const newPath = pathname.replace(
                        activePortfolioId ?? "",
                        portfolio.id,
                      );

                      router.push(newPath);
                    }}
                    className="gap-2 p-2"
                  >
                    <Avatar size="sm" className="rounded-lg">
                      <AvatarImage
                        src={portfolio.gradientUrl}
                        alt={portfolio.name}
                        className="rounded-lg"
                      />
                    </Avatar>
                    <div className="flex flex-col flex-1">
                      <span className="text-sm">{portfolio.name}</span>
                      <PrivacyValue>
                        <span className="text-xs text-muted-foreground">
                          {hasBalance ? (
                            format.number(balance, {
                              style: "currency",
                              currency: portfolio.currency,
                            })
                          ) : (
                            <span className="opacity-50">
                              {format.number(0, {
                                style: "currency",
                                currency: portfolio.currency,
                              })}
                            </span>
                          )}
                        </span>
                      </PrivacyValue>
                    </div>
                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            <div
              onClick={() => {
                setIsCreateModalOpen(true);
                setDropdownOpen(false);
              }}
              className="focus:bg-accent hover:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:text-destructive not-data-[variant=destructive]:focus:**:text-accent-foreground min-h-7 gap-2 rounded-md px-2 py-1 text-xs/relaxed data-inset:pl-7.5 [&_svg:not([class*='size-'])]:size-3.5 group/dropdown-menu-item relative flex cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0"
            >
              <div className="flex size-6 items-center justify-center rounded-md border border-border">
                <Plus className="size-4 text-muted-foreground group-hover:text-primary" />
              </div>
              <div className="text-muted-foreground group-hover:text-primary">
                {t("addPortfolio")}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <CreatePortfolioModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
