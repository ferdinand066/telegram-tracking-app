import { fundSourceBalanceRepository } from "~/repository/fund-source-balance.repository";
import { transactionRepository } from "~/repository/transaction.repository";

export type FundBalanceBreakdown = {
  fundName: string;
  totalIncome: number;
  totalExpense: number;
};

export type BalanceResult = {
  byFund: FundBalanceBreakdown[];
  totalIncome: number;
  totalExpense: number;
  net: number;
};

const UNASSIGNED_LABEL = "Unassigned";

export const getBalanceUseCase = async (
  userId: number,
): Promise<BalanceResult> => {
  const [fundBalances, unassignedAmounts] = await Promise.all([
    fundSourceBalanceRepository.findWithFundNameByUserId(userId),
    transactionRepository.findUnassignedAmountsByUserId(userId),
  ]);

  const byFund: FundBalanceBreakdown[] = fundBalances
    .map((row) => ({
      fundName: row.fund_name,
      totalIncome: row.total_income,
      totalExpense: row.total_expense,
    }))
    .sort((a, b) => a.fundName.localeCompare(b.fundName));

  const unassignedIncome = unassignedAmounts
    .filter((a) => a > 0)
    .reduce((sum, a) => sum + a, 0);
  const unassignedExpense = unassignedAmounts
    .filter((a) => a < 0)
    .reduce((sum, a) => sum + Math.abs(a), 0);

  if (unassignedIncome > 0 || unassignedExpense > 0) {
    byFund.push({
      fundName: UNASSIGNED_LABEL,
      totalIncome: unassignedIncome,
      totalExpense: unassignedExpense,
    });
  }

  const totalIncome = byFund.reduce((sum, f) => sum + f.totalIncome, 0);
  const totalExpense = byFund.reduce((sum, f) => sum + f.totalExpense, 0);

  return {
    byFund,
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
  };
};
