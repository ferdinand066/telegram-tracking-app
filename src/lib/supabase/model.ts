// ─── Row types ───────────────────────────────────────────────────────────────

import type { Database } from "./types";

export type User = Database["public"]["Tables"]["users"]["Row"];
export type FundSource = Database["public"]["Tables"]["fund_sources"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type FundSourceBalance =
  Database["public"]["Tables"]["fund_source_balances"]["Row"];
