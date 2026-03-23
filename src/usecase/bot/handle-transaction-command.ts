import type { AppContext } from "~/lib/bot-context";
import { addTransactionUseCase } from "~/usecase/add-transaction.usecase";
import type { TransactionEntry } from "~/usecase/add-transaction.usecase";

// ─── Parsers ──────────────────────────────────────────────────────────────────

type ParsedCommand =
  | { ok: true; dateStr: string; sourceName: string; entries: TransactionEntry[] }
  | { ok: false; errorMessage: string };

function parseTransactionCommand(text: string): ParsedCommand {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(1);

  if (lines.length < 2) {
    return {
      ok: false,
      errorMessage:
        "Usage:\n/income\n<date> - <source>\n<category> - <description> - <amount>\n\nExample:\n/income\n2026-03-23 - BCA\nsalary - Monthly pay - 5000",
    };
  }

  const headerMatch = /^(.+?)\s+-\s+(.+)$/.exec(lines[0]!);
  if (!headerMatch) {
    return {
      ok: false,
      errorMessage:
        "Invalid header. Line 2 must be: <date> - <source>\nExample: 2026-03-23 - BCA",
    };
  }

  const dateStr = headerMatch[1]!.trim();
  const sourceName = headerMatch[2]!.trim();

  if (isNaN(new Date(dateStr).getTime())) {
    return {
      ok: false,
      errorMessage: `Invalid date "${dateStr}". Use YYYY-MM-DD format.`,
    };
  }

  const entries: TransactionEntry[] = [];

  for (const line of lines.slice(1)) {
    const parts = line.split(" - ");
    if (parts.length < 2) {
      return {
        ok: false,
        errorMessage: `Invalid transaction line: "${line}"\nFormat: <category> - <description> - <amount>`,
      };
    }

    const amount = parseFloat(parts[parts.length - 1]!.trim());
    if (isNaN(amount) || amount <= 0) {
      return {
        ok: false,
        errorMessage: `Invalid amount in line: "${line}"\nAmount must be a positive number.`,
      };
    }

    const category = parts[0]!.trim() || "other";
    const description =
      parts.length > 2 ? parts.slice(1, -1).join(" - ").trim() || null : null;

    entries.push({ category, description, amount });
  }

  return { ok: true, dateStr, sourceName, entries };
}

function formatReply(
  dateStr: string,
  sourceName: string,
  entries: TransactionEntry[],
): string {
  const lines = entries.map((e) =>
    e.description
      ? `${e.category} - ${e.description} - ${e.amount.toFixed(2)}`
      : `${e.category} - ${e.amount.toFixed(2)}`,
  );
  return [`${dateStr} - ${sourceName}`, ...lines].join("\n");
}

// ─── Handler ──────────────────────────────────────────────────────────────────

async function handleTransactionCommand(ctx: AppContext, sign: 1 | -1) {
  const parsed = parseTransactionCommand(ctx.message?.text ?? "");
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
  handleTransactionCommand(ctx, 1);

export const handleExpenseCommand = (ctx: AppContext) =>
  handleTransactionCommand(ctx, -1);
