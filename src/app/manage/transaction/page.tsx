import { redirect } from "next/navigation";

import { TransactionPageClient } from "~/components/pages/manage/transaction/transaction-page-client";
import { parseUserId } from "~/lib/auth/parse-user-id";
import type { FundSource } from "~/lib/supabase/model";
import type { TransactionWithSource } from "~/repository/transaction.repository";
import { auth } from "~/server/auth";
import { fundSourceRepository } from "~/repository/fund-source.repository";
import { getTransactionByDateUseCase } from "~/usecase/manage/transaction.usecase";

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

type ManageTransactionPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ManageTransactionPage({
  searchParams,
}: Readonly<ManageTransactionPageProps>) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = parseUserId(session.user.id);
  if (!userId) {
    redirect("/");
  }

  const params = await searchParams;
  const rawDate = params.date;
  const selectedDate =
    typeof rawDate === "string" && rawDate.length > 0
      ? rawDate
      : todayDateOnly();

  const fundSources: FundSource[] =
    await fundSourceRepository.findByUserId(userId);
  const transactions: TransactionWithSource[] =
    await getTransactionByDateUseCase(userId, selectedDate);

  return (
    <TransactionPageClient
      userId={userId}
      selectedDate={selectedDate}
      fundSources={fundSources}
      transactions={transactions}
    />
  );
}
