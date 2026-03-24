"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { renameFundSourceAction } from "~/app/manage/fund-source/actions";
import ActionConfirmButton from "~/components/pages/manage/shared/action-confirm-button";
import { Card, CardContent } from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  updateFundSourceSchema,
  type UpdateFundSourceFormValues,
} from "~/schema/manage/fund-source.schema";
import type { FundSourceWithBalance } from "~/usecase/manage/fund-source.usecase";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const FundSourceRow = ({
  userId,
  fundSource,
}: Readonly<{ userId: number; fundSource: FundSourceWithBalance }>) => {
  const router = useRouter();
  const descriptionValue = Reflect.get(
    fundSource as Record<string, unknown>,
    "description",
  );
  const initialDescription =
    typeof descriptionValue === "string" ? descriptionValue : "";

  const form = useForm<UpdateFundSourceFormValues>({
    resolver: zodResolver(updateFundSourceSchema),
    defaultValues: {
      fundSourceId: fundSource.id,
      name: fundSource.name,
      description: initialDescription,
    },
  });

  const onSubmit = async (values: UpdateFundSourceFormValues) => {
    try {
      await renameFundSourceAction(userId, values);
      router.refresh();
    } catch {
      form.setError("name", { message: "Failed to update fund source." });
    }
  };

  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
          <p>
            <span className="text-muted-foreground">Income:</span>{" "}
            {currencyFormatter.format(fundSource.totalIncome)}
          </p>
          <p>
            <span className="text-muted-foreground">Expense:</span>{" "}
            {currencyFormatter.format(fundSource.totalExpense)}
          </p>
          <p>
            <span className="text-muted-foreground">Balance:</span>{" "}
            {currencyFormatter.format(fundSource.balance)}
          </p>
        </div>

        <Form {...form}>
          <form
            className="flex flex-col gap-2"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input disabled={form.formState.isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Description (optional)"
                      disabled={form.formState.isSubmitting}
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ActionConfirmButton
              type="button"
              variant="outline"
              className="sm:w-full"
              disabled={form.formState.isSubmitting}
              confirmationTitle="Save fund source?"
              confirmationDescription={`You are about to update "${fundSource.name}".`}
              onConfirmAction={() => void form.handleSubmit(onSubmit)()}
            >
              Save
            </ActionConfirmButton>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default FundSourceRow;
