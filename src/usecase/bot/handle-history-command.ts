import type { AppContext } from "~/lib/bot-context";
import { getHistoryUseCase } from "~/usecase/get-history.usecase";
import type { Transaction } from "~/lib/supabase/model";
import { formatAmount } from "~/utils/amount";

const formatTransactionLine = (t: Transaction): string => {
  const isIncome = t.amount >= 0;
  const sign = isIncome ? "+" : "";
  const emoji = isIncome ? "💰" : "💸";
  const date = new Date(t.transaction_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const desc = t.description ? ` — ${t.description}` : "";
  const cat = t.category ?? "uncategorized";
  return `${emoji} \`${sign}${formatAmount(Number(t.amount))}\` *${cat}*${desc} _(${date})_`;
};

export const handleHistoryCommand = async (ctx: AppContext) => {
  if (!ctx.user) return ctx.reply("Failed to identify user. Please try again.");

  try {
    const transactions = await getHistoryUseCase(ctx.user.id);

    if (transactions.length === 0) {
      return ctx.reply(
        "No transactions found. Start by adding income or an expense!",
      );
    }

    const lines = transactions.map(formatTransactionLine);

    return ctx.reply(
      `📋 *Last ${transactions.length} Transactions*\n\n${lines.join("\n")}`,
      { parse_mode: "Markdown" },
    );
  } catch {
    return ctx.reply("Failed to fetch history. Please try again.");
  }
};
