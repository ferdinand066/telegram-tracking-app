import "server-only";
import { supabaseServer } from "~/lib/supabase/server";
import type { Transaction } from "~/lib/supabase/model";
import type { Database } from "~/lib/supabase/types";

type InsertTransactionPayload =
  Database["public"]["Tables"]["transactions"]["Insert"];
type UpdateTransactionPayload =
  Database["public"]["Tables"]["transactions"]["Update"];

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
  ) {
    const { data, error } = await supabaseServer
      .from("transactions")
      .select("*, fund_sources(name)")
      .eq("user_id", userId)
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate)
      .order("transaction_date", { ascending: true });

    if (error) throw error;
    return (data ?? []) satisfies TransactionWithSource[];
  },

  async findByUserIdAndDate(userId: number, transactionDate: string) {
    const { data, error } = await supabaseServer
      .from("transactions")
      .select("*, fund_sources(name)")
      .eq("user_id", userId)
      .eq("transaction_date", transactionDate)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) satisfies TransactionWithSource[];
  },

  async createOne(payload: InsertTransactionPayload) {
    const { data, error } = await supabaseServer
      .from("transactions")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data satisfies Transaction;
  },

  async updateById(
    userId: number,
    transactionId: string,
    payload: UpdateTransactionPayload,
  ) {
    const { data, error } = await supabaseServer
      .from("transactions")
      .update(payload)
      .eq("user_id", userId)
      .eq("id", transactionId)
      .select()
      .single();

    if (error) throw error;
    return data satisfies Transaction;
  },

  async deleteById(userId: number, transactionId: string) {
    const { error } = await supabaseServer
      .from("transactions")
      .delete()
      .eq("user_id", userId)
      .eq("id", transactionId);

    if (error) throw error;
  },
};
