const SUFFIX_MULTIPLIERS: Record<string, number> = {
  k: 1_000,
  jt: 1_000_000,
};

export function parseAmount(raw: string): number {
  const normalized = raw.trim().toLowerCase();

  for (const [suffix, multiplier] of Object.entries(SUFFIX_MULTIPLIERS)) {
    if (normalized.endsWith(suffix)) {
      const numeric = normalized.slice(0, -suffix.length).replace(/\./g, "");
      return parseFloat(numeric) * multiplier;
    }
  }

  return parseFloat(normalized.replace(/\./g, ""));
}
