"use server";

import { revalidatePath } from "next/cache";

import {
  createTransactionSchema,
  deleteTransactionSchema,
  updateTransactionSchema,
  type CreateTransactionFormValues,
  type UpdateTransactionFormValues,
} from "~/schema/manage/transaction.schema";
import {
  createManageTransactionUseCase,
  deleteManageTransactionUseCase,
  updateManageTransactionUseCase,
} from "~/usecase/manage/transaction.usecase";

export async function createTransactionAction(
  userId: number,
  values: CreateTransactionFormValues,
): Promise<void> {
  const parsed = createTransactionSchema.safeParse(values);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  await createManageTransactionUseCase({
    userId,
    fundSourceId: parsed.data.fundSourceId,
    description: parsed.data.description,
    amount: Number(parsed.data.transactionType) * parsed.data.amount,
    transactionDate: parsed.data.transactionDate,
  });

  revalidatePath(`/manage/transaction?date=${parsed.data.transactionDate}`);
  revalidatePath("/manage/transaction");
}

export async function updateTransactionAction(
  userId: number,
  values: UpdateTransactionFormValues,
  date: string,
): Promise<void> {
  const parsed = updateTransactionSchema.safeParse(values);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  await updateManageTransactionUseCase({
    userId,
    transactionId: parsed.data.transactionId,
    fundSourceId: parsed.data.fundSourceId,
    description: parsed.data.description,
    amount: Number(parsed.data.transactionType) * parsed.data.amount,
  });
  revalidatePath(`/manage/transaction?date=${date}`);
  revalidatePath("/manage/transaction");
}

export async function deleteTransactionAction(
  userId: number,
  transactionId: string,
  date: string,
): Promise<void> {
  const parsed = deleteTransactionSchema.safeParse({ transactionId });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  await deleteManageTransactionUseCase({
    userId,
    transactionId: parsed.data.transactionId,
  });
  revalidatePath(`/manage/transaction?date=${date}`);
  revalidatePath("/manage/transaction");
}
