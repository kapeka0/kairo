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
import { devLog } from "@/lib/utils";
import { CURRENCIES } from "@/lib/utils/constants";

const formSchema = z.object({
  name: z.string().min(1).max(50),
  currency: z.enum(["USD", "EUR", "GBP", "JPY", "CNY"]),
});

type CreatePortfolioFormData = z.infer<typeof formSchema>;

type Props = {
  triggerButton: React.ReactNode;
};



const CreatePortfolioModal = ({ triggerButton }: Props) => {
  const tNew = useTranslations("New");
  const tErrors = useTranslations("New.errors");
  const [open, setOpen] = useState(false);
     const router = useRouter();
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
    onSuccess: ({data}) => {
      toast.success(tNew("createSuccess"));
      devLog("[CreatePortfolioModal] Portfolio created successfully", data);
      // Redirect to the new portfolio page after creation
      router.push("/app" + `/${data.portfolio.id}`); 
      setOpen(false);
      form.reset();

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger><div>{triggerButton}</div></DialogTrigger>
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
                          <SelectValue
                            placeholder={tNew("selectCurrency")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="min-w-[200px]">
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
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
              <Button
                className="w-full"
                disabled={isPending}
                type="submit"
              >
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