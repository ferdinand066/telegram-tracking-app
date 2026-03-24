import type { Filter } from "grammy";
import type { AppContext } from "~/lib/bot-context";
import {
  addTransactionUseCase,
  TRANSACTION_TYPE,
} from "~/usecase/add-transaction.usecase";
import { pendingReceiptStore } from "~/store/pending-receipt.store";
import { formatTransactionReply } from "~/utils/format-transaction-reply";

type CallbackCtx = Filter<AppContext, "callback_query:data">;

export const handleReceiptConfirmYes = async (ctx: CallbackCtx) => {
  await ctx.answerCallbackQuery();

  if (!ctx.user) return ctx.reply("Failed to identify user. Please try again.");

  const pending = pendingReceiptStore.get(ctx.user.id);
  if (!pending)
    return ctx.reply("No pending receipt found. Please start over.");

  pendingReceiptStore.delete(ctx.user.id);

  try {
    const { source, entries } = await addTransactionUseCase({
      userId: ctx.user.id,
      fundSourceName: pending.sourceName,
      dateStr: pending.dateStr,
      entries: pending.entries,
      sign: TRANSACTION_TYPE.EXPENSE,
      telegramMessageId: pending.telegramMessageId,
    });

    await ctx.editMessageReplyMarkup();
    return ctx.reply(
      formatTransactionReply(pending.dateStr, source.name, entries),
    );
  } catch (err) {
    return ctx.reply(
      err instanceof Error
        ? err.message
        : "Failed to save transaction. Please try again.",
    );
  }
};

export const handleReceiptConfirmNo = async (ctx: CallbackCtx) => {
  await ctx.answerCallbackQuery();

  if (ctx.user) {
    pendingReceiptStore.delete(ctx.user.id);
  }

  await ctx.editMessageReplyMarkup();
  return ctx.reply("Receipt cancelled.");
};
