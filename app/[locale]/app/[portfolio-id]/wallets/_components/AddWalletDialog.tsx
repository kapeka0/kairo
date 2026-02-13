"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
//eslint-disable-next-line
import { useParams } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { WalletStep1Data } from "@/lib/validations/wallet";
import WalletStep1 from "./WalletStep1";
import WalletStep2 from "./WalletStep2";

type Props = {
  triggerButton?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function AddWalletDialog({
  triggerButton,
  open,
  onOpenChange,
}: Props) {
  const tForm = useTranslations("Wallets.form");
  const params = useParams();
  const portfolioId = params["portfolio-id"] as string;

  const [internalOpen, setInternalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<WalletStep1Data | null>(null);

  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  const handleStep1Complete = (data: WalletStep1Data) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSuccess = () => {
    setIsOpen(false);
    setCurrentStep(1);
    setStep1Data(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setCurrentStep(1);
      setStep1Data(null);
    }
  };

  const getDialogTitle = () => {
    if (currentStep === 1) {
      return tForm("step1Title");
    }
    if (step1Data?.cryptocurrency === "BTC") {
      return tForm("step2TitleBtc");
    }
    return tForm("step1Title");
  };

  const getDialogDescription = () => {
    if (currentStep === 1) {
      return tForm("step1Description");
    }
    if (step1Data?.cryptocurrency === "BTC") {
      return tForm("step2DescriptionBtc");
    }
    return tForm("step1Description");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {triggerButton && (
        <DialogTrigger nativeButton={false} render={<span></span>}>
          {triggerButton}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>
        <div className="w-full space-y-3">
          {currentStep === 1 && (
            <WalletStep1
              defaultValues={step1Data || undefined}
              onNext={handleStep1Complete}
            />
          )}
          {currentStep === 2 && step1Data && (
            <WalletStep2
              step1Data={step1Data}
              portfolioId={portfolioId}
              onBack={handleBack}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
