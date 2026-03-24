import { NextResponse } from "next/server";
import { ocrFromBuffer } from "~/usecase/receipt/ocr-receipt";
import { parseReceiptText } from "~/usecase/receipt/parse-receipt-text";

export const POST = async (req: Request) => {
  const form = await req.formData();
  const file = form.get("image");
  const category = (form.get("category") as string | null) ?? "uncategorized";

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No image provided." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ocrText = await ocrFromBuffer(buffer);
  const parsed = parseReceiptText(ocrText, category);

  return NextResponse.json({ ocrText, parsed });
};
