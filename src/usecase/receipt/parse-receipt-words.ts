import type { OcrResult } from "./ocr-receipt-core";
import type { ParsedReceipt } from "./parse-receipt-text";
import { parseReceiptDocument } from "./parse-receipt-pipeline";

/**
 * OCR + layout → structured receipt. Delegates to the generic {@link parseReceiptDocument} pipeline.
 */
export const parseReceiptWords = (
  ocrResult: OcrResult,
  category: string,
): ParsedReceipt => parseReceiptDocument(ocrResult, category);

export { parseReceiptDocument } from "./parse-receipt-pipeline";
