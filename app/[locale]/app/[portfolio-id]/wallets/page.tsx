"use client";

import { useTranslations } from "next-intl";
import PageTitle from "../_components/PageTitle";
import AddWalletButton from "./_components/AddWalletButton";
import WalletsTable from "./_components/WalletsTable";

export default function WalletsPage() {
  const tWallets = useTranslations("Wallets");

  return (
    <div className="flex flex-1 flex-col space-y-4">
      <PageTitle text={tWallets("title")} />
      <div className="flex w-full justify-end">
        <AddWalletButton />
      </div>
      <WalletsTable />
    </div>
  );
}
