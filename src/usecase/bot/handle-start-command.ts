import dayjs from "dayjs";
import type { AppContext } from "~/lib/bot-context";
import { HUMAN_READABLE_DATE_FORMATS } from "~/utils/date";

export function handleStartCommand(ctx: AppContext) {
  const today = dayjs().format(HUMAN_READABLE_DATE_FORMATS.DAY_MONTH_YEAR);

  return ctx.reply(
    `👋 Welcome to your *Financial Tracker*!\n\n` +
      `Here are the commands you can use:\n\n` +
      `💰 *Add income:*\n` +
      `/income\n` +
      `<date> \- <source>\n` +
      `<category> \- <description> \- <amount>\n` +
      `_Example:_\n` +
      `_/income_\n` +
      `_${today} \- BCA_\n` +
      `_salary \- Monthly pay \- 5000_\n\n` +
      `💸 *Add expense:*\n` +
      `/expense\n` +
      `<date> \- <source>\n` +
      `<category> \- <description> \- <amount>\n` +
      `_Example:_\n` +
      `_/expense_\n` +
      `_${today} \- BCA_\n` +
      `_food \- Lunch \- 50_\n\n` +
      `📦 *Create fund source:*\n` +
      `/source <name> - <detail>\n` +
      `_Example: /source BCA - 531xxxxxx_\n\n` +
      `📊 *Check balance:*\n` +
      `/balance\n\n` +
      `📋 *View recent transactions:*\n` +
      `/history\n\n` +
      `❓ *Help:*\n` +
      `/help`,
    { parse_mode: "Markdown" },
  );
}
