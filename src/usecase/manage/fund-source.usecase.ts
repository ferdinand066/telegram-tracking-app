import { fundSourceBalanceRepository } from "~/repository/fund-source-balance.repository";
import { fundSourceRepository } from "~/repository/fund-source.repository";

export type FundSourceWithBalance = {
  id: string;
  name: string;
  description: string | null;
  totalIncome: number;
  totalExpense: number;
  balance: number;
};

export async function getFundSourceWithBalanceUseCase(
  userId: number,
): Promise<FundSourceWithBalance[]> {
  const [fundSources, balances] = await Promise.all([
    fundSourceRepository.findByUserId(userId),
    fundSourceBalanceRepository.findWithFundNameByUserId(userId),
  ]);

  const balanceById = new Map(
    balances.map((row) => [
      row.fund_source_id,
      {
        totalIncome: row.total_income,
        totalExpense: row.total_expense,
      },
    ]),
  );

  return fundSources
    .map((source) => {
      const breakdown = balanceById.get(source.id);
      const totalIncome = breakdown?.totalIncome ?? 0;
      const totalExpense = breakdown?.totalExpense ?? 0;

      return {
        id: source.id,
        name: source.name,
        description: source.detail,
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      };
    })
    .sort((a, b) => b.balance - a.balance || a.name.localeCompare(b.name));
}

export async function createManageFundSourceUseCase(input: {
  userId: number;
  name: string;
  description?: string;
}) {
  await fundSourceRepository.create({
    user_id: input.userId,
    name: input.name,
    detail: input.description?.trim() ? input.description.trim() : null,
  });
}

export async function renameFundSourceUseCase(input: {
  userId: number;
  fundSourceId: string;
  name: string;
  description?: string;
}) {
  await fundSourceRepository.updateById(input.userId, input.fundSourceId, {
    name: input.name,
    detail: input.description?.trim() ? input.description.trim() : null,
  });
}
