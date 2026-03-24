import { z } from "zod";

export const TRANSACTION_TYPE = {
  INCOME: 1,
  EXPENSE: -1,
} as const;

export type TransactionType =
  (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE];

export const TRANSACTION_TYPE_OPTIONS = [
  {
    label: "Expense",
    value: TRANSACTION_TYPE.EXPENSE,
  },
  {
    label: "Income",
    value: TRANSACTION_TYPE.INCOME,
  },
] as const;

export const createTransactionSchema = z.object({
  transactionType: z.enum(
    TRANSACTION_TYPE_OPTIONS.map((option) => option.value.toString()) as [
      string,
      ...string[],
    ],
  ),
  fundSourceId: z.string().min(1, "Fund source is required."),
  description: z.string().trim().min(1, "Transaction name is required."),
  amount: z.coerce.number().positive({
    message: "Amount must be greater than zero.",
  }),
  transactionDate: z.string().trim().min(1, "Transaction date is required."),
});

export const updateTransactionSchema = z.object({
  transactionId: z.string().min(1, "Transaction id is required."),
  fundSourceId: z.string().min(1, "Fund source is required."),
  transactionType: z.enum(
    TRANSACTION_TYPE_OPTIONS.map((option) => option.value.toString()) as [
      string,
      ...string[],
    ],
  ),
  description: z.string().trim().min(1, "Transaction name is required."),
  amount: z.coerce.number().positive({
    message: "Amount must be greater than zero.",
  }),
});

export const deleteTransactionSchema = z.object({
  transactionId: z.string().min(1, "Transaction id is required."),
});

export type CreateTransactionFormValues = z.infer<
  typeof createTransactionSchema
>;
export type UpdateTransactionFormValues = z.infer<
  typeof updateTransactionSchema
>;
