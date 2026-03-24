import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  deleteTransactionAction,
  updateTransactionAction,
} from "~/app/manage/transaction/actions";
import { Card, CardContent } from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import type { FundSource } from "~/lib/supabase/model";
import type { TransactionWithSource } from "~/repository/transaction.repository";
import {
  TRANSACTION_TYPE,
  TRANSACTION_TYPE_OPTIONS,
  updateTransactionSchema,
  type UpdateTransactionFormValues,
} from "~/schema/manage/transaction.schema";
import ActionConfirmButton from "../shared/action-confirm-button";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

type TransactionRowProps = {
  userId: number;
  selectedDate: string;
  fundSources: FundSource[];
  transaction: TransactionWithSource;
};

const TransactionRow = ({
  userId,
  selectedDate,
  fundSources,
  transaction,
}: Readonly<TransactionRowProps>) => {
  const router = useRouter();
  const defaultTransactionType =
    Number(transaction.amount) < 0
      ? TRANSACTION_TYPE.EXPENSE.toString()
      : TRANSACTION_TYPE.INCOME.toString();

  const form = useForm<UpdateTransactionFormValues>({
    resolver: zodResolver(updateTransactionSchema),
    defaultValues: {
      transactionId: transaction.id,
      fundSourceId: transaction.fund_source_id ?? fundSources[0]?.id ?? "",
      transactionType: defaultTransactionType,
      description: transaction.description ?? "",
      amount: Math.abs(Number(transaction.amount)),
    },
  });

  const onUpdate = async (values: UpdateTransactionFormValues) => {
    const payload: UpdateTransactionFormValues = {
      ...values,
      amount: Math.abs(values.amount),
    };

    try {
      await updateTransactionAction(userId, payload, selectedDate);
      router.refresh();
    } catch {
      form.setError("description", {
        message: "Failed to update transaction.",
      });
    }
  };

  const onDelete = async () => {
    try {
      await deleteTransactionAction(userId, transaction.id, selectedDate);
      router.refresh();
    } catch {
      form.setError("description", {
        message: "Failed to delete transaction.",
      });
    }
  };

  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        <Form {...form}>
          <form
            className="grid grid-cols-1 gap-2 sm:grid-cols-6 lg:grid-cols-[minmax(160px,220px)_minmax(220px,1fr)_minmax(120px,140px)_minmax(140px,160px)_auto_auto]"
            onSubmit={form.handleSubmit(onUpdate)}
          >
            <FormField
              control={form.control}
              name="fundSourceId"
              render={({ field }) => (
                <FormItem className="sm:col-span-2 lg:col-span-1">
                  <FormControl>
                    <Select
                      disabled={form.formState.isSubmitting}
                      value={field.value}
                      onValueChange={field.onChange}
                      name={field.name}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {fundSources.find(
                            (source) => source.id === field.value,
                          )?.name ?? "Select fund source"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {fundSources.map((source) => (
                          <SelectItem key={source.id} value={source.id}>
                            {source.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="sm:col-span-4 lg:col-span-1">
                  <FormControl>
                    <Input disabled={form.formState.isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transactionType"
              render={({ field }) => (
                <FormItem className="sm:col-span-2 lg:col-span-1">
                  <FormControl>
                    <Select
                      disabled={form.formState.isSubmitting}
                      value={field.value}
                      onValueChange={field.onChange}
                      name={field.name}
                    >
                      <SelectTrigger>
                        <SelectValue>
                          {TRANSACTION_TYPE_OPTIONS.find(
                            (option) => option.value.toString() === field.value,
                          )?.label ?? "Select type"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {TRANSACTION_TYPE_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value.toString()}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="sm:col-span-2 lg:col-span-1">
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ActionConfirmButton
              type="button"
              variant="outline"
              disabled={form.formState.isSubmitting}
              confirmationTitle="Update transaction?"
              confirmationDescription={`You are about to update "${transaction.description ?? "transaction"}" to amount ${currencyFormatter.format(Number(form.getValues("amount") ?? 0))}.`}
              onConfirmAction={() => void form.handleSubmit(onUpdate)()}
            >
              Save
            </ActionConfirmButton>
            <ActionConfirmButton
              type="button"
              variant="destructive"
              disabled={form.formState.isSubmitting}
              confirmationTitle="Delete transaction?"
              confirmationDescription={`You are about to delete "${transaction.description ?? "transaction"}". This cannot be undone.`}
              onConfirmAction={() => void onDelete()}
            >
              Delete
            </ActionConfirmButton>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default TransactionRow;
