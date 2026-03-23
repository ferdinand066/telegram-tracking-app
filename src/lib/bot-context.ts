import type { Context } from "grammy";
import type { User } from "~/lib/supabase/model";

export type AppContext = Context & { user: User | null };
