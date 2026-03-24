import type { OcrWord } from "./ocr-receipt-core";

/**
 * Semantic roles for a single layout row after OCR + clustering.
 * Used to route rows without branching on merchant or template IDs.
 */
export type ReceiptLineRole =
  | "separator" // dashed rules, blank noise
  | "footer" // thank-you, branding, support — never monetary line items
  | "metadata" // address, table, POS, NPWP, headers without basket lines
  | "subtotal" // pre-tax / pre-charge basket subtotal
  | "selling_total" // “HARGA JUAL” style selling subtotal (IDR retail)
  | "tax_fee" // PPN, PB1, SC, service charge, generic tax lines
  | "grand_total" // final amount owed
  | "payment" // tender: cash, wallet, card rails, “NON TUNAI”
  | "change" // kembalian / change
  | "aggregate_savings" // “hemat produk”, “anda hemat” — not per-SKU
  | "per_item_discount" // voucher row, per-line HEMAT — applies to previous item
  | "item_or_unknown"; // candidate product row — needs geometry + amount rules

export type LayoutTextRow = {
  text: string;
  words: OcrWord[];
};
