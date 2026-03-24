import type { TransactionEntry } from "~/usecase/add-transaction.usecase";

export type PendingReceipt = {
  dateStr: string;
  sourceName: string;
  category: string;
  entries: TransactionEntry[];
  telegramMessageId: number | null;
};

const store = new Map<number, PendingReceipt>();

export const pendingReceiptStore = {
  set: (userId: number, data: PendingReceipt): void => {
    store.set(userId, data);
  },
  get: (userId: number): PendingReceipt | null => store.get(userId) ?? null,
  delete: (userId: number): void => {
    store.delete(userId);
  },
  has: (userId: number): boolean => store.has(userId),
};
