import { transactionRepository } from "~/repository/transaction.repository";
import type { TransactionWithSource } from "~/repository/transaction.repository";

export async function getTransactionByDateUseCase(
  userId: number,
  transactionDate: string,
): Promise<TransactionWithSource[]> {
  const transactions: TransactionWithSource[] =
    await transactionRepository.findByUserIdAndDate(userId, transactionDate);
  return transactions;
}

export async function createManageTransactionUseCase(input: {
  userId: number;
  fundSourceId: string;
  description: string;
  amount: number;
  transactionDate: string;
}): Promise<void> {
  await transactionRepository.createOne({
    user_id: input.userId,
    fund_source_id: input.fundSourceId,
    description: input.description,
    amount: input.amount,
    transaction_date: input.transactionDate,
    category: null,
    telegram_message_id: null,
  });
}

export async function updateManageTransactionUseCase(input: {
  userId: number;
  transactionId: string;
  fundSourceId: string;
  description: string;
  amount: number;
}): Promise<void> {
  await transactionRepository.updateById(input.userId, input.transactionId, {
    fund_source_id: input.fundSourceId,
    description: input.description,
    amount: input.amount,
  });
}

export async function deleteManageTransactionUseCase(input: {
  userId: number;
  transactionId: string;
}): Promise<void> {
  await transactionRepository.deleteById(input.userId, input.transactionId);
}
