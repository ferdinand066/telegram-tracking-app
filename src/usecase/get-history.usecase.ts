import { transactionRepository } from "~/repository/transaction.repository";

export async function getHistoryUseCase(
  userId: number,
  limit = 10,
) {
  return transactionRepository.findRecentByUserId(userId, limit);
}
