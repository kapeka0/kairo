"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/routing";
import { createPortfolio } from "@/lib/actions/portfolio";
import { activePortfolioIdAtom } from "@/lib/atoms/ActivePortfolio";
import { devLog } from "@/lib/utils";
import { CURRENCIES } from "@/lib/utils/constants";
import { useSetAtom } from "jotai";

const formSchema = z.object({
  name: z.string().min(1).max(50),
  currency: z.enum(["USD", "EUR", "GBP", "JPY", "CNY"]),
});

type CreatePortfolioFormData = z.infer<typeof formSchema>;

type Props = {
  triggerButton?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const CreatePortfolioModal = ({ triggerButton, open, onOpenChange }: Props) => {
  const tNew = useTranslations("New");
  const tErrors = useTranslations("New.errors");
  const [internalOpen, setInternalOpen] = useState(false);
  const router = useRouter();
  const setActivePortfolioId = useSetAtom(activePortfolioIdAtom);
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  const { execute, isPending } = useAction(createPortfolio, {
    onError: (e) => {
      devLog("[CreatePortfolioModal] Error creating portfolio", e);

      if (e.error.validationErrors?.name) {
        toast.error(tErrors("invalidName"));
      } else if (e.error.validationErrors?.currency) {
        toast.error(tErrors("invalidCurrency"));
      } else if (e.error.serverError?.includes("duplicate")) {
        toast.error(tErrors("duplicateName"));
      } else {
        toast.error(tErrors("unexpected"));
      }
    },
    onSuccess: ({ data }) => {
      setActivePortfolioId(data.portfolio.id);
      toast.success(tNew("createSuccess"));
      devLog("[CreatePortfolioModal] Portfolio created successfully", data);
      setIsOpen(false);
      form.reset();
      router.push("/app" + `/${data.portfolio.id}`);
    },
  });

  const form = useForm<CreatePortfolioFormData>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      currency: "USD",
    },
  });

  const onSubmit = async (data: CreatePortfolioFormData) => {
    execute(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {triggerButton && (
        <DialogTrigger
          className="w-full"
          render={<div className="w-full" />}
          nativeButton={false}
        >
          {triggerButton}
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tNew("createPortfolio")}</DialogTitle>
          <DialogDescription>{tNew("description")}</DialogDescription>
        </DialogHeader>
        <div className="w-full space-y-3">
          <Form {...form}>
            <form
              className="space-y-4 w-full pb-1"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormLabel className="text-sm text-muted-foreground font-normal">
                      {tNew("portfolioName")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        disabled={isPending}
                        placeholder={tNew("portfolioNamePlaceholder")}
                        {...field}
                        className="placeholder:text-muted-foreground/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormLabel className="text-sm text-muted-foreground font-normal">
                      {tNew("portfolioCurrency")}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={tNew("selectCurrency")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="min-w-50">
                        {CURRENCIES.map((currency) => (
                          <SelectItem
                            key={currency.value}
                            value={currency.value}
                          >
                            <span className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                {currency.symbol}
                              </span>
                              {currency.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="w-full" disabled={isPending} type="submit">
                {!isPending ? (
                  tNew("createPortfolio")
                ) : (
                  <Loader2 className="size-4 animate-spin" />
                )}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePortfolioModal;
