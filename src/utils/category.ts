/** Normalizes a user- or OCR-supplied category to title case for storage and display. */
export function formatCategoryTitleCase(category: string): string {
  return category
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
