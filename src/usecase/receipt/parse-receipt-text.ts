import type { TransactionEntry } from "~/usecase/add-transaction.usecase";
import { formatAmount } from "~/utils/amount";
import dayjs from "dayjs";
import { HUMAN_READABLE_DATE_FORMATS } from "~/utils/date";

export type ParsedReceipt = {
  merchantName: string | null;
  entries: TransactionEntry[];
  total: number | null;
};

/**
 * Lines starting with these patterns are receipt metadata/summary — not items.
 */
const SKIP_LINE_PATTERNS = [
  /^subtotal/i,
  /^harga\s+jual/i,
  /^total/i,
  /^tunai/i,
  /^kembali/i,
  /^kembalian/i,
  /^cash/i,
  /^change/i,
  /^ppn/i,
  /^sc[\s%]/i,
  /^pb\d/i,
  /^diskon/i,
  /^discount/i,
  /^layanan/i,
  /^npwp/i,
  /^jl[.\s]/i,
  /^jln[.\s]/i,
  /^pt\s/i,
  /^name:/i,
  /^nama/i,
  /^table/i,
  /^pax:/i,
  /^pos[\s:]/i,
  /^rcpt/i,
  /^--/,
  /^thank/i,
  /^tlp[.\s]/i,
  /^tel[.\s]/i,
];

/**
 * Lines that indicate the grand total of the receipt.
 */
const TOTAL_LINE_PATTERNS = [
  /^total\b/i,
  /^grand\s+total/i,
  /^harga\s+jual/i,
  /^jumlah/i,
];

/**
 * Parses Indonesian receipt amount strings.
 * Handles formats like: 3,500 → 3500, 10.500 → 10500, 263,340 → 263340
 */
const parseReceiptAmount = (s: string): number => {
  const cleaned = s
    .replace(/(\d)\.(\d{3})(?!\d)/g, "$1$2") // dot thousand separator
    .replace(/(\d),(\d{3})(?!\d)/g, "$1$2"); // comma thousand separator
  return parseFloat(cleaned);
};

const extractTrailingAmount = (line: string): number | null => {
  const match = /([\d.,]+)\s*$/.exec(line);
  if (!match) return null;
  const amount = parseReceiptAmount(match[1]!);
  return isNaN(amount) || amount <= 0 ? null : amount;
};

const hasLetters = (s: string): boolean => /[a-zA-Z]/.test(s);

/**
 * Strips a leading quantity number from item descriptions.
 * e.g. "1 Standard Buffet" → "Standard Buffet"
 */
const stripLeadingQty = (desc: string): string =>
  desc.replace(/^\d+\s+/, "").trim();

/**
 * Parses OCR text from a receipt and extracts:
 * - merchant name (first meaningful text line)
 * - line items (description + amount)
 * - grand total
 *
 * Strategy:
 * 1. Extract TOTAL from lines matching known total keywords.
 * 2. Try to extract individual items (lines with letters + trailing amount that aren't metadata).
 * 3. Fall back to a single entry using the total if no items are found.
 */
export const parseReceiptText = (
  text: string,
  category: string,
): ParsedReceipt => {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const merchantName =
    lines.find(
      (l) =>
        hasLetters(l) &&
        l.length > 3 &&
        !/^\d{2}[./\-]/.test(l) && // skip date-like lines
        !/^\d+$/.test(l), // skip pure number lines
    ) ?? null;

  // Find the grand total — take the first matching TOTAL line
  let total: number | null = null;
  for (const line of lines) {
    if (TOTAL_LINE_PATTERNS.some((re) => re.test(line))) {
      const amount = extractTrailingAmount(line);
      if (amount && amount > 0) {
        total = amount;
        break;
      }
    }
  }

  // Extract individual line items
  const items: TransactionEntry[] = [];
  for (const line of lines) {
    if (SKIP_LINE_PATTERNS.some((re) => re.test(line))) continue;
    if (!hasLetters(line)) continue;

    const amount = extractTrailingAmount(line);
    if (!amount) continue;

    // Extract description: everything before the trailing amount group
    const descMatch = /^(.+?)\s+([\d.,]+)\s*$/.exec(line);
    if (!descMatch) continue;

    const description = stripLeadingQty(descMatch[1]!.trim());
    if (!hasLetters(description)) continue;

    items.push({ category, description, amount });
  }

  if (items.length > 0) {
    return { merchantName, entries: items, total };
  }

  // Fallback: single entry for the total amount
  const entries: TransactionEntry[] = total
    ? [{ category, description: merchantName, amount: total }]
    : [];

  return { merchantName, entries, total };
};

/**
 * Formats a parsed receipt into a human-readable confirmation message.
 */
export const formatReceiptConfirmation = (
  dateStr: string,
  sourceName: string,
  category: string,
  parsed: ParsedReceipt,
): string => {
  const date = dayjs(dateStr).format(
    HUMAN_READABLE_DATE_FORMATS.DAY_MONTH_YEAR,
  );

  const lines: string[] = [
    "Receipt Parsed:",
    `Date: ${date}`,
    `Source: ${sourceName}`,
    `Category: ${category}`,
  ];

  if (parsed.merchantName) {
    lines.push(`Merchant: ${parsed.merchantName}`);
  }

  lines.push("");

  if (parsed.entries.length > 0) {
    lines.push("Items:");
    for (const entry of parsed.entries) {
      const label = entry.description ?? "Item";
      lines.push(`- ${label}: ${formatAmount(entry.amount)}`);
    }
  }

  if (parsed.total !== null) {
    lines.push("");
    lines.push(`Total: ${formatAmount(parsed.total)}`);
  }

  return lines.join("\n");
};
