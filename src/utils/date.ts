import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

export const HUMAN_READABLE_DATE_FORMATS = {
  STANDARD: "YYYY-MM-DD",
  DAY_MONTH: "D MMM",
  DAY_MONTH_YEAR: "D MMM YYYY",
} as const;

const READABLE_DATE_CONSTANT = {
  TODAY: "today",
  YESTERDAY: "yesterday",
} as const;

/**
 * Accepts human-readable date inputs and resolves them to YYYY-MM-DD.
 * Supported formats:
 *   - "today" / "yesterday"
 *   - "28 Feb"         → 28 Feb of the current year
 *   - "28 Feb 2025"    → 28 Feb 2025
 *   - "2026-03-23"     → ISO date passthrough
 *
 * Returns null if the input cannot be parsed or is not a valid calendar date.
 */
export const parseHumanReadableDate = (input: string): string | null => {
  const normalized = input.trim().toLowerCase();

  if (normalized === READABLE_DATE_CONSTANT.TODAY)
    return dayjs().format(HUMAN_READABLE_DATE_FORMATS.STANDARD);

  if (normalized === READABLE_DATE_CONSTANT.YESTERDAY)
    return dayjs()
      .subtract(1, "day")
      .format(HUMAN_READABLE_DATE_FORMATS.STANDARD);

  const dayMonthOnly = dayjs(
    input,
    HUMAN_READABLE_DATE_FORMATS.DAY_MONTH,
    true,
  );
  if (dayMonthOnly.isValid()) {
    return dayMonthOnly
      .year(dayjs().year())
      .format(HUMAN_READABLE_DATE_FORMATS.STANDARD);
  }

  const dayMonthYear = dayjs(
    input,
    HUMAN_READABLE_DATE_FORMATS.DAY_MONTH_YEAR,
    true,
  );
  if (dayMonthYear.isValid())
    return dayMonthYear.format(HUMAN_READABLE_DATE_FORMATS.STANDARD);

  const iso = dayjs(input, HUMAN_READABLE_DATE_FORMATS.STANDARD, true);
  if (iso.isValid()) return iso.format(HUMAN_READABLE_DATE_FORMATS.STANDARD);

  return null;
};
