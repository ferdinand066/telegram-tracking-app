import type { FundSource } from "~/lib/supabase/model";
import { fundSourceRepository } from "~/repository/fund-source.repository";
import { transactionRepository } from "~/repository/transaction.repository";
import { formatCategoryTitleCase } from "~/utils/category";

export type TransactionEntry = {
  category: string;
  description: string | null;
  amount: number;
};

export const TRANSACTION_TYPE = {
  INCOME: 1,
  EXPENSE: -1,
} as const;

export type TransactionType =
  (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE];

type AddTransactionInput = {
  userId: number;
  fundSourceName: string;
  dateStr: string;
  entries: TransactionEntry[];
  sign: TransactionType;
  telegramMessageId: number | null;
};

type AddTransactionResult = {
  source: FundSource;
  entries: TransactionEntry[];
};

export const addTransactionUseCase = async (
  input: AddTransactionInput,
): Promise<AddTransactionResult> => {
  const source = await fundSourceRepository.getActiveByName(
    input.userId,
    input.fundSourceName,
  );

  if (!source) {
    throw new Error(
      `Fund source "${input.fundSourceName}" not found or inactive.\nCreate it first with /source ${input.fundSourceName} - <detail>`,
    );
  }

  const entries = input.entries.map((e) => ({
    ...e,
    category: formatCategoryTitleCase(e.category),
  }));

  await transactionRepository.bulkInsert(
    entries.map((e) => ({
      user_id: input.userId,
      fund_source_id: source.id,
      transaction_date: input.dateStr,
      amount: e.amount * input.sign,
      category: e.category,
      description: e.description,
      telegram_message_id: input.telegramMessageId,
    })),
  );

  return { source, entries };
};
