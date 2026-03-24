import type { AppContext } from "~/lib/bot-context";

export const handleFallbackMessage = (ctx: AppContext) =>
  ctx.reply("I didn't understand that. Type /help to see available commands.");
