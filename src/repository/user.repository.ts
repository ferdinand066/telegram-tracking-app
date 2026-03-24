import "server-only";
import type { User } from "~/lib/supabase/model";
import { supabaseServer } from "~/lib/supabase/server";

export const userRepository = {
  async findByUsername(username: string) {
    const normalizedUsername = username.trim();
    if (!normalizedUsername) {
      return null;
    }

    const { data, error } = await supabaseServer
      .from("users")
      .select()
      .eq("username", normalizedUsername)
      .maybeSingle();

    if (error) {
      console.error("userRepository.findByUsername error:", error);
      return null;
    }

    if (!data) {
      return null;
    }

    return data satisfies User;
  },

  async upsert(
    telegramId: number,
    username: string | undefined,
    firstName: string | undefined,
  ) {
    const { error } = await supabaseServer.from("users").upsert(
      {
        telegram_id: telegramId,
        username: username ?? null,
        first_name: firstName ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "telegram_id" },
    );

    if (error) {
      console.error("userRepository.upsert error:", error);
      return null;
    }

    const { data, error: selectError } = await supabaseServer
      .from("users")
      .select()
      .eq("telegram_id", telegramId)
      .single();

    if (selectError) {
      console.error("userRepository.upsert select error:", selectError);
      return null;
    }

    if (!data) {
      return null;
    }

    return data satisfies User;
  },
};
