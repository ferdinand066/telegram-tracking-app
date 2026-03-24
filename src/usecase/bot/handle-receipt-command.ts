import type { AppContext } from "~/lib/bot-context";
import { parseHumanReadableDate } from "~/utils/date";
import { ocrReceiptFromFileId } from "~/usecase/receipt/ocr-receipt";
import {
  formatReceiptConfirmation,
  parseReceiptText,
} from "~/usecase/receipt/parse-receipt-text";
import { pendingReceiptStore } from "~/store/pending-receipt.store";

const USAGE_MESSAGE = [
  "Send a receipt photo with the caption:",
  "/receipt",
  "<date> - <source> - <category>",
  "",
  "Example caption:",
  "/receipt",
  "Today - BCA - food",
  "",
  "Accepted date formats: Today, Yesterday, 28 Feb, 28 Feb 2025",
].join("\n");

export const handleReceiptCommand = async (ctx: AppContext) => {
  if (!ctx.user) return ctx.reply("Failed to identify user. Please try again.");

  const photo = ctx.message?.photo;
  if (!photo?.length) return ctx.reply(USAGE_MESSAGE);

  // For text commands, grammy sets ctx.match to the text after "/receipt".
  // For photo+caption commands, grammy does NOT set ctx.match, so we parse
  // the caption directly as a fallback.
  const captionAfterCommand =
    /^\/receipt(?:@\w+)?\s*([\s\S]*)$/i.exec(
      ctx.message?.caption ?? "",
    )?.[1]?.trim() ?? "";

  const rawMatch =
    typeof ctx.match === "string" ? ctx.match : (ctx.match?.[0] ?? "");
  const matchText = rawMatch.trim() || captionAfterCommand;

  const headerLine = matchText
    .split("\n")
    .map((l: string) => l.trim())
    .find(Boolean);

  if (!headerLine) return ctx.reply(USAGE_MESSAGE);

  const parts = headerLine.split(" - ").map((p: string) => p.trim());
  if (parts.length < 3) {
    return ctx.reply(
      "Invalid caption format. Expected: <date> - <source> - <category>\n\nExample: Today - BCA - food",
    );
  }

  const rawDate = parts[0] ?? "";
  const sourceName = parts[1] ?? "";
  const category = parts.slice(2).join(" - ");

  const dateStr = parseHumanReadableDate(rawDate);
  if (!dateStr) {
    return ctx.reply(
      `Invalid date "${rawDate}".\nAccepted formats: Today, Yesterday, 28 Feb, 28 Feb 2025`,
    );
  }

  await ctx.reply("On process, please wait...");

  try {
    const fileId = photo.at(-1)!.file_id;
    const ocrText = await ocrReceiptFromFileId(fileId);
    const parsed = parseReceiptText(ocrText, category);

    if (parsed.entries.length === 0) {
      return ctx.reply(
        "Could not extract any items or total from the receipt.\nPlease try again or use /expense to enter it manually.",
      );
    }

    pendingReceiptStore.set(ctx.user.id, {
      dateStr,
      sourceName,
      entries: parsed.entries,
      telegramMessageId: ctx.message?.message_id ?? null,
    });

    const confirmation = formatReceiptConfirmation(
      dateStr,
      sourceName,
      category,
      parsed,
    );

    return ctx.reply(
      `${confirmation}\n\nProceed? Reply Y to confirm or N to cancel.`,
    );
  } catch (err) {
    return ctx.reply(
      err instanceof Error
        ? err.message
        : "Failed to process receipt. Please try again.",
    );
  }
};
