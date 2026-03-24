import "server-only";
import { env } from "~/env.js";
import { ocrFromBuffer } from "./ocr-receipt-core";

export type { OcrLine, OcrResult, OcrWord } from "./ocr-receipt-core";
export { ocrFromBuffer } from "./ocr-receipt-core";

export const ocrReceiptFromFileId = async (
  fileId: string,
): Promise<Awaited<ReturnType<typeof ocrFromBuffer>>> => {
  const fileInfoRes = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`,
  );

  if (!fileInfoRes.ok)
    throw new Error("Failed to retrieve file info from Telegram");

  const json = (await fileInfoRes.json()) as {
    ok: boolean;
    result: { file_path: string };
  };

  if (!json.ok) throw new Error("Failed to retrieve file from Telegram");

  const fileUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${json.result.file_path}`;
  console.log("File Url", fileUrl);

  const imageRes = await fetch(fileUrl);
  if (!imageRes.ok) throw new Error("Failed to download image from Telegram");

  const rawBuffer = Buffer.from(await imageRes.arrayBuffer());
  return ocrFromBuffer(rawBuffer);
};
