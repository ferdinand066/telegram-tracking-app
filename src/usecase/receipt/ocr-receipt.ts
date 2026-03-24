import "server-only";
import { createWorker } from "tesseract.js";
import sharp from "sharp";
import { env } from "~/env.js";

// All characters that realistically appear on a receipt
const RECEIPT_CHAR_WHITELIST =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,/-:()%@#+='\"&*!?Rp$";

const preprocessImage = async (buffer: Buffer): Promise<Buffer> => {
  return sharp(buffer)
    .resize({ width: 1200, withoutEnlargement: true })
    .grayscale()
    .normalise()
    .sharpen()
    .toBuffer();
};

export const ocrFromBuffer = async (rawBuffer: Buffer): Promise<string> => {
  const processedBuffer = await preprocessImage(rawBuffer);
  const worker = await createWorker("eng", 1);

  try {
    await worker.setParameters({
      tessedit_char_whitelist: RECEIPT_CHAR_WHITELIST,
    });

    const {
      data: { text },
    } = await worker.recognize(processedBuffer);

    return text;
  } finally {
    await worker.terminate();
  }
};

export const ocrReceiptFromFileId = async (fileId: string): Promise<string> => {
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

  const imageRes = await fetch(fileUrl);
  if (!imageRes.ok) throw new Error("Failed to download image from Telegram");

  const rawBuffer = Buffer.from(await imageRes.arrayBuffer());
  return ocrFromBuffer(rawBuffer);
};
