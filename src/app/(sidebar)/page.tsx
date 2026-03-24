import { redirect } from "next/navigation";

import { parseUserId } from "~/lib/auth/parse-user-id";
import { auth } from "~/server/auth";
import { getHistoryUseCase } from "~/usecase/get-history.usecase";

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const toDateOnly = (value: Date) => value.toISOString().slice(0, 10);

  return {
    startDate: toDateOnly(start),
    endDate: toDateOnly(end),
  };
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const Home = async () => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = parseUserId(session.user.id);
  if (!userId) {
    return (
      <div className="p-4 sm:p-6">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            We could not map your login account to an internal user id.
          </p>
        </div>
      </div>
    );
  }

  const { startDate, endDate } = getCurrentMonthRange();
  const transactions = await getHistoryUseCase(userId, startDate, endDate);

  const totalIncome = transactions
    .filter((transaction) => Number(transaction.amount) > 0)
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const totalExpense = transactions
    .filter((transaction) => Number(transaction.amount) < 0)
    .reduce(
      (sum, transaction) => sum + Math.abs(Number(transaction.amount)),
      0,
    );
  const netBalance = totalIncome - totalExpense;

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Transaction Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              This month overview for {session.user.name ?? "your account"}.
            </p>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border p-4">
            <p className="text-muted-foreground text-xs uppercase">Income</p>
            <p className="text-success mt-1 text-xl font-semibold">
              {currencyFormatter.format(totalIncome)}
            </p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-muted-foreground text-xs uppercase">Expense</p>
            <p className="text-destructive mt-1 text-xl font-semibold">
              {currencyFormatter.format(totalExpense)}
            </p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-muted-foreground text-xs uppercase">Net</p>
            <p className="mt-1 text-xl font-semibold">
              {currencyFormatter.format(netBalance)}
            </p>
          </div>
        </section>

        <section className="rounded-xl border p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            <p className="text-muted-foreground text-xs">
              {startDate} to {endDate}
            </p>
          </div>

          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No transactions found for this month.
            </p>
          ) : (
            <div className="space-y-2">
              {transactions
                .slice()
                .reverse()
                .slice(0, 10)
                .map((transaction) => {
                  const amount = Number(transaction.amount);
                  const isIncome = amount > 0;

                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {transaction.description ?? "No description"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(
                            transaction.transaction_date,
                          ).toLocaleDateString()}{" "}
                          - {transaction.fund_sources?.name ?? "Unassigned"}
                        </p>
                      </div>
                      <p
                        className={`text-sm font-semibold ${isIncome ? "text-success" : "text-destructive"}`}
                      >
                        {isIncome ? "+" : "-"}
                        {currencyFormatter.format(Math.abs(amount))}
                      </p>
                    </div>
                  );
                })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;
