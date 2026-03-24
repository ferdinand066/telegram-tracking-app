import "server-only";
import { Bot } from "grammy";
import { env } from "../env.js";
import { userRepository } from "~/repository/user.repository";
import type { AppContext } from "~/lib/bot-context";
import { handleStartCommand } from "~/usecase/bot/handle-start-command";
import { handleHelpCommand } from "~/usecase/bot/handle-help-command";
import { handleSourceCommand } from "~/usecase/bot/handle-source-command";
import {
  handleIncomeCommand,
  handleExpenseCommand,
} from "~/usecase/bot/handle-transaction-command";
import { handleBalanceCommand } from "~/usecase/bot/handle-balance-command";
import { handleHistoryCommand } from "~/usecase/bot/handle-history-command";
import { handleFallbackMessage } from "~/usecase/bot/handle-fallback-message";

export const bot = new Bot<AppContext>(env.TELEGRAM_BOT_TOKEN);

bot.use(async (ctx, next) => {
  ctx.user = ctx.from
    ? await userRepository.upsert(
        ctx.from.id,
        ctx.from.username,
        ctx.from.first_name,
      )
    : null;
  return next();
});

bot.command("start", handleStartCommand);
bot.command("help", handleHelpCommand);
bot.command("source", handleSourceCommand);
bot.command("income", handleIncomeCommand);
bot.command("expense", handleExpenseCommand);
bot.command("balance", handleBalanceCommand);
bot.command("history", handleHistoryCommand);
bot.on("message", handleFallbackMessage);
