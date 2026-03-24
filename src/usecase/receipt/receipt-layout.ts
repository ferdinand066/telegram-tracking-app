import type { OcrWord } from "./ocr-receipt-core";

export type LayoutRow = {
  words: OcrWord[];
  /** Sorted left → right */
  text: string;
  yMid: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
};

const wordYCenter = (w: OcrWord): number => (w.bbox.y0 + w.bbox.y1) / 2;

const wordHeight = (w: OcrWord): number => Math.max(4, w.bbox.y1 - w.bbox.y0);

/**
 * Estimates vertical tolerance for grouping words on the same printed row
 * (Tesseract sometimes splits one physical row into two lines).
 */
const estimateRowMergeTolerance = (words: OcrWord[]): number => {
  if (words.length === 0) return 14;
  const heights = words.map(wordHeight).sort((a, b) => a - b);
  const med = heights[Math.floor(heights.length / 2)] ?? 14;
  return Math.max(10, Math.min(28, med * 0.65));
};

/**
 * Flattens all OCR words and regroups them by vertical overlap (baseline band).
 * More stable than trusting Tesseract line breaks alone on skewed phone photos.
 */
export const clusterWordsIntoLayoutRows = (words: OcrWord[]): LayoutRow[] => {
  if (words.length === 0) return [];

  const tolerance = estimateRowMergeTolerance(words);
  const sorted = [...words].sort((a, b) => a.bbox.y0 - b.bbox.y0);

  const buckets: OcrWord[][] = [];
  for (const w of sorted) {
    const yc = wordYCenter(w);
    let placed = false;
    for (const bucket of buckets) {
      const ref =
        bucket.reduce((s, x) => s + wordYCenter(x), 0) / bucket.length;
      if (Math.abs(yc - ref) <= tolerance) {
        bucket.push(w);
        placed = true;
        break;
      }
    }
    if (!placed) buckets.push([w]);
  }

  const rows: LayoutRow[] = buckets.map((bucket) => {
    const byX = [...bucket].sort((a, b) => a.bbox.x0 - b.bbox.x0);
    const xs = byX.map((w) => w.bbox.x0);
    const xe = byX.map((w) => w.bbox.x1);
    const ys = byX.map((w) => w.bbox.y0);
    const ye = byX.map((w) => w.bbox.y1);
    return {
      words: byX,
      text: byX
        .map((w) => w.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
      yMid: (Math.min(...ys) + Math.max(...ye)) / 2,
      bbox: {
        x0: Math.min(...xs),
        y0: Math.min(...ys),
        x1: Math.max(...xe),
        y1: Math.max(...ye),
      },
    };
  });

  rows.sort((a, b) => a.yMid - b.yMid);
  return rows;
};
