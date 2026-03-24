import { transactionRepository } from "~/repository/transaction.repository";

export const getHistoryUseCase = async (
  userId: number,
  startDate: string,
  endDate: string,
) => transactionRepository.findByUserIdAndDateRange(userId, startDate, endDate);
