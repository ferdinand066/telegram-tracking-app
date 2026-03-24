export function parseUserId(rawUserId: string): number | null {
  const [, idPart] = rawUserId.split(":");
  const parsed = Number(idPart);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}
