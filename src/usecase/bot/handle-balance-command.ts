import type { AppContext } from "~/lib/bot-context";
import { getBalanceUseCase } from "~/usecase/get-balance.usecase";
import { formatAmount } from "~/utils/amount";

export async function handleBalanceCommand(ctx: AppContext) {
  if (!ctx.user) return ctx.reply("Failed to identify user. Please try again.");

  try {
    const { totalIncome, totalExpense, net } = await getBalanceUseCase(ctx.user.id);
    const netSign = net >= 0 ? "+" : "";

    const incomeStr = formatAmount(totalIncome);
    const expenseStr = formatAmount(totalExpense);
    const netStr = `${netSign}${formatAmount(net)}`;

    const labelRows = [
      { label: "Total Income", value: incomeStr },
      { label: "Total Expenses", value: expenseStr },
      { label: "Net Balance", value: netStr },
    ] as const;

    // Use a monospaced code block + padding so the value column aligns right.
    const leftWidth = Math.max(...labelRows.map((row) => row.label.length));
    const rightWidth = Math.max(...labelRows.map((row) => row.value.length));
    const formatRow = (label: string, value: string) =>
      `${label.padEnd(leftWidth)}  ${value.padStart(rightWidth)}`;

    const table =
      `━━━━━━━━━━━━━━\n` +
      `${formatRow(labelRows[0].label, labelRows[0].value)}\n` +
      `${formatRow(labelRows[1].label, labelRows[1].value)}\n` +
      `━━━━━━━━━━━━━━\n` +
      `${formatRow(labelRows[2].label, labelRows[2].value)}`;

    return ctx.reply(
      `📊 *Your Balance* (${ctx.user.currency})\n\n` +
        `\`\`\`\n${table}\n\`\`\``,
      { parse_mode: "Markdown" },
    );
  } catch {
    return ctx.reply("Failed to fetch balance. Please try again.");
  }
}
