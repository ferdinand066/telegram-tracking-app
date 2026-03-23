// ─── Row types ───────────────────────────────────────────────────────────────

export type User = {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
};

export type FundSource = {
  id: string;
  user_id: number;
  name: string;
  detail: string | null;
  is_active: boolean;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: number;
  fund_source_id: string | null;
  transaction_date: string;
  amount: number;
  category: string | null;
  description: string | null;
  telegram_message_id: number | null;
  created_at: string;
};

export type FundSourceBalance = {
  fund_source_id: string;
  balance: number;
  updated_at: string;
};

// ─── Database schema ──────────────────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: {
          id?: number;
          telegram_id: number;
          username?: string | null;
          first_name?: string | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          telegram_id?: number;
          username?: string | null;
          first_name?: string | null;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      fund_sources: {
        Row: FundSource;
        Insert: {
          id?: string;
          user_id: number;
          name: string;
          detail?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: number;
          name?: string;
          detail?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_fund_sources_user";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: Transaction;
        Insert: {
          id?: string;
          user_id: number;
          fund_source_id?: string | null;
          transaction_date: string;
          amount: number;
          category?: string | null;
          description?: string | null;
          telegram_message_id?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: number;
          fund_source_id?: string | null;
          transaction_date?: string;
          amount?: number;
          category?: string | null;
          description?: string | null;
          telegram_message_id?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_transactions_user";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_transactions_fund_source";
            columns: ["fund_source_id"];
            referencedRelation: "fund_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      fund_source_balances: {
        Row: FundSourceBalance;
        Insert: {
          fund_source_id: string;
          balance?: number;
          updated_at?: string;
        };
        Update: {
          fund_source_id?: string;
          balance?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_balance_fund_source";
            columns: ["fund_source_id"];
            referencedRelation: "fund_sources";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    // Keep the full generated DB shape so `supabase-js` can infer types correctly.
    // (These are `never` placeholders because you currently don't use them.)
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
