export type PendingReceiptPhoto = {
  dateStr: string;
  sourceName: string;
  category: string;
  isProcessing: boolean;
};

const store = new Map<number, PendingReceiptPhoto>();

export const pendingReceiptPhotoStore = {
  set: (userId: number, data: PendingReceiptPhoto): void => {
    store.set(userId, data);
  },
  get: (userId: number): PendingReceiptPhoto | null =>
    store.get(userId) ?? null,
  delete: (userId: number): void => {
    store.delete(userId);
  },
  has: (userId: number): boolean => store.has(userId),
};
