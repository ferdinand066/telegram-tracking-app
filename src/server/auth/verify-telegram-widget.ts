import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/**
 * @see https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramWidgetAuth(
  data: Record<string, string>,
  botToken: string,
): boolean {
  const hash = data.hash;
  if (!hash) return false;

  const checkString = Object.keys(data)
    .filter((key) => key !== "hash")
    .sort()
    .map((key) => `${key}=${data[key]}`)
    .join("\n");

  const secretKey = createHash("sha256").update(botToken).digest();
  const computed = createHmac("sha256", secretKey)
    .update(checkString)
    .digest("hex");

  try {
    const a = Buffer.from(computed, "hex");
    const b = Buffer.from(hash, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

const MAX_AUTH_AGE_SEC = 86400;

export function isTelegramAuthDateValid(authDateSeconds: number): boolean {
  if (!Number.isFinite(authDateSeconds)) return false;
  const now = Math.floor(Date.now() / 1000);
  return now - authDateSeconds <= MAX_AUTH_AGE_SEC;
}
