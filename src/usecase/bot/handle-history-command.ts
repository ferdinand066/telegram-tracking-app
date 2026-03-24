import type { AppContext } from "~/lib/bot-context";
import { getHistoryUseCase } from "~/usecase/get-history.usecase";
import type { TransactionWithSource } from "~/repository/transaction.repository";
import { formatAmount } from "~/utils/amount";
import { formatCategoryTitleCase } from "~/utils/category";
import { parseHumanReadableDate } from "~/utils/date";

const USAGE_MESSAGE =
  "Usage:\n/history <date>\n/history <start date> - <end date>\n\nDate formats: Today, Yesterday, 28 Feb, 28 Feb 2025, 2025-02-28";

type ParsedHistoryCommand =
  | { ok: true; mode: "single"; date: string }
  | { ok: true; mode: "range"; startDate: string; endDate: string }
  | { ok: false; errorMessage: string };

const parseHistoryCommand = (text: string): ParsedHistoryCommand => {
  const args = text
    .trim()
    .replace(/^\/history\s*/i, "")
    .trim();
  if (!args) return { ok: false, errorMessage: USAGE_MESSAGE };

  // Try each " - " occurrence as a potential range separator
  const separatorRegex = / - /g;
  let match: RegExpExecArray | null;
  while ((match = separatorRegex.exec(args)) !== null) {
    const left = args.slice(0, match.index).trim();
    const right = args.slice(match.index + 3).trim();
    const startDate = parseHumanReadableDate(left);
    const endDate = parseHumanReadableDate(right);
    if (startDate && endDate) {
      return { ok: true, mode: "range", startDate, endDate };
    }
  }

  const date = parseHumanReadableDate(args);
  if (date) return { ok: true, mode: "single", date };

  return {
    ok: false,
    errorMessage: `Invalid date "${args}".\nAccepted formats: Today, Yesterday, 28 Feb, 28 Feb 2025`,
  };
};

const formatTransactionLine = (
  t: TransactionWithSource,
  includeDate: boolean,
): string => {
  const category = formatCategoryTitleCase(t.category ?? "uncategorized");
  const descPart = t.description ? ` - ${t.description}` : "";
  const sign = t.amount >= 0 ? "+" : "";
  const amountStr = `${sign}${formatAmount(t.amount)}`;

  if (includeDate) {
    const date = new Date(t.transaction_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    return `${date} - ${category}${descPart} - ${amountStr}`;
  }

  return `${category}${descPart} - ${amountStr}`;
};

const groupByFundSource = (
  transactions: TransactionWithSource[],
): Map<string, TransactionWithSource[]> => {
  const groups = new Map<string, TransactionWithSource[]>();
  for (const t of transactions) {
    const sourceName = t.fund_sources?.name ?? "Unknown";
    if (!groups.has(sourceName)) groups.set(sourceName, []);
    groups.get(sourceName)!.push(t);
  }
  return groups;
};

const buildSummaryBlock = (transactions: TransactionWithSource[]): string => {
  let totalIncome = 0;
  let totalExpense = 0;
  for (const t of transactions) {
    if (t.amount >= 0) totalIncome += t.amount;
    else totalExpense += Math.abs(t.amount);
  }
  const net = totalIncome - totalExpense;
  const netSign = net >= 0 ? "+" : "-";
  return [
    `💰 Total Income: ${formatAmount(totalIncome)}`,
    `💸 Total Expense: ${formatAmount(totalExpense)}`,
    `📊 Net: ${netSign}${formatAmount(Math.abs(net))}`,
  ].join("\n");
};

export const handleHistoryCommand = async (ctx: AppContext) => {
  if (!ctx.user) return ctx.reply("Failed to identify user. Please try again.");

  const parsed = parseHistoryCommand(ctx.message?.text ?? "");
  if (!parsed.ok) return ctx.reply(parsed.errorMessage);

  const { startDate, endDate } =
    parsed.mode === "single"
      ? { startDate: parsed.date, endDate: parsed.date }
      : { startDate: parsed.startDate, endDate: parsed.endDate };

  const includeDate = parsed.mode === "range";

  try {
    const transactions = await getHistoryUseCase(
      ctx.user.id,
      startDate,
      endDate,
    );

    if (transactions.length === 0) {
      return ctx.reply("No transactions found for the given period.");
    }

    const groups = groupByFundSource(transactions);
    const sections: string[] = [];

    for (const [sourceName, txns] of groups) {
      const lines = txns.map((t) => formatTransactionLine(t, includeDate));
      sections.push(`*${sourceName}*\n${lines.join("\n")}`);
    }

    const summary = buildSummaryBlock(transactions);
    const body = `${sections.join("\n\n")}\n\n${summary}`;

    return ctx.reply(body, { parse_mode: "Markdown" });
  } catch {
    return ctx.reply("Failed to fetch history. Please try again.");
  }
};
