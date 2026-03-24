"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import type { FundSource } from "~/lib/supabase/model";
import type { TransactionWithSource } from "~/repository/transaction.repository";
import CreateTransactionForm from "./create-transaction-form";
import TransactionRow from "./transaction-row";

type TransactionPageClientProps = {
  userId: number;
  selectedDate: string;
  fundSources: FundSource[];
  transactions: TransactionWithSource[];
};

export function TransactionPageClient({
  userId,
  selectedDate,
  fundSources,
  transactions,
}: Readonly<TransactionPageClientProps>) {
  const router = useRouter();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 sm:p-6">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold sm:text-2xl">
          Manage Transaction
        </h1>
        <p className="text-muted-foreground text-sm">
          View transactions by date, edit fund source, name, type, and amount,
          create, and delete.
        </p>
        <div className="max-w-xs">
          <Input
            type="date"
            value={selectedDate}
            onChange={(event) => {
              const nextDate = event.currentTarget.value;
              if (!nextDate) return;
              router.push(`/manage/transaction?date=${nextDate}`);
            }}
          />
        </div>
      </div>

      <CreateTransactionForm
        userId={userId}
        selectedDate={selectedDate}
        fundSources={fundSources}
      />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase">
          Transaction List ({transactions.length})
        </h2>
        {transactions.length === 0 ? (
          <Card size="sm">
            <CardContent>
              <p className="text-muted-foreground text-sm">
                No transactions on selected date.
              </p>
            </CardContent>
          </Card>
        ) : (
          transactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              userId={userId}
              selectedDate={selectedDate}
              fundSources={fundSources}
              transaction={transaction}
            />
          ))
        )}
      </section>
    </div>
  );
}
