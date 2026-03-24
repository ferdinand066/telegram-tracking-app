import dayjs from "dayjs";
import type { TransactionEntry } from "~/usecase/add-transaction.usecase";
import { formatAmount } from "~/utils/amount";
import { HUMAN_READABLE_DATE_FORMATS } from "~/utils/date";

export const formatTransactionReply = (
  dateStr: string,
  sourceName: string,
  entries: TransactionEntry[],
): string => {
  const parsedDate = dayjs(dateStr).format(
    HUMAN_READABLE_DATE_FORMATS.DAY_MONTH_YEAR,
  );
  const category = entries[0]?.category ?? "other";

  const lines = entries.map((e) =>
    e.description
      ? `${e.description} - ${formatAmount(e.amount)}`
      : formatAmount(e.amount),
  );

  return [`${parsedDate} - ${category} - ${sourceName}`, ...lines].join("\n");
};
