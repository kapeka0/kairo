"use client";

import { PrivacyValue } from "@/components/privacy-value";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tag, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

interface AddressCellProps {
  address: string;
  tag: string | undefined;
  onUpsert: (address: string, tag: string) => void;
  onDelete: (address: string) => void;
}

const AddressCell = ({
  address,
  tag,
  onUpsert,
  onDelete,
}: AddressCellProps) => {
  const t = useTranslations("Transactions");
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(tag ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(tag ?? "");
  }, [tag]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onUpsert(address, trimmed);
    }
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const handleDelete = () => {
    onDelete(address);
    setValue("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PrivacyValue className="group flex items-center gap-1.5 min-w-0">
        <span className="font-mono text-sm truncate text-muted-foreground">
          {tag ? (
            <Tooltip>
              <TooltipTrigger>
                <span>{tag}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{address}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            address
          )}
        </span>
        <PopoverTrigger
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground bg-transparent border-0 p-0 cursor-pointer"
          aria-label={t("editTag")}
        >
          <Tag className="size-3" />
        </PopoverTrigger>
      </PrivacyValue>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground font-mono truncate">
            {address}
          </p>
          <div className="flex gap-1.5">
            <Input
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSubmit}
              placeholder={t("labelAddress")}
              className="h-8 text-sm"
            />
            {tag && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 "
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                aria-label={t("removeTag")}
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AddressCell;
