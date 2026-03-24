import "server-only";
import { supabaseServer } from "~/lib/supabase/server";
import type { Database } from "~/lib/supabase/types";

type InsertTransactionPayload =
  Database["public"]["Tables"]["transactions"]["Insert"];

export const transactionRepository = {
  async bulkInsert(rows: InsertTransactionPayload[]): Promise<void> {
    const { error } = await supabaseServer.from("transactions").insert(rows);
    if (error) throw error;
  },

  async findAmountsByUserId(userId: number) {
    const { data, error } = await supabaseServer
      .from("transactions")
      .select("amount")
      .eq("user_id", userId);

    if (error) throw error;
    return data ?? [];
  },

  async findRecentByUserId(userId: number, limit = 10) {
    const { data, error } = await supabaseServer
      .from("transactions")
      .select()
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  },
};
