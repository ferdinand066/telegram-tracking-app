import type { FundSource } from "~/lib/supabase/model";
import { fundSourceRepository } from "~/repository/fund-source.repository";
import { transactionRepository } from "~/repository/transaction.repository";

export type TransactionEntry = {
  category: string;
  description: string | null;
  amount: number;
};

type AddTransactionInput = {
  userId: number;
  fundSourceName: string;
  dateStr: string;
  entries: TransactionEntry[];
  /** +1 for income, -1 for expense */
  sign: 1 | -1;
  telegramMessageId: number | null;
};

type AddTransactionResult = {
  source: FundSource;
  entries: TransactionEntry[];
};

export async function addTransactionUseCase(
  input: AddTransactionInput,
): Promise<AddTransactionResult> {
  const source = await fundSourceRepository.getActiveByName(
    input.userId,
    input.fundSourceName,
  );

  if (!source) {
    throw new Error(
      `Fund source "${input.fundSourceName}" not found or inactive.\nCreate it first with /source ${input.fundSourceName} - <detail>`,
    );
  }

  await transactionRepository.bulkInsert(
    input.entries.map((e) => ({
      user_id: input.userId,
      fund_source_id: source.id,
      transaction_date: input.dateStr,
      amount: e.amount * input.sign,
      category: e.category,
      description: e.description,
      telegram_message_id: input.telegramMessageId,
    })),
  );

  return { source, entries: input.entries };
}
