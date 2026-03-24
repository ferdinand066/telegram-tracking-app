import type { OcrResult, OcrWord } from "./ocr-receipt-core";
import { extractLineItemFromWords } from "./receipt-item-extractor";
import { classifyReceiptLineRole } from "./receipt-line-role";
import type { ParsedReceipt } from "./parse-receipt-text";
import type { ReceiptLineRole } from "./receipt-pipeline.types";
import {
  MAX_PLAUSIBLE_LINE_ITEM_AMOUNT,
  TAX_CHARGE_LINE_PATTERNS,
  extractGrandTotalFromSummaryLine,
  extractTrailingAmount,
  hasLetters,
  looksLikeAllCapsBranchLine,
  normalizeOcrReceiptLine,
  parseStoreLineItemFromText,
  pickMerchantNameFromReceiptLines,
  pickVoucherDiscountFromLine,
  stripLeadingQty,
  tryParseHematLineDiscount,
} from "./parse-receipt-text";
import { clusterWordsIntoLayoutRows } from "./receipt-layout";
import type { TransactionEntry } from "~/usecase/add-transaction.usecase";
import { formatCategoryTitleCase } from "~/utils/category";

type ClassifiedRow = {
  text: string;
  words: OcrWord[];
  role: ReceiptLineRole;
};

const buildClassifiedRows = (ocr: OcrResult): ClassifiedRow[] => {
  const allWords = ocr.lines.flatMap((l) => l.words);
  const layout = clusterWordsIntoLayoutRows(allWords);

  return layout
    .map((row) => {
      const text = normalizeOcrReceiptLine(row.text.trim());
      return {
        text,
        words: row.words,
        role: classifyReceiptLineRole(text),
      };
    })
    .filter((r) => r.text.length > 0);
};

const extractGrandTotal = (rows: ClassifiedRow[]): number | null => {
  for (const row of rows) {
    if (row.role !== "grand_total") continue;
    const amount = extractGrandTotalFromSummaryLine(row.text);
    if (amount && amount > 0) return amount;
  }
  return null;
};

/**
 * Basket anchor used **only** for restaurant-style tax scaling (subtotal + SC/PPN → grand total).
 * We intentionally **do not** use “HARGA JUAL” here: on minimarket receipts it is often a different
 * base (e.g. pre/post voucher or tax-inclusive shelf total) and would wrongly rescale correct line OCR.
 */
const extractSubtotalAnchorForTaxScaling = (
  rows: ClassifiedRow[],
): number | null => {
  for (const row of rows) {
    if (row.role !== "subtotal") continue;
    const amount = extractTrailingAmount(row.text);
    if (amount && amount > 0) return amount;
  }
  return null;
};

const deriveTotalFromTax = (
  rows: ClassifiedRow[],
  total: number | null,
  subtotal: number | null,
): number | null => {
  if (total !== null) return total;
  if (subtotal === null) return null;

  let taxSum = 0;
  for (const row of rows) {
    if (!TAX_CHARGE_LINE_PATTERNS.some((re) => re.test(row.text))) continue;
    const amount = extractTrailingAmount(row.text);
    if (amount && amount > 0) taxSum += amount;
  }
  return taxSum > 0 ? subtotal + taxSum : null;
};

/**
 * Never **inflate** parsed line amounts to hit grand total — that destroys per-line OCR truth
 * (e.g. missing row / voucher timing makes sum &lt; total and produced bogus ~12% uplift).
 * Only allow tiny **downward** nudge for rounding when sum slightly exceeds printed total.
 */
const reconcileEntriesToGrandTotal = (
  entries: TransactionEntry[],
  total: number | null,
): void => {
  if (!total || entries.length === 0) return;

  const sum = entries.reduce((s, e) => s + e.amount, 0);
  if (sum <= 0) return;

  if (sum <= total) return;

  const diff = sum - total;
  const absoluteTol = Math.max(200, total * 0.008);
  if (diff > absoluteTol) return;

  const k = total / sum;
  if (k < 0.97 || k > 1) return;

  for (const e of entries) {
    e.amount = Math.round(e.amount * k);
  }
};

/**
 * Generic receipt → ledger entries.
 *
 * **Stages** (fintech-style, format-agnostic):
 * 1. **Layout** — cluster OCR words into physical rows (baseline bands).
 * 2. **Semantics** — assign each row a `ReceiptLineRole` from label families + light structure.
 * 3. **Anchors** — read grand total, basket subtotal / selling total, optional tax composition.
 * 4. **Line items** — regex tail (qty·unit·total) → geometry (gap split) → right-column fallback.
 * 5. **Adjustments** — per-line voucher / HEMAT against previous gross.
 * 6. **Reconciliation** — optional tiny downward rounding only; never scale lines up to total.
 */
export const parseReceiptDocument = (
  ocrResult: OcrResult,
  category: string,
): ParsedReceipt => {
  const categoryForEntries = formatCategoryTitleCase(category);
  const rows = buildClassifiedRows(ocrResult);
  const imageWidth = ocrResult.imageWidth > 0 ? ocrResult.imageWidth : 800;

  const merchantName = pickMerchantNameFromReceiptLines(
    rows.map((r) => r.text),
  );

  const rawTotal = extractGrandTotal(rows);
  const subtotalAnchor = extractSubtotalAnchorForTaxScaling(rows);
  const total = deriveTotalFromTax(rows, rawTotal, subtotalAnchor);

  const items: TransactionEntry[] = [];

  for (const row of rows) {
    switch (row.role) {
      case "separator":
      case "footer":
      case "metadata":
      case "tax_fee":
      case "payment":
      case "change":
      case "aggregate_savings":
      case "grand_total":
      case "subtotal":
      case "selling_total":
        continue;

      case "per_item_discount": {
        const hemat = tryParseHematLineDiscount(row.text);
        if (hemat !== null) {
          const prev = items[items.length - 1];
          if (prev) {
            prev.amount = Math.max(0, Math.round(prev.amount - hemat));
          }
          break;
        }
        const voucher = pickVoucherDiscountFromLine(
          row.text,
          items[items.length - 1]?.amount ?? null,
        );
        if (voucher !== null) {
          const prev = items[items.length - 1];
          if (prev) {
            prev.amount = Math.max(0, Math.round(prev.amount - voucher));
          }
        }
        break;
      }

      case "item_or_unknown": {
        if (!hasLetters(row.text)) break;
        if (looksLikeAllCapsBranchLine(row.text)) break;

        const fromRegex = parseStoreLineItemFromText(row.text);
        if (fromRegex) {
          items.push({
            category: categoryForEntries,
            description: stripLeadingQty(fromRegex.description),
            amount: fromRegex.amount,
          });
          break;
        }

        const fromLayout = extractLineItemFromWords(row.words, imageWidth);
        if (fromLayout) {
          items.push({
            category: categoryForEntries,
            description: stripLeadingQty(fromLayout.description),
            amount: fromLayout.amount,
          });
          break;
        }

        const amount = extractTrailingAmount(row.text);
        if (!amount || amount > MAX_PLAUSIBLE_LINE_ITEM_AMOUNT) break;

        const descMatch = /^(.+?)\s+([\d.,%]+)\s*$/.exec(row.text);
        if (!descMatch) break;

        const description = stripLeadingQty(descMatch[1]!.trim());
        if (!hasLetters(description)) break;

        items.push({ category: categoryForEntries, description, amount });
        break;
      }

      default:
        break;
    }
  }

  if (items.length > 0) {
    // Tax scaling only when an explicit SUBTOTAL anchor matches line-sum (restaurant / F&B).
    if (subtotalAnchor && total && Math.abs(total - subtotalAnchor) > 0.01) {
      const sumItems = items.reduce((s, i) => s + i.amount, 0);
      if (
        sumItems > 0 &&
        Math.abs(sumItems - subtotalAnchor) / subtotalAnchor < 0.12
      ) {
        const multiplier = total / subtotalAnchor;
        if (multiplier >= 0.9 && multiplier <= 1.2) {
          for (const item of items) {
            item.amount = Math.round(item.amount * multiplier);
          }
        }
      }
    }

    reconcileEntriesToGrandTotal(items, total);

    return { merchantName, entries: items, total };
  }

  const entries: TransactionEntry[] = total
    ? [
        {
          category: categoryForEntries,
          description: merchantName,
          amount: total,
        },
      ]
    : [];

  return { merchantName, entries, total };
};
