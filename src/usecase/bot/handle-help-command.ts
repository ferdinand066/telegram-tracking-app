import type { AppContext } from "~/lib/bot-context";

export function handleHelpCommand(ctx: AppContext) {
  return ctx.reply(
    `*Available Commands*\n\n` +
      `*/income* — Add income transactions\n` +
      `Format:\n` +
      `/income\n` +
      `<date> - <source>\n` +
      `<category> - <description> - <amount>\n\n` +
      `*/expense* — Add expense transactions\n` +
      `Format:\n` +
      `/expense\n` +
      `<date> - <source>\n` +
      `<category> - <description> - <amount>\n\n` +
      `*/source* <name> - <detail> — Create a fund source\n` +
      `*/balance* — Total income, expenses & net balance\n` +
      `*/history* — Last 10 transactions\n\n` +
      `Amount must be a positive number (e.g. \`150\` or \`3.50\`).`,
    { parse_mode: "Markdown" },
  );
}
