import "server-only";
import type { FundSource } from "~/lib/supabase/model";
import { supabaseServer } from "~/lib/supabase/server";
import type { Database } from "~/lib/supabase/types";

type CreateFundSourcePayload =
  Database["public"]["Tables"]["fund_sources"]["Insert"];

export const fundSourceRepository = {
  async getActiveByName(userId: number, name: string) {
    const { data, error } = await supabaseServer
      .from("fund_sources")
      .select()
      .eq("user_id", userId)
      .eq("is_active", true)
      .ilike("name", name)
      .order("created_at", { ascending: false })
      .single();

    if (error) {
      console.error("fundSourceRepository.getActiveByName error:", error);
      return null;
    }

    if (!data) {
      return null;
    }

    return data satisfies FundSource;
  },

  async create(payload: CreateFundSourcePayload) {
    const { error } = await supabaseServer.from("fund_sources").insert(payload);
    if (error) throw error;
  },
};
