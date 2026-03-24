import { transactionRepository } from "~/repository/transaction.repository";

export const getHistoryUseCase = async (userId: number, limit = 10) =>
  transactionRepository.findRecentByUserId(userId, limit);
