"use client";

import { PrivacyModeToggle } from "@/components/privacy-mode-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTranslations } from "next-intl";
//eslint-disable-next-line
import { usePathname } from "next/navigation";

export function AppHeader() {
  const pathname = usePathname();
  const tSidebar = useTranslations("Sidebar");
  type SidebarKey = Parameters<typeof tSidebar>[0];
  const routeNames: Record<string, SidebarKey> = {
    "": "dashboard",
    wallets: "wallets",
    transactions: "transactions",
    settings: "settings",
  };

  const segments = pathname.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      lastSegment,
    );

  const currentRoute = isUUID ? "" : lastSegment;
  const pageName = routeNames[currentRoute] || "dashboard";

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{tSidebar(pageName)}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <PrivacyModeToggle />
        </div>
      </div>
    </header>
  );
}
