import "server-only";
import { Bot } from "grammy";
import { env } from "../env.js";
import { supabaseServer } from "./supabase/server";
import type { Transaction, User } from "./supabase/types";

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

function todayIso(): string {
  return new Date().toISOString().split("T")[0]!;
}

// ─── /start ──────────────────────────────────────────────────────────────────

bot.command("start", async (ctx) => {
  await upsertUser(ctx.from!.id, ctx.from!.username, ctx.from!.first_name);

  return ctx.reply(
    `👋 Welcome to your *Financial Tracker*!\n\n` +
      `Here are the commands you can use:\n\n` +
      `💰 *Add income:*\n` +
      `/income <amount> <category> [description]\n` +
      `_Example: /income 5000 salary Monthly pay_\n\n` +
      `💸 *Add expense:*\n` +
      `/expense <amount> <category> [description]\n` +
      `_Example: /expense 50 food Lunch_\n\n` +
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
      `/income <amount> <category> [description]\n` +
      `/expense <amount> <category> [description]\n` +
      `/balance — show total income, expenses, and net balance\n` +
      `/history — show your last 10 transactions\n\n` +
      `*Amount* should be a positive number (e.g. \`150\` or \`3.50\`).`,
    { parse_mode: "Markdown" },
  ),
);

// ─── /income ─────────────────────────────────────────────────────────────────

bot.command("income", async (ctx) => {
  const parts = ctx.message?.text?.split(" ").slice(1) ?? [];
  if (parts.length < 2) {
    return ctx.reply(
      "Usage: /income <amount> <category> [description]\nExample: /income 5000 salary Monthly pay",
    );
  }

  const amount = parseFloat(parts[0] ?? "");
  if (isNaN(amount) || amount <= 0) {
    return ctx.reply("Amount must be a positive number.");
  }

  const user = await upsertUser(
    ctx.from!.id,
    ctx.from!.username,
    ctx.from!.first_name,
  );
  if (!user) return ctx.reply("Failed to identify user. Please try again.");

  const category = parts[1] ?? "other";
  const description = parts.slice(2).join(" ") || null;

  const { error } = await supabaseServer.from("transactions").insert({
    user_id: user.id,
    transaction_date: todayIso(),
    amount,
    category,
    description,
    telegram_message_id: ctx.message?.message_id ?? null,
  });

  if (error) {
    console.error("Supabase insert error:", error);
    return ctx.reply("Failed to save transaction. Please try again.");
  }

  return ctx.reply(
    `✅ Income recorded!\n\n💰 *+${amount}* — ${category}${description ? `\n📝 ${description}` : ""}`,
    { parse_mode: "Markdown" },
  );
});

// ─── /expense ────────────────────────────────────────────────────────────────

bot.command("expense", async (ctx) => {
  const parts = ctx.message?.text?.split(" ").slice(1) ?? [];
  if (parts.length < 2) {
    return ctx.reply(
      "Usage: /expense <amount> <category> [description]\nExample: /expense 50 food Lunch",
    );
  }

  const amount = parseFloat(parts[0] ?? "");
  if (isNaN(amount) || amount <= 0) {
    return ctx.reply("Amount must be a positive number.");
  }

  const user = await upsertUser(
    ctx.from!.id,
    ctx.from!.username,
    ctx.from!.first_name,
  );
  if (!user) return ctx.reply("Failed to identify user. Please try again.");

  const category = parts[1] ?? "other";
  const description = parts.slice(2).join(" ") || null;

  const { error } = await supabaseServer.from("transactions").insert({
    user_id: user.id,
    transaction_date: todayIso(),
    amount: -amount,
    category,
    description,
    telegram_message_id: ctx.message?.message_id ?? null,
  });

  if (error) {
    console.error("Supabase insert error:", error);
    return ctx.reply("Failed to save transaction. Please try again.");
  }

  return ctx.reply(
    `✅ Expense recorded!\n\n💸 *-${amount}* — ${category}${description ? `\n📝 ${description}` : ""}`,
    { parse_mode: "Markdown" },
  );
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
