"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { createTransactionAction } from "~/app/manage/transaction/actions";
import ActionConfirmButton from "~/components/pages/manage/shared/action-confirm-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
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
import {
  createTransactionSchema,
  TRANSACTION_TYPE_OPTIONS,
  type CreateTransactionFormValues,
} from "~/schema/manage/transaction.schema";

type CreateTransactionFormProps = {
  userId: number;
  selectedDate: string;
  fundSources: FundSource[];
};

const DEFAULT_TRANSACTION_TYPE = TRANSACTION_TYPE_OPTIONS[0].value.toString();

const CreateTransactionForm = ({
  userId,
  selectedDate,
  fundSources,
}: Readonly<CreateTransactionFormProps>) => {
  const router = useRouter();
  const form = useForm<CreateTransactionFormValues>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      transactionType: DEFAULT_TRANSACTION_TYPE,
      fundSourceId: fundSources[0]?.id ?? "",
      description: "",
      amount: 0,
      transactionDate: selectedDate,
    },
  });

  const onSubmit = async (values: CreateTransactionFormValues) => {
    const payload: CreateTransactionFormValues = {
      ...values,
      amount: Math.abs(values.amount),
      transactionDate: selectedDate,
    };

    try {
      await createTransactionAction(userId, payload);
      form.reset({
        transactionType: DEFAULT_TRANSACTION_TYPE,
        fundSourceId: payload.fundSourceId,
        description: "",
        amount: 0,
        transactionDate: selectedDate,
      });
      router.refresh();
    } catch {
      form.setError("description", {
        message: "Failed to create transaction.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Transaction</CardTitle>
        <CardDescription>
          Create a transaction for selected date.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            className="grid grid-cols-1 gap-3 sm:grid-cols-6"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="fundSourceId"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
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
                <FormItem className="sm:col-span-4">
                  <FormControl>
                    <Input
                      placeholder="Transaction name"
                      disabled={form.formState.isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="transactionType"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
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
                <FormItem className="sm:col-span-3">
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Amount"
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
              className="sm:col-span-1 sm:self-end"
              disabled={form.formState.isSubmitting || fundSources.length === 0}
              confirmationTitle="Create transaction?"
              confirmationDescription="You are about to create a new transaction."
              onConfirmAction={() => void form.handleSubmit(onSubmit)()}
            >
              {form.formState.isSubmitting ? "Creating..." : "Create"}
            </ActionConfirmButton>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateTransactionForm;
