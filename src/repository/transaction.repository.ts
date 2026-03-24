import "server-only";
import { supabaseServer } from "~/lib/supabase/server";
import type { Transaction } from "~/lib/supabase/model";
import type { Database } from "~/lib/supabase/types";

type InsertTransactionPayload =
  Database["public"]["Tables"]["transactions"]["Insert"];

export type TransactionWithSource = Transaction & {
  fund_sources: { name: string } | null;
};

export const transactionRepository = {
  async bulkInsert(rows: InsertTransactionPayload[]): Promise<void> {
    const { error } = await supabaseServer.from("transactions").insert(rows);
    if (error) throw error;
  },

  async findUnassignedAmountsByUserId(userId: number): Promise<number[]> {
    const { data, error } = await supabaseServer
      .from("transactions")
      .select("amount")
      .eq("user_id", userId)
      .is("fund_source_id", null);

    if (error) throw error;
    return (data ?? []).map((row) => Number(row.amount));
  },

  async findByUserIdAndDateRange(
    userId: number,
    startDate: string,
    endDate: string,
  ): Promise<TransactionWithSource[]> {
    const { data, error } = await supabaseServer
      .from("transactions")
      .select("*, fund_sources(name)")
      .eq("user_id", userId)
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate)
      .order("transaction_date", { ascending: true });

    if (error) throw error;
    return (data ?? []) as TransactionWithSource[];
  },
};
