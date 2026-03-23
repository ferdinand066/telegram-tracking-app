import type { AppContext } from "~/lib/bot-context";

export function handleFallbackMessage(ctx: AppContext) {
  return ctx.reply("I didn't understand that. Type /help to see available commands.");
}
