import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "~/env";
import { type Database } from "./types";

/**
 * Server-side Supabase client. Use this in API routes, server components,
 * and tRPC procedures. Never import this on the client side.
 */
export const supabaseServer = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
