import type { AppContext } from "~/lib/bot-context";
import { parseHumanReadableDate } from "~/utils/date";
import { pendingReceiptPhotoStore } from "~/store/pending-receipt-photo.store";

const USAGE_MESSAGE = [
  "Send receipt details in the format:",
  "/receipt <date> - <category> - <source>",
  "",
  "Example:",
  "/receipt Today - food - BCA",
  "",
  "Accepted date formats: Today, Yesterday, 28 Feb, 28 Feb 2025",
].join("\n");

export const handleReceiptCommand = async (ctx: AppContext) => {
  if (!ctx.user) return ctx.reply("Failed to identify user. Please try again.");

  const matchText =
    typeof ctx.match === "string" ? ctx.match.trim() : (ctx.match?.[0] ?? "");

  if (!matchText) return ctx.reply(USAGE_MESSAGE);

  const parts = matchText.split(" - ").map((p) => p.trim());
  if (parts.length < 3) {
    return ctx.reply(
      "Invalid format. Expected: <date> - <category> - <source>\n\nExample: Today - food - BCA",
    );
  }

  const rawDate = parts[0]!;
  const category = parts[1]!;
  const sourceName = parts.slice(2).join(" - ");

  const dateStr = parseHumanReadableDate(rawDate);
  if (!dateStr) {
    return ctx.reply(
      `Invalid date "${rawDate}".\nAccepted formats: Today, Yesterday, 28 Feb, 28 Feb 2025`,
    );
  }

  pendingReceiptPhotoStore.set(ctx.user.id, {
    dateStr,
    sourceName,
    category,
    isProcessing: false,
  });

  return ctx.reply("Got it! Now send me the receipt photo.");
};
