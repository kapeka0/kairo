"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_CRYPTOCURRENCIES } from "@/lib/utils/constants";

interface AssetStep1Props {
  onNext: (cryptocurrency: string) => void;
}

export default function AssetStep1({ onNext }: AssetStep1Props) {
  const tForm = useTranslations("Wallets.form");
  const [selected, setSelected] = useState<string>("BTC");

  return (
    <div className="space-y-4 w-full pb-1">
      <div className="space-y-1">
        <label className="text-sm text-muted-foreground font-normal">
          {tForm("cryptocurrency")}
        </label>
        <Select value={selected} onValueChange={(v) => { if (v) setSelected(v); }}>
          <SelectTrigger>
            <SelectValue>
              {(() => {
                const crypto = SUPPORTED_CRYPTOCURRENCIES.find(
                  (c) => c.value === selected,
                );
                return crypto ? (
                  <div className="flex items-center gap-2">
                    <div className="relative shrink-0">
                      <Image
                        src={crypto.logo}
                        alt={crypto.value}
                        width={16}
                        height={16}
                      />
                      {crypto.parentChain && (
                        <Image
                          src={
                            SUPPORTED_CRYPTOCURRENCIES.find(
                              (c) => c.value === crypto.parentChain,
                            )?.logo || ""
                          }
                          alt={crypto.parentChain}
                          width={8}
                          height={8}
                          className="absolute -bottom-0.5 -right-0.5 rounded-full ring-1 ring-background"
                        />
                      )}
                    </div>
                    <span>{crypto.label}</span>
                    {crypto.parentChain && (
                      <span className="text-xs text-muted-foreground">
                        on {crypto.parentChain}
                      </span>
                    )}
                  </div>
                ) : null;
              })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_CRYPTOCURRENCIES.map((crypto) => (
              <SelectItem key={crypto.value} value={crypto.value}>
                <div className="flex items-center gap-2">
                  <div className="relative shrink-0">
                    <Image
                      src={crypto.logo}
                      alt={crypto.value}
                      width={16}
                      height={16}
                    />
                    {crypto.parentChain && (
                      <Image
                        src={
                          SUPPORTED_CRYPTOCURRENCIES.find(
                            (c) => c.value === crypto.parentChain,
                          )?.logo || ""
                        }
                        alt={crypto.parentChain}
                        width={8}
                        height={8}
                        className="absolute -bottom-0.5 -right-0.5 rounded-full ring-1 ring-background"
                      />
                    )}
                  </div>
                  <span>{crypto.label}</span>
                  {crypto.parentChain && (
                    <span className="text-xs text-muted-foreground">
                      on {crypto.parentChain}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button className="w-full" onClick={() => onNext(selected)}>
        {tForm("next")}
      </Button>
    </div>
  );
}
