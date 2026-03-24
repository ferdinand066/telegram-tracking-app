export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4";
  };
  public: {
    Tables: {
      fund_source_balances: {
        Row: {
          balance: number;
          fund_source_id: string;
          updated_at: string | null;
        };
        Insert: {
          balance?: number;
          fund_source_id: string;
          updated_at?: string | null;
        };
        Update: {
          balance?: number;
          fund_source_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_balance_fund_source";
            columns: ["fund_source_id"];
            isOneToOne: true;
            referencedRelation: "fund_sources";
            referencedColumns: ["id"];
          },
        ];
      };
      fund_sources: {
        Row: {
          created_at: string | null;
          detail: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          user_id: number;
        };
        Insert: {
          created_at?: string | null;
          detail?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          user_id: number;
        };
        Update: {
          created_at?: string | null;
          detail?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          user_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_fund_sources_user";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          amount: number;
          category: string | null;
          created_at: string | null;
          description: string | null;
          fund_source_id: string | null;
          id: string;
          telegram_message_id: number | null;
          transaction_date: string;
          user_id: number;
        };
        Insert: {
          amount: number;
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          fund_source_id?: string | null;
          id?: string;
          telegram_message_id?: number | null;
          transaction_date: string;
          user_id: number;
        };
        Update: {
          amount?: number;
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          fund_source_id?: string | null;
          id?: string;
          telegram_message_id?: number | null;
          transaction_date?: string;
          user_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_transactions_fund_source";
            columns: ["fund_source_id"];
            isOneToOne: false;
            referencedRelation: "fund_sources";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_transactions_user";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          created_at: string | null;
          currency: string | null;
          first_name: string | null;
          id: number;
          telegram_id: number;
          updated_at: string | null;
          username: string | null;
        };
        Insert: {
          created_at?: string | null;
          currency?: string | null;
          first_name?: string | null;
          id?: number;
          telegram_id: number;
          updated_at?: string | null;
          username?: string | null;
        };
        Update: {
          created_at?: string | null;
          currency?: string | null;
          first_name?: string | null;
          id?: number;
          telegram_id?: number;
          updated_at?: string | null;
          username?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
