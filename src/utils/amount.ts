const SUFFIX_MULTIPLIERS: Record<string, number> = {
  k: 1_000,
  jt: 1_000_000,
};

const ptBrAmountFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatAmount(amount: number): string {
  return ptBrAmountFormatter.format(amount);
}

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
