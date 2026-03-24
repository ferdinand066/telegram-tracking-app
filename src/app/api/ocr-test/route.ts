import { NextResponse } from "next/server";
import { ocrFromBuffer } from "~/usecase/receipt/ocr-receipt";
import { parseReceiptWords } from "~/usecase/receipt/parse-receipt-words";
import { clusterWordsIntoLayoutRows } from "~/usecase/receipt/receipt-layout";

export const POST = async (req: Request) => {
  const form = await req.formData();
  const file = form.get("image");
  const category = (form.get("category") as string | null) ?? "uncategorized";

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No image provided." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ocrResult = await ocrFromBuffer(buffer);
  const parsed = parseReceiptWords(ocrResult, category);

  const layoutRows = clusterWordsIntoLayoutRows(
    ocrResult.lines.flatMap((l) => l.words),
  );

  return NextResponse.json({
    ocrText: ocrResult.text,
    parsed,
    ocrQuality: {
      meanWordConfidence: Math.round(ocrResult.meanWordConfidence * 10) / 10,
      pageConfidence: Math.round(ocrResult.pageConfidence * 10) / 10,
      psmUsed: ocrResult.psmUsed,
      tesseractLineCount: ocrResult.lines.length,
      layoutRowCount: layoutRows.length,
      imageWidth: ocrResult.imageWidth,
      imageHeight: ocrResult.imageHeight,
    },
  });
};
