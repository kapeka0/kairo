"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WalletStep1Data } from "@/lib/validations/wallet";
import AssetStep1 from "./AssetStep1";
import AssetStep2 from "./AssetStep2";

type Props = {
  walletId: string | null;
  portfolioId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AddAssetDialog({
  walletId,
  portfolioId,
  open,
  onOpenChange,
}: Props) {
  const tForm = useTranslations("Wallets.form");
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [selectedCrypto, setSelectedCrypto] = useState<string | null>(null);

  const handleStep1 = (crypto: string) => {
    setSelectedCrypto(crypto);
    setCurrentStep(2);
  };

  const handleSuccess = () => {
    onOpenChange(false);
    setCurrentStep(1);
    setSelectedCrypto(null);
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setCurrentStep(1);
      setSelectedCrypto(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tForm("addAssetTitle")}</DialogTitle>
          <DialogDescription>{tForm("addAssetDescription")}</DialogDescription>
        </DialogHeader>
        <div className="w-full space-y-3">
          {currentStep === 1 && <AssetStep1 onNext={handleStep1} />}
          {currentStep === 2 && walletId && selectedCrypto && (
            <AssetStep2
              walletId={walletId}
              cryptocurrency={selectedCrypto}
              portfolioId={portfolioId}
              onBack={() => setCurrentStep(1)}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
