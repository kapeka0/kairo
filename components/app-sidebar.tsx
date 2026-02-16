"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { usePathname } from "@/i18n/routing";
import {
  Activity,
  LayoutDashboard,
  Package,
  WalletMinimal,
} from "lucide-react";
import { useTranslations } from "next-intl";
//eslint-disable-next-line
import { useParams } from "next/navigation";
import { PortfolioSwitcher } from "./ui/portfolio-switcher";

export interface NavItem {
  title: string;
  url: string;
  icon?: React.ReactElement;
  isActive: boolean;
  items?: NavItem[];
}

interface NavData {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  navMain: NavItem[];
  // projects: { name: string; url: string; icon?: React.ComponentType<any> }[];
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const params = useParams();
  const portfolioId = (params["portfolio-id"] as string) || "main-portfolio";
  const tSidebar = useTranslations("Sidebar");

  // TODO: Remove when database is implemented
  const data: NavData = {
    user: {
      name: "Kapeka",
      email: "m@example.com",
      avatar: "/avatars/kapeka.jpg",
    },
    navMain: [
      {
        title: tSidebar("dashboard"),
        url: `/app/${portfolioId}`,
        icon: <LayoutDashboard />,
        isActive: pathname.endsWith(`/${portfolioId}`),
      },
      {
        title: tSidebar("wallets"),
        url: `/app/${portfolioId}/wallets`,
        icon: <WalletMinimal />,
        isActive: pathname.includes(`/${portfolioId}/wallets`),
      },
      {
        title: tSidebar("tokens"),
        url: `/app/${portfolioId}/tokens`,
        isActive: pathname.includes(`/${portfolioId}/tokens`),
        icon: <Package />,
      },
      {
        title: tSidebar("activity"),
        url: `/app/${portfolioId}/activity`,
        isActive: pathname.includes(`/${portfolioId}/activity`),
        icon: <Activity />,
      },
    ],
    // projects: [
    //   {
    //     name: "Design Engineering",
    //     url: "#",
    //     icon: <FrameIcon />,
    //   },
    //   {
    //     name: "Sales & Marketing",
    //     url: "#",
    //     icon: <PieChartIcon />,
    //   },
    //   {
    //     name: "Travel",
    //     url: "#",
    //     icon: <MapIcon />,
    //   },
    // ],
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <PortfolioSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
