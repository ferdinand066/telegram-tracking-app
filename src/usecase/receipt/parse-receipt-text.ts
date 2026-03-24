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
  /^sub\s*total/i, // "Sub Total", "Subtotal" (summary — not a product row)
  /^[A-Z]{1,3}\s+sub\s*total/i, // OCR prefix noise: "NO sutotal"
  /^harga\s+jual/i,
  /^total\b/i,
  /^total\s+qty\b/i,
  /^tunai/i,
  /^tunat\b/i,
  /^tuna\s*:/i,
  /^kembali/i,
  /^kembal\s+i\b/i, // "KEMBAL I" — OCR split of KEMBALI (change)
  /^kembalt\b/i,
  /^kembalian/i,
  /^cash/i,
  /^change/i,
  /^ppn/i,
  /^pen\s*:/i, // PPN (VAT) misread as PEN
  /^pen\s+[\d.,%]/i, // "PEN 13.362" when colon is missing
  /^sc[\s%]/i,
  /^pb\d/i,
  /^diskon/i,
  /^discount/i,
  /^layanan/i,
  /^[A-Z]{1,3}\s+service\s+charge/i, // OCR prefix noise: "NN Service Charge"
  /^service\s+charge/i,
  /^[A-Z]{1,3}\s+tax\b/i, // OCR prefix noise: "NA Tax"
  /^tax\b/i,
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
  /^tip[.\s(]/i, // "Tip." = Telp (telephone) OCR variant
  /^fax/i,
  /^fbi\b/i, // OCR misread of "PB1" (PB1 10% tax line)
  /^telp\b/i,
  /^hemat\s+produk/i, // total savings summary, not a per-line *HEMAT* row
  /^pembulatan/i,
  /^pembayaran/i,
  /^member\b/i,
  /^customer\s+name\b/i,
  /^notes\b/i,
  /^status\b/i,
  /^total\s+item/i,
  /^print\s+count\b/i,
  /^closed\s+at\b/i,
  /^cashier\b/i,
  /^black\s+owl\s+wallet\b/i,
  /^wallet\b/i,
  /^btkp\b/i,
  /^btke\b/i,
  /^bkp\b/i,
  /^pot\.?\s*btkp/i,
  /^pot\.?\s*bkp/i,
];

/**
 * Lines that look like store header, address, or cashier metadata — never line items.
 */
const HEADER_LINE_PATTERNS = [
  /^,\s*\S/, // e.g. ", BEKASI," fragments
  /\bRT[.\s]*\d{2,3}\s*\/\s*\d{2,3}\b/i, // RT.001/022
  /\bKAV\.?\s*NO\.?\s*\d/i,
  /\bINSPEKSI\b/i,
  /^JL[\.\s]\s*\S/i,
  /^\d{2}\.\d{2}\.\d{2}-\d{2}:\d{2}/, // 10.10.20-17:01
  /^\d+\.\d+\.\d+\s+\d+\/\S/, // 2.1.72 351426/MELLY
  /\/[A-Z]{2,}\/\d{2}\b/, // .../MELLY/01
  /\blt\s*\d+\s*$/i, // "Lt 5" = Lantai (floor) indicator at end of address line
  /\blantai\s*\d+\s*$/i,
];

/** Max amount (IDR) for a single product line; larger values are usually OCR phone/tax noise. */
const MAX_PLAUSIBLE_LINE_ITEM_AMOUNT = 50_000_000;

/**
 * Tail of Indomaret-style rows: qty, unit price, line total (optional "-" before line total).
 * Product description may contain numbers (e.g. FRUIT TEA STRAW 350), so we anchor from the end.
 */
const MULTI_COLUMN_ITEM_TAIL =
  /\s+(\d{1,4})\s+([\d.,%]+)\s+(?:-\s*)?([\d.,%]+)\s*$/;

/**
 * Tesseract often misreads receipt digits (thermal print, small font). These fixes run
 * per line before parsing so qty / harga / total columns can match again.
 */
const normalizeOcrReceiptLine = (line: string): string => {
  let s = line;
  // Hyphen read instead of dot: "6-490" → "6.490" (IDR grouping)
  s = s.replace(/\b(\d)-(\d{3})(?!\d)/g, "$1.$2");
  // "24" read as "za" before a 3-digit group: "za.190" → "24.190"
  s = s.replace(/\bza\.(\d{3})\b/gi, "24.$1");
  // "2.490" read as "2.as0" (a/s confused with 4/9)
  s = s.replace(/\b(\d)\.as0\b/gi, "$1.490");
  // Narrow "1" in QTY column read as "ES" before unit + line total at end of row
  s = s.replace(/\s+ES\s+(?=[\d.,%]+\s+[\d.,%]+\s*$)/i, " 1 ");
  return s;
};

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
 * Lines that indicate the pre-tax/pre-service-charge subtotal.
 */
const SUBTOTAL_LINE_PATTERNS = [/^subtotal/i, /^sub\s+total/i];

/**
 * Tax and service-charge lines whose amounts can be summed to derive the
 * grand total when the TOTAL line is absent from the OCR output.
 */
const TAX_CHARGE_LINE_PATTERNS = [
  /^sc[\s%]/i, // service charge
  /^pb\d/i, // PB1 10% etc.
  /^ppn/i, // PPN (VAT)
  /^pen\s*:/i, // PPN misread as PEN
  /^pen\s+[\d.,%]/i,
  /^fbi\b/i, // OCR misread of "PB1"
];

/**
 * Parses Indonesian receipt amount strings.
 * Handles formats like: 3,500 → 3500, 10.500 → 10500, 263,340 → 263340
 * Optional leading minus (discount lines); % is treated as 0 for OCR noise (e.g. 23.s%0).
 */
const parseReceiptAmount = (s: string): number => {
  let work = s.trim().replace(/%/g, "0");
  const neg = work.startsWith("-");
  if (neg) work = work.slice(1).trim();

  const normalized = work.replace(/\s+/g, "");

  // Pure grouped thousand separators (IDR style), e.g. 5.700.000 or 5,700,000.
  if (/^\d{1,3}(?:[.,]\d{3})+$/.test(normalized)) {
    const n = Number(normalized.replace(/[.,]/g, ""));
    if (isNaN(n)) return NaN;
    return neg ? -n : n;
  }

  // Decimal style values (rare in receipts), e.g. 12,5 or 12.50.
  if (/^\d+[.,]\d{1,2}$/.test(normalized)) {
    const n = Number(normalized.replace(",", "."));
    if (isNaN(n)) return NaN;
    return neg ? -n : n;
  }

  const cleaned = normalized
    .replace(/(\d)\.(\d{3})(?!\d)/g, "$1$2")
    .replace(/(\d),(\d{3})(?!\d)/g, "$1$2");
  const n = Number(cleaned);
  if (isNaN(n)) return NaN;
  return neg ? -n : n;
};

/**
 * Super Indo (and similar) print a *HEMAT* row after a product; the amount is a discount
 * on the previous line's gross total. OCR may drop the minus sign — always subtract the magnitude.
 */
const tryParseHematLineDiscount = (line: string): number | null => {
  const trimmed = line.trim();
  if (!/\bHEMAT\b/i.test(trimmed)) return null;
  if (/hemat\s+produk/i.test(trimmed)) return null;

  const tailMatch = /(-?\s*)([\d.,%]+)\s*$/.exec(trimmed);
  if (!tailMatch) return null;

  const sign = tailMatch[1]?.includes("-") ? "-" : "";
  const parsed = parseReceiptAmount(`${sign}${tailMatch[2]}`);
  if (isNaN(parsed) || parsed === 0) return null;

  return Math.abs(parsed);
};

const extractTrailingAmount = (line: string): number | null => {
  const match = /([\d.,%]+)\s*$/.exec(line);
  if (!match) return null;
  const amount = parseReceiptAmount(match[1]!);
  return isNaN(amount) || amount <= 0 ? null : amount;
};

const hasLetters = (s: string): boolean => /[a-zA-Z]/.test(s);

const isLikelyHeaderLine = (line: string): boolean =>
  HEADER_LINE_PATTERNS.some((re) => re.test(line));

/**
 * Branch/store lines (e.g. GOLDEN SQUARE-BEKASI) often pick up phone digits as a fake "price".
 */
const looksLikeAllCapsBranchLine = (line: string): boolean => {
  const textPart = line.replace(/\s+[\d.,\s-]+$/u, "").trim();
  if (textPart.length < 8 || textPart.length > 80) return false;
  const alpha = textPart.match(/[a-zA-Z]/g);
  if (!alpha || alpha.length < 6) return false;
  const upper = textPart.match(/[A-Z]/g) ?? [];
  if (upper.length / alpha.length < 0.88) return false;
  return /\b[A-Z]+-[A-Z0-9]{2,}\b/.test(textPart);
};

/**
 * Parses convenience-store style rows: product name, qty, unit price, line total.
 * Quantity and unit price are not part of the returned description.
 */
const tryParseMultiColumnItemLine = (
  line: string,
): { description: string; amount: number } | null => {
  const m = MULTI_COLUMN_ITEM_TAIL.exec(line);
  if (!m) return null;

  const descPart = line.slice(0, m.index).trim();
  const qty = parseInt(m[1]!, 10);
  const unit = parseReceiptAmount(m[2]!);
  const total = parseReceiptAmount(m[3]!);

  if (!descPart || !hasLetters(descPart)) return null;
  if (qty < 1 || qty > 999) return null;
  if (unit <= 0 || total <= 0) return null;
  if (
    total > MAX_PLAUSIBLE_LINE_ITEM_AMOUNT ||
    unit > MAX_PLAUSIBLE_LINE_ITEM_AMOUNT
  )
    return null;

  return {
    description: descPart,
    amount: total,
  };
};

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
 * 2. Skip header/address/summary lines (including OCR variants like TUNAT / KEMBALT).
 * 3. Prefer convenience-store rows parsed as: description + qty + unit price + line total (qty/unit
 *    are not kept in the description; SKUs like "… 350" stay in the description).
 * 4. Otherwise use a single trailing amount as the line total (simple receipts).
 * 5. Rows containing *HEMAT* (after a product on Super Indo–style receipts) subtract from the
 *    previous line's amount (gross line total − hemat = net).
 * 6. Fall back to a single entry using the total if no items are found.
 */
export const parseReceiptText = (
  text: string,
  category: string,
): ParsedReceipt => {
  const lines = text
    .split("\n")
    .map((l) => normalizeOcrReceiptLine(l.trim()))
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

  // Find the pre-tax subtotal — used to compute the tax multiplier
  let subtotal: number | null = null;
  for (const line of lines) {
    if (SUBTOTAL_LINE_PATTERNS.some((re) => re.test(line))) {
      const amount = extractTrailingAmount(line);
      if (amount && amount > 0) {
        subtotal = amount;
        break;
      }
    }
  }

  // When the TOTAL line is not captured by OCR (e.g. image cut off at the bottom),
  // derive the grand total by summing subtotal + all visible tax/charge lines.
  if (total === null && subtotal !== null) {
    let taxSum = 0;
    for (const line of lines) {
      if (TAX_CHARGE_LINE_PATTERNS.some((re) => re.test(line))) {
        const amount = extractTrailingAmount(line);
        if (amount && amount > 0) taxSum += amount;
      }
    }
    if (taxSum > 0) total = subtotal + taxSum;
  }

  // Extract individual line items
  const items: TransactionEntry[] = [];
  for (const line of lines) {
    if (SKIP_LINE_PATTERNS.some((re) => re.test(line))) continue;
    if (isLikelyHeaderLine(line)) continue;

    const hematDiscount = tryParseHematLineDiscount(line);
    if (hematDiscount !== null) {
      const prev = items[items.length - 1];
      if (prev) {
        prev.amount = Math.max(0, Math.round(prev.amount - hematDiscount));
      }
      continue;
    }

    if (!hasLetters(line)) continue;

    const multi = tryParseMultiColumnItemLine(line);
    if (multi) {
      items.push({
        category,
        description: multi.description,
        amount: multi.amount,
      });
      continue;
    }

    const amount = extractTrailingAmount(line);
    if (!amount || amount > MAX_PLAUSIBLE_LINE_ITEM_AMOUNT) continue;

    if (looksLikeAllCapsBranchLine(line)) continue;

    // Extract description: everything before the trailing amount group
    const descMatch = /^(.+?)\s+([\d.,%]+)\s*$/.exec(line);
    if (!descMatch) continue;

    const description = stripLeadingQty(descMatch[1]!.trim());
    if (!hasLetters(description)) continue;

    items.push({ category, description, amount });
  }

  if (items.length > 0) {
    // When total differs from subtotal (taxes / service charges exist), scale
    // each item's amount proportionally so they sum to the grand total.
    if (subtotal && total && Math.abs(total - subtotal) > 0.01) {
      const multiplier = total / subtotal;
      for (const item of items) {
        item.amount = Math.round(item.amount * multiplier);
      }
    }

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
