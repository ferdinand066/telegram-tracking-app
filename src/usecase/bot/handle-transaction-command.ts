import dayjs from "dayjs";
import type { AppContext } from "~/lib/bot-context";
import type { TransactionEntry, TransactionType } from "~/usecase/add-transaction.usecase";
import { addTransactionUseCase, TRANSACTION_TYPE } from "~/usecase/add-transaction.usecase";
import { formatAmount, parseAmount } from "~/utils/amount";
import { HUMAN_READABLE_DATE_FORMATS, parseHumanReadableDate } from "~/utils/date";

// ─── Parsers ──────────────────────────────────────────────────────────────────

type ParsedCommand =
  | { ok: true; dateStr: string; sourceName: string; entries: TransactionEntry[] }
  | { ok: false; errorMessage: string };

function parseTransactionCommand(text: string, sign: TransactionType): ParsedCommand {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(1);

  const command = sign === TRANSACTION_TYPE.INCOME ? "income" : "expense";

  if (lines.length < 2) {
    return {
      ok: false,
      errorMessage:
        `Usage:\n/${command}\n<date> - <category> - <source>\n<description> - <amount>\n\n<amount> formats:\n- 5000 (plain number)\n- 2k / 2K (k = 1,000)\n- 3jt / 3JT (jt = 1,000,000)\n- 15.2k = 15,200 | 17.5jt = 17,500,000\n\nExample:\n/${command}\nToday - salary - BCA\nMonthly pay - 5000`,
    };
  }

  const headerParts = lines[0]!.split(" - ").map((p) => p.trim());
  if (headerParts.length < 3) {
    return {
      ok: false,
      errorMessage:
        "Invalid header. Line 2 must be: <date> - <category> - <source>\nExample: Today - salary - BCA",
    };
  }

  const rawDate = headerParts[0]!;
  const category = headerParts[1]!;
  const sourceName = headerParts.slice(2).join(" - ");

  const dateStr = parseHumanReadableDate(rawDate);
  if (!dateStr) {
    return {
      ok: false,
      errorMessage: `Invalid date "${rawDate}".\nAccepted formats: Today, Yesterday, 28 Feb, 28 Feb 2025`,
    };
  }

  const entries: TransactionEntry[] = [];

  for (const line of lines.slice(1)) {
    const parts = line.split(" - ");
    if (parts.length < 1) {
      return {
        ok: false,
        errorMessage: `Invalid transaction line: "${line}"\nFormat: <description> - <amount>`,
      };
    }

    const amount = parseAmount(parts[parts.length - 1]!.trim());
    if (isNaN(amount) || amount <= 0) {
      return {
        ok: false,
        errorMessage:
          `Invalid amount in line: "${line}"\nAmount must be a positive number.\nSupported: 5000, 5.000, 2k/2K, 3jt/3JT`,
      };
    }

    const description =
      parts.length > 1 ? parts.slice(0, -1).join(" - ").trim() || null : null;

    entries.push({ category, description, amount });
  }

  return { ok: true, dateStr, sourceName, entries };
}

function formatReply(
  dateStr: string,
  sourceName: string,
  entries: TransactionEntry[],
): string {
  const parsedDate = dayjs(dateStr).format(HUMAN_READABLE_DATE_FORMATS.DAY_MONTH_YEAR);
  const category = entries[0]?.category ?? "other";

  const lines = entries.map((e) =>
    e.description
      ? `${e.description} - ${formatAmount(e.amount)}`
      : formatAmount(e.amount),
  );
  return [`${parsedDate} - ${category} - ${sourceName}`, ...lines].join("\n");
}

// ─── Handler ──────────────────────────────────────────────────────────────────

async function handleTransactionCommand(ctx: AppContext, sign: TransactionType) {
  const parsed = parseTransactionCommand(ctx.message?.text ?? "", sign);
  if (!parsed.ok) return ctx.reply(parsed.errorMessage);

  if (!ctx.user) return ctx.reply("Failed to identify user. Please try again.");

  try {
    const { source, entries } = await addTransactionUseCase({
      userId: ctx.user.id,
      fundSourceName: parsed.sourceName,
      dateStr: parsed.dateStr,
      entries: parsed.entries,
      sign,
      telegramMessageId: ctx.message?.message_id ?? null,
    });

    return ctx.reply(formatReply(parsed.dateStr, source.name, entries));
  } catch (err) {
    return ctx.reply(
      err instanceof Error ? err.message : "Failed to save transactions. Please try again.",
    );
  }
}

export const handleIncomeCommand = (ctx: AppContext) =>
  handleTransactionCommand(ctx, TRANSACTION_TYPE.INCOME);

export const handleExpenseCommand = (ctx: AppContext) =>
  handleTransactionCommand(ctx, TRANSACTION_TYPE.EXPENSE);
