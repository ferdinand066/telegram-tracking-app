import { transactionRepository } from "~/repository/transaction.repository";

type BalanceResult = {
  totalIncome: number;
  totalExpense: number;
  net: number;
};

export const getBalanceUseCase = async (
  userId: number,
): Promise<BalanceResult> => {
  const amounts = await transactionRepository.findAmountsByUserId(userId);

  const totalIncome = amounts
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = amounts
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return { totalIncome, totalExpense, net: totalIncome - totalExpense };
};
