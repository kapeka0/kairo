"use client";

import { useSetAtom } from "jotai";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "@/i18n/routing";
import { deletePortfolio } from "@/lib/actions/portfolio";
import { activePortfolioIdAtom } from "@/lib/atoms/PortfolioAtoms";
import { usePortfolios } from "@/lib/hooks/usePortfolios";

export default function DeletePortfolioCard() {
  const t = useTranslations("Settings.delete");
  const { activePortfolio } = usePortfolios();
  const setActivePortfolioId = useSetAtom(activePortfolioIdAtom);
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { execute, isPending } = useAction(deletePortfolio, {
    onError: () => {
      toast.error(t("errors.unexpected"));
    },
    onSuccess: () => {
      toast.success(t("success"));
      setActivePortfolioId(null);
      setOpen(false);
      router.push("/app");
    },
  });

  const handleDelete = () => {
    if (!activePortfolio) return;
    execute({ portfolioId: activePortfolio.id });
  };

  return (
    <Card className="">
      <CardHeader>
        <CardTitle className="text-destructive">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-end">
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger
            render={<Button variant="destructive">{t("button")}</Button>}
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("confirmDescription", {
                  portfolioName: activePortfolio?.name ?? "",
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>
                {t("confirmCancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isPending}
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  t("confirmAction")
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
