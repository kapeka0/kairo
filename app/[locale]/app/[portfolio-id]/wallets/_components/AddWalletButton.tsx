"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import AddWalletDialog from "./AddWalletDialog";

const AddWalletButton = () => {
  const tWallets = useTranslations("Wallets");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  return (
    <AddWalletDialog
      open={isDialogOpen}
      onOpenChange={setIsDialogOpen}
      triggerButton={
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {tWallets("addWallet")}
        </Button>
      }
    />
  );
};

export default AddWalletButton;
