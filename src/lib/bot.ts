import "server-only";
import { Bot } from "grammy";
import { env } from "../env.js";
import { supabaseServer } from "./supabase/server";
import type { FundSource, Transaction, User } from "./supabase/types";

export const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Upsert a Telegram user and return their full row. */
async function upsertUser(
  telegramId: number,
  username: string | undefined,
  firstName: string | undefined,
) {
  const { error: upsertError } = await supabaseServer.from("users").upsert(
    {
      telegram_id: telegramId,
      username: username ?? null,
      first_name: firstName ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "telegram_id" },
  );

  if (upsertError) {
    console.error("upsertUser error:", upsertError);
    return null;
  }

  const result = await supabaseServer
    .from("users")
    .select()
    .eq("telegram_id", telegramId)
    .single<User>();

  if (result.error) {
    console.error("upsertUser select error:", result.error);
    return null;
  }

  return result.data;
}


async function getActiveFundSourceByName(
  userId: number,
  name: string,
) {
  const { data, error } = await supabaseServer
    .from("fund_sources")
    .select()
    .eq("user_id", userId)
    .eq("is_active", true)
    .ilike("name", name)
    .order("created_at", { ascending: false })
    .single<FundSource>();

  if (error) {
    console.error("getActiveFundSourceByName select error:", error);
    return null;
  }

  return data ?? null;
}


// ─── /start ──────────────────────────────────────────────────────────────────

bot.command("start", async (ctx) => {
  await upsertUser(ctx.from!.id, ctx.from!.username, ctx.from!.first_name);

  return ctx.reply(
    `👋 Welcome to your *Financial Tracker*!\n\n` +
      `Here are the commands you can use:\n\n` +
      `💰 *Add income:*\n` +
      `/income\n` +
      `<date> \\- <source>\n` +
      `<category> \\- <description> \\- <amount>\n` +
      `_Example:_\n` +
      `_/income_\n` +
      `_2026\\-03\\-23 \\- BCA_\n` +
      `_salary \\- Monthly pay \\- 5000_\n\n` +
      `💸 *Add expense:*\n` +
      `/expense\n` +
      `<date> \\- <source>\n` +
      `<category> \\- <description> \\- <amount>\n` +
      `_Example:_\n` +
      `_/expense_\n` +
      `_2026\\-03\\-23 \\- BCA_\n` +
      `_food \\- Lunch \\- 50_\n\n` +
      `📦 *Create fund source:*\n` +
      `/source <name> - <detail>\n` +
      `_Example: /source BCA - 531xxxxxx_\n\n` +
      `📊 *Check balance:*\n` +
      `/balance\n\n` +
      `📋 *View recent transactions:*\n` +
      `/history\n\n` +
      `❓ *Help:*\n` +
      `/help`,
    { parse_mode: "Markdown" },
  );
});

// ─── /help ───────────────────────────────────────────────────────────────────

bot.command("help", (ctx) =>
  ctx.reply(
    `*Available Commands*\n\n` +
      `*/income* — add income transactions\n` +
      `Format:\n` +
      `/income\n` +
      `<date> - <source>\n` +
      `<category> - <description> - <amount>\n\n` +
      `*/expense* — add expense transactions\n` +
      `Format:\n` +
      `/expense\n` +
      `<date> - <source>\n` +
      `<category> - <description> - <amount>\n\n` +
      `*/source* <name> - <detail> — create a fund source\n` +
      `*/balance* — total income, expenses & net balance\n` +
      `*/history* — last 10 transactions\n\n` +
      `Amount must be a positive number (e.g. \`150\` or \`3.50\`).`,
    { parse_mode: "Markdown" },
  ),
);

// ─── /source ──────────────────────────────────────────────────────────────

bot.command("source", async (ctx) => {
  const text = ctx.message?.text ?? "";
  const argText = text.replace(/^\/source\s*/i, "").trim();

  const match = /^(.*?)\s*-\s*(.*)$/i.exec(argText);
  if (!match) {
    return ctx.reply(
      "Usage: /source <name> - <detail>\nExample: /source BCA - 531xxxxxx",
    );
  }

  const name = match[1]!.trim();
  if (!name) return ctx.reply("Source name is required.");

  // detail can be empty, e.g. "/source BCA -"
  const detailTrimmed = match[2]!.trim();
  const detail = detailTrimmed.length > 0 ? detailTrimmed : null;

  const user = await upsertUser(
    ctx.from!.id,
    ctx.from!.username,
    ctx.from!.first_name,
  );
  if (!user) return ctx.reply("Failed to identify user. Please try again.");

  const { error } = await supabaseServer.from("fund_sources").insert({
    user_id: user.id,
    name,
    detail,
    // `is_active` defaults to `true` in the DB.
  });

  if (error) {
    console.error("Supabase insert error:", error);
    return ctx.reply("Failed to save source. Please try again.");
  }

  return ctx.reply(
    `✅ Fund source created!\n\n📌 *${name}*${detail ? `\n📝 ${detail}` : ""}`,
    { parse_mode: "Markdown" },
  );
});

// ─── /income ─────────────────────────────────────────────────────────────────

bot.command("income", async (ctx) => {
  const text = ctx.message?.text ?? "";
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(1); // drop the "/income" line

  if (lines.length < 2) {
    return ctx.reply(
      "Usage:\n/income\n<date> - <source>\n<category> - <description> - <amount>\n\nExample:\n/income\n2026-03-23 - BCA\nsalary - Monthly pay - 5000",
    );
  }

  const headerMatch = /^(.+?)\s+-\s+(.+)$/.exec(lines[0]!);
  if (!headerMatch) {
    return ctx.reply(
      "Invalid header. Line 2 must be: <date> - <source>\nExample: 2026-03-23 - BCA",
    );
  }

  const dateStr = headerMatch[1]!.trim();
  const sourceName = headerMatch[2]!.trim();

  if (isNaN(new Date(dateStr).getTime())) {
    return ctx.reply(`Invalid date "${dateStr}". Use YYYY-MM-DD format.`);
  }

  const user = await upsertUser(
    ctx.from!.id,
    ctx.from!.username,
    ctx.from!.first_name,
  );
  if (!user) return ctx.reply("Failed to identify user. Please try again.");

  const source = await getActiveFundSourceByName(user.id, sourceName);
  if (!source) {
    return ctx.reply(
      `Fund source "${sourceName}" not found or inactive.\nCreate it first with /source ${sourceName} - <detail>`,
    );
  }

  type ParsedTx = { category: string; description: string | null; amount: number };
  const transactions: ParsedTx[] = [];

  for (const line of lines.slice(1)) {
    const parts = line.split(" - ");
    if (parts.length < 2) {
      return ctx.reply(
        `Invalid transaction line: "${line}"\nFormat: <category> - <description> - <amount>`,
      );
    }

    const amount = parseFloat(parts[parts.length - 1]!.trim());
    if (isNaN(amount) || amount <= 0) {
      return ctx.reply(
        `Invalid amount in line: "${line}"\nAmount must be a positive number.`,
      );
    }

    const category = parts[0]!.trim() || "other";
    const description =
      parts.length > 2 ? parts.slice(1, -1).join(" - ").trim() || null : null;

    transactions.push({ category, description, amount });
  }

  const { error } = await supabaseServer.from("transactions").insert(
    transactions.map((t) => ({
      user_id: user.id,
      fund_source_id: source.id,
      transaction_date: dateStr,
      amount: t.amount,
      category: t.category,
      description: t.description,
      telegram_message_id: ctx.message?.message_id ?? null,
    })),
  );

  if (error) {
    console.error("Supabase insert error:", error);
    return ctx.reply("Failed to save transactions. Please try again.");
  }

  const replyLines = transactions.map((t) =>
    t.description
      ? `${t.category} - ${t.description} - ${t.amount.toFixed(2)}`
      : `${t.category} - ${t.amount.toFixed(2)}`,
  );

  return ctx.reply([`${dateStr} - ${source.name}`, ...replyLines].join("\n"));
});

// ─── /expense ────────────────────────────────────────────────────────────────

bot.command("expense", async (ctx) => {
  const text = ctx.message?.text ?? "";
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(1); // drop the "/expense" line

  if (lines.length < 2) {
    return ctx.reply(
      "Usage:\n/expense\n<date> - <source>\n<category> - <description> - <amount>\n\nExample:\n/expense\n2026-03-23 - BCA\nfood - Lunch - 50",
    );
  }

  const headerMatch = /^(.+?)\s+-\s+(.+)$/.exec(lines[0]!);
  if (!headerMatch) {
    return ctx.reply(
      "Invalid header. Line 2 must be: <date> - <source>\nExample: 2026-03-23 - BCA",
    );
  }

  const dateStr = headerMatch[1]!.trim();
  const sourceName = headerMatch[2]!.trim();

  if (isNaN(new Date(dateStr).getTime())) {
    return ctx.reply(`Invalid date "${dateStr}". Use YYYY-MM-DD format.`);
  }

  const user = await upsertUser(
    ctx.from!.id,
    ctx.from!.username,
    ctx.from!.first_name,
  );
  if (!user) return ctx.reply("Failed to identify user. Please try again.");

  const source = await getActiveFundSourceByName(user.id, sourceName);
  if (!source) {
    return ctx.reply(
      `Fund source "${sourceName}" not found or inactive.\nCreate it first with /source ${sourceName} - <detail>`,
    );
  }

  type ParsedTx = { category: string; description: string | null; amount: number };
  const transactions: ParsedTx[] = [];

  for (const line of lines.slice(1)) {
    const parts = line.split(" - ");
    if (parts.length < 2) {
      return ctx.reply(
        `Invalid transaction line: "${line}"\nFormat: <category> - <description> - <amount>`,
      );
    }

    const amount = parseFloat(parts[parts.length - 1]!.trim());
    if (isNaN(amount) || amount <= 0) {
      return ctx.reply(
        `Invalid amount in line: "${line}"\nAmount must be a positive number.`,
      );
    }

    const category = parts[0]!.trim() || "other";
    const description =
      parts.length > 2 ? parts.slice(1, -1).join(" - ").trim() || null : null;

    transactions.push({ category, description, amount });
  }

  const { error } = await supabaseServer.from("transactions").insert(
    transactions.map((t) => ({
      user_id: user.id,
      fund_source_id: source.id,
      transaction_date: dateStr,
      amount: -t.amount,
      category: t.category,
      description: t.description,
      telegram_message_id: ctx.message?.message_id ?? null,
    })),
  );

  if (error) {
    console.error("Supabase insert error:", error);
    return ctx.reply("Failed to save transactions. Please try again.");
  }

  const replyLines = transactions.map((t) =>
    t.description
      ? `${t.category} - ${t.description} - ${t.amount.toFixed(2)}`
      : `${t.category} - ${t.amount.toFixed(2)}`,
  );

  return ctx.reply([`${dateStr} - ${source.name}`, ...replyLines].join("\n"));
});

// ─── /balance ────────────────────────────────────────────────────────────────

bot.command("balance", async (ctx) => {
  const user = await upsertUser(
    ctx.from!.id,
    ctx.from!.username,
    ctx.from!.first_name,
  );
  if (!user) return ctx.reply("Failed to identify user. Please try again.");

  const { data, error } = await supabaseServer
    .from("transactions")
    .select("amount")
    .eq("user_id", user.id)
    .overrideTypes<Pick<Transaction, "amount">[]>();

  if (error) {
    console.error("Supabase select error:", error);
    return ctx.reply("Failed to fetch balance. Please try again.");
  }

  const totalIncome = (data ?? [])
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = (data ?? [])
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const net = totalIncome - totalExpense;
  const netSign = net >= 0 ? "+" : "";

  return ctx.reply(
    `📊 *Your Balance* (${user.currency})\n\n` +
      `💰 Total Income:   *${totalIncome.toFixed(2)}*\n` +
      `💸 Total Expenses: *${totalExpense.toFixed(2)}*\n` +
      `━━━━━━━━━━━━━━\n` +
      `📈 Net Balance:    *${netSign}${net.toFixed(2)}*`,
    { parse_mode: "Markdown" },
  );
});

// ─── /history ────────────────────────────────────────────────────────────────

bot.command("history", async (ctx) => {
  const user = await upsertUser(
    ctx.from!.id,
    ctx.from!.username,
    ctx.from!.first_name,
  );
  if (!user) return ctx.reply("Failed to identify user. Please try again.");

  const { data, error } = await supabaseServer
    .from("transactions")
    .select()
    .eq("user_id", user.id)
    .order("transaction_date", { ascending: false })
    .limit(10)
    .overrideTypes<Transaction[]>();

  if (error) {
    console.error("Supabase select error:", error);
    return ctx.reply("Failed to fetch history. Please try again.");
  }

  if (!data || data.length === 0) {
    return ctx.reply(
      "No transactions found. Start by adding income or an expense!",
    );
  }

  const lines = data.map((t) => {
    const isIncome = t.amount >= 0;
    const sign = isIncome ? "+" : "";
    const emoji = isIncome ? "💰" : "💸";
    const date = new Date(t.transaction_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const desc = t.description ? ` — ${t.description}` : "";
    const cat = t.category ?? "uncategorized";
    return `${emoji} \`${sign}${Number(t.amount).toFixed(2)}\` *${cat}*${desc} _(${date})_`;
  });

  return ctx.reply(
    `📋 *Last ${data.length} Transactions*\n\n${lines.join("\n")}`,
    { parse_mode: "Markdown" },
  );
});

// ─── Fallback ─────────────────────────────────────────────────────────────────

bot.on("message", (ctx) =>
  ctx.reply("I didn't understand that. Type /help to see available commands."),
);
