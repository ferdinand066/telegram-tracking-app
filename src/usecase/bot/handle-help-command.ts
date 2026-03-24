import type { AppContext } from "~/lib/bot-context";

export const handleHelpCommand = (ctx: AppContext) =>
  ctx.reply(
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
      `Amount must be a positive number (e.g. \`150.000\` or \`15k\`).\n\n` +
      `*/receipt* — Add a receipt based on image\n` +
      `Format:\n` +
      `/receipt\n` +
      `<date> - <source> - <category>\n\n` +
      `Example:\n` +
      `/receipt\n` +
      `Today - BCA - food`,
    { parse_mode: "Markdown" },
  );
