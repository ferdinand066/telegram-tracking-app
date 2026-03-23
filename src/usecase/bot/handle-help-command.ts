import type { AppContext } from "~/lib/bot-context";

export function handleHelpCommand(ctx: AppContext) {
  return ctx.reply(
    `*Available Commands*\n\n` +
      `*/income* — add income transactions\n` +
      `Format:\n` +
      `/income\n` +
      `<date> - <source>\n` +
      `<category> - <description> - <amount>\n\n` +
      `*/expense* — add expense transactions\n` +
      `Format:\n` +
      `/expense\n` +
      `<date> - <source>\n` +
      `<category> - <description> - <amount>\n\n` +
      `*/source* <name> - <detail> — create a fund source\n` +
      `*/balance* — total income, expenses & net balance\n` +
      `*/history* — last 10 transactions\n\n` +
      `Amount must be a positive number (e.g. \`150\` or \`3.50\`).`,
    { parse_mode: "Markdown" },
  );
}
