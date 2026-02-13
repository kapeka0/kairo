"use client";

import { CRYPTO_FORM_MAP, type CryptoType } from "./crypto-forms";
import type { WalletStep1Data } from "@/lib/validations/wallet";

interface WalletStep2Props {
  step1Data: WalletStep1Data;
  portfolioId: string;
  onBack: () => void;
  onSuccess: () => void;
}

export default function WalletStep2({
  step1Data,
  portfolioId,
  onBack,
  onSuccess,
}: WalletStep2Props) {
  const CryptoForm = CRYPTO_FORM_MAP[step1Data.cryptocurrency as CryptoType];

  if (!CryptoForm) {
    return <div>Unsupported cryptocurrency</div>;
  }

  return (
    <CryptoForm
      walletName={step1Data.name}
      cryptocurrency={step1Data.cryptocurrency}
      portfolioId={portfolioId}
      onBack={onBack}
      onSuccess={onSuccess}
    />
  );
}
