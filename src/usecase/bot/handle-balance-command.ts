import type { AppContext } from "~/lib/bot-context";
import { getBalanceUseCase } from "~/usecase/get-balance.usecase";

export async function handleBalanceCommand(ctx: AppContext) {
  if (!ctx.user) return ctx.reply("Failed to identify user. Please try again.");

  try {
    const { totalIncome, totalExpense, net } = await getBalanceUseCase(ctx.user.id);
    const netSign = net >= 0 ? "+" : "";

    return ctx.reply(
      `📊 *Your Balance* (${ctx.user.currency})\n\n` +
        `💰 Total Income:   *${totalIncome.toFixed(2)}*\n` +
        `💸 Total Expenses: *${totalExpense.toFixed(2)}*\n` +
        `━━━━━━━━━━━━━━\n` +
        `📈 Net Balance:    *${netSign}${net.toFixed(2)}*`,
      { parse_mode: "Markdown" },
    );
  } catch {
    return ctx.reply("Failed to fetch balance. Please try again.");
  }
}
