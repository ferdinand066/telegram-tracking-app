import type { AppContext } from "~/lib/bot-context";
import { createFundSourceUseCase } from "~/usecase/create-fund-source.usecase";

export async function handleSourceCommand(ctx: AppContext) {
  const argText = (ctx.message?.text ?? "").replace(/^\/source\s*/i, "").trim();
  const match = /^(.*?)\s*-\s*(.*)$/i.exec(argText);

  if (!match) {
    return ctx.reply(
      "Usage: /source <name> - <detail>\nExample: /source BCA - 531xxxxxx",
    );
  }

  const name = match[1]!.trim();
  if (!name) return ctx.reply("Source name is required.");

  const detailTrimmed = match[2]!.trim();
  const detail = detailTrimmed.length > 0 ? detailTrimmed : null;

  if (!ctx.user) return ctx.reply("Failed to identify user. Please try again.");

  try {
    await createFundSourceUseCase({ userId: ctx.user.id, name, detail });
  } catch {
    return ctx.reply("Failed to save source. Please try again.");
  }

  return ctx.reply(
    `✅ Fund source created!\n\n📌 *${name}*${detail ? `\n📝 ${detail}` : ""}`,
    { parse_mode: "Markdown" },
  );
}
