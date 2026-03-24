import "server-only";
import type { FundSource } from "~/lib/supabase/model";
import { supabaseServer } from "~/lib/supabase/server";
import type { Database } from "~/lib/supabase/types";

type CreateFundSourcePayload =
  Database["public"]["Tables"]["fund_sources"]["Insert"];
type UpdateFundSourcePayload =
  Database["public"]["Tables"]["fund_sources"]["Update"];

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
    const { data, error } = await supabaseServer
      .from("fund_sources")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data satisfies FundSource;
  },

  async findByUserId(userId: number): Promise<FundSource[]> {
    const { data, error } = await supabaseServer
      .from("fund_sources")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data ?? []) as FundSource[];
  },

  async updateById(
    userId: number,
    fundSourceId: string,
    payload: UpdateFundSourcePayload,
  ): Promise<FundSource> {
    const { data, error } = await supabaseServer
      .from("fund_sources")
      .update(payload)
      .eq("user_id", userId)
      .eq("id", fundSourceId)
      .select()
      .single();

    if (error) throw error;
    return data satisfies FundSource;
  },
};
