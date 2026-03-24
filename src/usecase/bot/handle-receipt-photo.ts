import type { NextFunction } from "grammy";
import { InlineKeyboard } from "grammy";
import type { AppContext } from "~/lib/bot-context";
import { ocrReceiptFromFileId } from "~/usecase/receipt/ocr-receipt";
import { parseReceiptWords } from "~/usecase/receipt/parse-receipt-words";
import { pendingReceiptPhotoStore } from "~/store/pending-receipt-photo.store";
import { pendingReceiptStore } from "~/store/pending-receipt.store";
import { formatAmount } from "~/utils/amount";
import dayjs from "dayjs";
import { HUMAN_READABLE_DATE_FORMATS } from "~/utils/date";

const IMAGE_DOCUMENT_NAME = /\.(jpe?g|png|gif|webp|bmp|heic|tiff?)$/i;

function getReceiptImageFileId(message: AppContext["message"]): string | null {
  if (!message) return null;

  const photos = "photo" in message ? message.photo : undefined;
  if (photos?.length) return photos.at(-1)!.file_id;

  const doc = "document" in message ? message.document : undefined;
  if (!doc) return null;

  const mime = doc.mime_type ?? "";
  if (mime.startsWith("image/")) return doc.file_id;

  const name = doc.file_name ?? "";
  if (IMAGE_DOCUMENT_NAME.test(name)) return doc.file_id;

  return null;
}

const RECEIPT_CONFIRM_KEYBOARD = new InlineKeyboard()
  .text("Yes", "receipt:confirm")
  .text("No", "receipt:cancel");

export const handleReceiptPhoto = async (
  ctx: AppContext,
  next: NextFunction,
) => {
  if (!ctx.user) return next();

  const pending = pendingReceiptPhotoStore.get(ctx.user.id);
  if (!pending) return next();

  // Silently ignore Telegram webhook retries while OCR is in progress
  if (pending.isProcessing) return;

  const fileId = getReceiptImageFileId(ctx.message);
  if (!fileId) return next();

  pendingReceiptPhotoStore.set(ctx.user.id, { ...pending, isProcessing: true });

  await ctx.reply("On process, please wait...");

  try {
    const ocrResult = await ocrReceiptFromFileId(fileId);
    const parsed = parseReceiptWords(ocrResult, pending.category);

    pendingReceiptPhotoStore.delete(ctx.user.id);

    if (parsed.entries.length === 0) {
      return ctx.reply(
        "Could not extract any items from the receipt.\nPlease try again or use /expense to enter it manually.",
      );
    }

    pendingReceiptStore.set(ctx.user.id, {
      dateStr: pending.dateStr,
      sourceName: pending.sourceName,
      category: pending.category,
      entries: parsed.entries,
      telegramMessageId: ctx.message?.message_id ?? null,
    });

    const date = dayjs(pending.dateStr).format(
      HUMAN_READABLE_DATE_FORMATS.DAY_MONTH_YEAR,
    );

    const lines: string[] = [
      `${date} - ${pending.category} - ${pending.sourceName}`,
      ...parsed.entries.map(
        (e) => `${e.description ?? "Item"} - ${formatAmount(e.amount)}`,
      ),
      "",
      "Save?",
    ];

    return ctx.reply(lines.join("\n"), {
      reply_markup: RECEIPT_CONFIRM_KEYBOARD,
    });
  } catch (err) {
    pendingReceiptPhotoStore.delete(ctx.user.id);
    return ctx.reply(
      err instanceof Error
        ? err.message
        : "Failed to process receipt. Please try again.",
    );
  }
};
