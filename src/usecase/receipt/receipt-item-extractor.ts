import type { OcrWord } from "./ocr-receipt-core";
import {
  MAX_PLAUSIBLE_LINE_ITEM_AMOUNT,
  hasLetters,
  normalizeOcrReceiptLine,
  parseReceiptAmount,
} from "./parse-receipt-text";

const isNumericToken = (text: string): boolean => {
  const stripped = text.trim().replace(/^\(+/, "").replace(/\)+$/, "");
  const cleaned = stripped
    .replace(/[.,\s]/g, "")
    .replace(/^-/, "")
    .replace(/%$/, "");
  return /^\d+$/.test(cleaned) && cleaned.length > 0;
};

type ColumnSplit = {
  descWords: OcrWord[];
  numColumns: OcrWord[];
};

const detectColumnSplit = (
  words: OcrWord[],
  imageWidth: number,
): ColumnSplit => {
  if (words.length < 2) return { descWords: words, numColumns: [] };

  const sorted = [...words].sort((a, b) => a.bbox.x0 - b.bbox.x0);
  const lineSpan = sorted[sorted.length - 1]!.bbox.x1 - sorted[0]!.bbox.x0;
  const minGap = Math.max(12, imageWidth * 0.012, lineSpan * 0.055);

  let columnStartIdx = -1;
  for (let i = sorted.length - 1; i > 0; i--) {
    const gap = sorted[i]!.bbox.x0 - sorted[i - 1]!.bbox.x1;
    if (gap >= minGap && sorted.slice(i).every((w) => isNumericToken(w.text))) {
      columnStartIdx = i;
      break;
    }
  }

  if (columnStartIdx <= 0) return { descWords: sorted, numColumns: [] };

  const descWords = sorted.slice(0, columnStartIdx);
  if (!descWords.some((w) => hasLetters(w.text))) {
    return { descWords: sorted, numColumns: [] };
  }

  return { descWords, numColumns: sorted.slice(columnStartIdx) };
};

/**
 * Rightmost numeric word in the trailing ~42% of page width — generic “price column” fallback
 * when gap-based split fails (e.g. creased thermal paper).
 */
const rightZoneLineTotal = (
  words: OcrWord[],
  imageWidth: number,
): { description: string; amount: number } | null => {
  if (words.length < 2 || imageWidth <= 0) return null;

  const sorted = [...words].sort((a, b) => a.bbox.x0 - b.bbox.x0);
  const cut = imageWidth * 0.58;
  const numericInZone = sorted.filter(
    (w) => isNumericToken(w.text) && w.bbox.x0 >= cut,
  );
  if (numericInZone.length === 0) return null;

  const rightWord = numericInZone[numericInZone.length - 1]!;
  const amount = parseReceiptAmount(
    normalizeOcrReceiptLine(rightWord.text.replace(/^\(+|\)+$/g, "")),
  );
  if (isNaN(amount) || amount <= 0 || amount > MAX_PLAUSIBLE_LINE_ITEM_AMOUNT) {
    return null;
  }

  const descWords = sorted.filter((w) => w.bbox.x1 < rightWord.bbox.x0 - 2);
  const description = descWords
    .map((w) => w.text)
    .join(" ")
    .trim();
  if (!hasLetters(description)) return null;

  return { description, amount };
};

/**
 * Geometry-first line item: gap-separated numeric tail, else right-column fallback.
 */
export const extractLineItemFromWords = (
  words: OcrWord[],
  imageWidth: number,
): { description: string; amount: number } | null => {
  const { descWords, numColumns } = detectColumnSplit(words, imageWidth);

  if (numColumns.length > 0 && descWords.some((w) => hasLetters(w.text))) {
    const description = descWords
      .map((w) => w.text)
      .join(" ")
      .trim();
    const totalStr = normalizeOcrReceiptLine(
      numColumns[numColumns.length - 1]!.text.replace(/^\(+|\)+$/g, ""),
    );
    const total = parseReceiptAmount(totalStr);
    if (!isNaN(total) && total > 0 && total <= MAX_PLAUSIBLE_LINE_ITEM_AMOUNT) {
      return { description, amount: total };
    }
  }

  return rightZoneLineTotal(words, imageWidth);
};
