"use client";

import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useMemo, useState } from "react";

export interface IconDefinition {
  /** Display label used for search filtering */
  name: string;
  /** Image path (e.g. "/icons/home.svg") — this is the value stored/returned */
  src: string;
  /** Optional tags/acronyms for additional search terms (e.g. ["BTC"] for Bitcoin) */
  tags?: string[];
}

interface IconPickerProps {
  icons: IconDefinition[];
  /** The currently selected icon `src` */
  value?: string;
  /** Called with the icon `src` string — ready to persist in your DB */
  onValueChange?: (src: string) => void;
  placeholder?: string;
  className?: string;
  /** Whether the popover should be open by default */
  defaultOpen?: boolean;
}

export function IconPicker({
  icons,
  value,
  onValueChange,
  placeholder = "",
  className,
  defaultOpen = false,
}: IconPickerProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [search, setSearch] = useState("");
  const tGlobal = useTranslations("Global");
  const filtered = useMemo(() => {
    if (!search) return icons;
    const searchLower = search.toLowerCase();
    return icons.filter((icon) => {
      const nameMatch = icon.name.toLowerCase().includes(searchLower);
      const tagsMatch = icon.tags?.some(tag =>
        tag.toLowerCase().includes(searchLower)
      );
      return nameMatch || tagsMatch;
    });
  }, [icons, search]);

  const selected = useMemo(
    () => icons.find((i) => i.src === value),
    [icons, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger nativeButton={false} render={<span></span>}>
        <button
          type="button"
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className,
          )}
          aria-label={selected ? selected.name : placeholder}
        >
          {selected ? (
            <Image
              src={selected.src}
              alt={selected.name}
              width={20}
              height={20}
            />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <Input
          placeholder={tGlobal("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2 h-8 text-sm"
        />
        <ScrollArea className="h-52">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {tGlobal("noIcons")}
            </p>
          ) : (
            <div className="grid grid-cols-5 gap-1">
              {filtered.map((icon) => (
                <button
                  key={icon.src}
                  type="button"
                  onClick={() => {
                    onValueChange?.(icon.src);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex h-10 w-full items-center justify-center rounded-md transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    value === icon.src && "bg-accent",
                  )}
                  aria-label={icon.name}
                  title={icon.name}
                >
                  <Image
                    src={icon.src}
                    alt={icon.name}
                    width={16}
                    height={16}
                  />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
