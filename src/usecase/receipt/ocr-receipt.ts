import "server-only";
import Tesseract from "tesseract.js";
import { env } from "~/env.js";

export const ocrReceiptFromFileId = async (fileId: string): Promise<string> => {
  const res = await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`,
  );

  if (!res.ok) throw new Error("Failed to retrieve file info from Telegram");

  const json = (await res.json()) as {
    ok: boolean;
    result: { file_path: string };
  };

  if (!json.ok) throw new Error("Failed to retrieve file from Telegram");

  const fileUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${json.result.file_path}`;

  const {
    data: { text },
  } = await Tesseract.recognize(fileUrl, "eng");

  return text;
};
