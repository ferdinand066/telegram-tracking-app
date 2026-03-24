import type { ReceiptLineRole } from "./receipt-pipeline.types";
import { HEADER_LINE_PATTERNS } from "./parse-receipt-text";

/**
 * Classifies one receipt row using **label families** and light structure hints.
 * Order matters: more specific roles before generic `item_or_unknown`.
 */
export const classifyReceiptLineRole = (
  normalizedText: string,
): ReceiptLineRole => {
  const t = normalizedText.trim();
  if (t.length === 0) return "separator";

  if (/^[-=_.\s]{8,}$/.test(t)) return "separator";

  if (
    /thank|terima\s+kasih|^--\s|powered\s+by|complaints?\s+and\s+reports|closed\s+at|tablelink/i.test(
      t,
    )
  ) {
    return "footer";
  }

  if (
    /^(jl\.?|jln\.?|kec\.|kab\.|npwp|pt\s|table|pax|pos|rcpt#|tlp\.?|tel\.?|fax)/i.test(
      t,
    )
  ) {
    return "metadata";
  }
  if (HEADER_LINE_PATTERNS.some((re) => re.test(t))) return "metadata";
  if (/^name:/i.test(t)) return "metadata";
  if (/^invoice\b/i.test(t)) return "metadata";

  if (/^deskripsi\b|^description\b/i.test(t)) return "metadata";

  if (/^sub\s*total\b/i.test(t)) return "subtotal";

  if (
    /^ppn\b|^pen\s*:|^pen\s+[\d.,%]|^pb\d|^sc[\s%]|service\s*charge|^\s*tax\b|^pajak|^fbi\b|^diskon\b|^discount\b/i.test(
      t,
    )
  ) {
    return "tax_fee";
  }

  if (/hemat\s+produk|^anda\s+hemat/i.test(t)) return "aggregate_savings";

  if (/^total\s+item\b|^total\s+qty\b/i.test(t)) return "metadata";

  if (
    /^total\s+belanja\b|^total\s+beli\b|^grand\s+total\b|^jumlah\b/i.test(t)
  ) {
    return "grand_total";
  }

  if (/^total\b/i.test(t)) return "grand_total";

  if (/^harga\s+jual/i.test(t)) return "selling_total";

  if (/^tunai\b|^non\s+tunai|^pembayaran\b|^cash\b/i.test(t)) return "payment";

  if (
    /(wallet|gopay|ovo|dana|qris|linkaja|shopeepay|sakuku)(\s|:|$)/i.test(t) &&
    /\d/.test(t)
  ) {
    return "payment";
  }

  if (/^kembali|^change\b|^kembalian|^kembal/i.test(t)) return "change";

  if (/voucher/i.test(t)) return "per_item_discount";

  if (/\bhemat\b/i.test(t)) {
    if (/hemat\s+produk/i.test(t)) return "aggregate_savings";
    return "per_item_discount";
  }

  if (
    /^layanan|^member\b|^customer\s+name|^notes\b|^status\b|^print\s+count|^cashier\b|^btkp\b|^btke\b|^bkp\b|^pot\.?\s*btkp|^pot\.?\s*bkp/i.test(
      t,
    )
  ) {
    return "metadata";
  }

  return "item_or_unknown";
};
