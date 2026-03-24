import "server-only";
import { supabaseServer } from "~/lib/supabase/server";

export type FundBalanceRow = {
  fund_source_id: string;
  fund_name: string;
  total_income: number;
  total_expense: number;
};

export const fundSourceBalanceRepository = {
  async findWithFundNameByUserId(userId: number): Promise<FundBalanceRow[]> {
    const { data, error } = await supabaseServer
      .from("fund_source_balances")
      .select(
        "fund_source_id, total_income, total_expense, fund_sources!inner(name, user_id)",
      )
      .eq("fund_sources.user_id", userId);

    if (error) throw error;

    return (data ?? []).map((row) => ({
      fund_source_id: row.fund_source_id,
      fund_name: (row.fund_sources as { name: string }).name,
      total_income: row.total_income,
      total_expense: row.total_expense,
    }));
  },
};
