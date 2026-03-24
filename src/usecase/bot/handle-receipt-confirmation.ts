import type { NextFunction } from "grammy";
import type { AppContext } from "~/lib/bot-context";
import {
  addTransactionUseCase,
  TRANSACTION_TYPE,
} from "~/usecase/add-transaction.usecase";
import { pendingReceiptStore } from "~/store/pending-receipt.store";
import { formatTransactionReply } from "~/utils/format-transaction-reply";

export const handleReceiptConfirmation = async (
  ctx: AppContext,
  next: NextFunction,
) => {
  if (!ctx.user) return next();

  const pending = pendingReceiptStore.get(ctx.user.id);
  if (!pending) return next();

  const text = ctx.message?.text?.trim().toLowerCase() ?? "";

  if (text === "y" || text === "yes") {
    pendingReceiptStore.delete(ctx.user.id);

    try {
      const { source } = await addTransactionUseCase({
        userId: ctx.user.id,
        fundSourceName: pending.sourceName,
        dateStr: pending.dateStr,
        entries: pending.entries,
        sign: TRANSACTION_TYPE.EXPENSE,
        telegramMessageId: pending.telegramMessageId,
      });

      return ctx.reply(
        formatTransactionReply(pending.dateStr, source.name, pending.entries),
      );
    } catch (err) {
      return ctx.reply(
        err instanceof Error
          ? err.message
          : "Failed to save transaction. Please try again.",
      );
    }
  }

  if (text === "n" || text === "no") {
    pendingReceiptStore.delete(ctx.user.id);
    return ctx.reply("Receipt cancelled.");
  }

  return next();
};
