import type { AppContext } from "~/lib/bot-context";
import { getBalanceUseCase } from "~/usecase/get-balance.usecase";
import { formatAmount } from "~/utils/amount";

export const handleBalanceCommand = async (ctx: AppContext) => {
  if (!ctx.user) return ctx.reply("Failed to identify user. Please try again.");

  try {
    const { byFund, totalIncome, totalExpense, net } = await getBalanceUseCase(
      ctx.user.id,
    );
    const netSign = net >= 0 ? "+" : "";

    const fundSections = byFund.map((fund) => {
      const incomeStr = formatAmount(fund.totalIncome);
      const expenseStr = formatAmount(fund.totalExpense);
      const labelRows = [
        { label: "💰 Income:", value: incomeStr },
        { label: "💸 Expense:", value: expenseStr },
      ] as const;
      const leftWidth = Math.max(...labelRows.map((row) => row.label.length));
      const rightWidth = Math.max(...labelRows.map((row) => row.value.length));
      const formatRow = (label: string, value: string) =>
        `${label.padEnd(leftWidth)}  ${value.padStart(rightWidth)}`;
      const line1 = formatRow(labelRows[0].label, labelRows[0].value);
      const line2 = formatRow(labelRows[1].label, labelRows[1].value);
      return `🏦 ${fund.fundName}\n\`${line1}\`\n\`${line2}\``;
    });

    const summaryRows = [
      { label: "💰 Total Income:", value: formatAmount(totalIncome) },
      { label: "💸 Total Expenses:", value: formatAmount(totalExpense) },
      {
        label: "📈 Net Balance:",
        value: `${netSign}${formatAmount(net)}`,
      },
    ] as const;
    const sLeft = Math.max(...summaryRows.map((r) => r.label.length));
    const sRight = Math.max(...summaryRows.map((r) => r.value.length));
    const formatSummaryRow = (label: string, value: string) =>
      `${label.padEnd(sLeft)}  ${value.padStart(sRight)}`;
    const s1 = formatSummaryRow(summaryRows[0].label, summaryRows[0].value);
    const s2 = formatSummaryRow(summaryRows[1].label, summaryRows[1].value);
    const s3 = formatSummaryRow(summaryRows[2].label, summaryRows[2].value);

    const summaryBlock =
      `━━━━━━━━━━━━━━\n` + `\`${s1}\`\n` + `\`${s2}\`\n` + `\`${s3}\``;

    const body =
      fundSections.length > 0
        ? `${fundSections.join("\n\n")}\n\n${summaryBlock}`
        : summaryBlock;

    return ctx.reply(`📊 *Your Balance* (${ctx.user.currency})\n\n${body}`, {
      parse_mode: "Markdown",
    });
  } catch {
    return ctx.reply("Failed to fetch balance. Please try again.");
  }
};
