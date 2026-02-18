"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { NavItem } from "./app-sidebar";

export function NavMain({ items }: { items: NavItem[] }) {
  const tS = useTranslations("Sidebar");
  const pathname = usePathname();
  const { open } = useSidebar();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{tS("portfolio")}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasSubItems =
            Array.isArray(item.items) && item.items.length > 0;

          if (hasSubItems) {
            return (
              <Collapsible
                key={item.title}
                defaultOpen={item.isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger>
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items!.map((subItem) => {
                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton>
                              <Link
                                href={subItem.url}
                                className={cn("font-medium", {
                                  "text-sidebar-foreground/70!":
                                    !subItem.isActive,
                                  "bg-accent  text-primary! hover:text-primary!":
                                    subItem.isActive,
                                })}
                              >
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                className={cn("font-medium p-0", {
                  "p-0": open,
                  "text-sidebar-foreground/70!": !item.isActive,
                  "bg-linear-to-l from-primary/15 to-transparent text-primary hover:text-primary!":
                    item.isActive,
                })}
              >
                <Link
                  href={item.url}
                  className={cn("flex items-center gap-2 flex-1  h-full", {
                    "px-2": open,
                  })}
                >
                  {item.icon}
                  <span>{item.title}</span>{" "}
                </Link>{" "}
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
