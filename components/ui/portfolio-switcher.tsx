"use client";

import { useAtom, useAtomValue } from "jotai";
import { ChevronsUpDown, Plus } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

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
import { CURRENCIES } from "@/lib/utils/constants";
import { useEffect, useMemo, useState } from "react";

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
  const format = useFormatter();

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

  // We should never get here since we check the user has at least one portfolio in the root layout, but this is a fallback just in case
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
              {/* <AvatarFallback className="rounded-lg">
                <Wallet className="size-4" />
              </AvatarFallback> */}
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {activePortfolio.name}
              </span>{" "}
              <PrivacyValue>
                <span className="truncate text-xs text-muted-foreground">
                  {format.number(activePortfolioBalance, {
                    style: "currency",
                    currency: activePortfolio.currency,
                  })}
                </span>{" "}
              </PrivacyValue>
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
