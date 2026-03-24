import { createWorker, PSM } from "tesseract.js";
import sharp from "sharp";

const RECEIPT_CHAR_WHITELIST =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,/-:()%@#+='\"&*!?Rp$";

/** Minimum width (px) after upscale — thermal receipt text is often too small on phone photos. */
const OCR_TARGET_MIN_WIDTH = 1600;
const OCR_MAX_DIMENSION = 2600;

export type OcrWord = {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
};

export type OcrLine = {
  text: string;
  words: OcrWord[];
  bbox: { x0: number; y0: number; x1: number; y1: number };
};

export type OcrResult = {
  /** Full page text, joined from all lines. Useful for debugging. */
  text: string;
  lines: OcrLine[];
  imageWidth: number;
  imageHeight: number;
  /** Tesseract page-level confidence (0–100). Often differs from mean word score. */
  pageConfidence: number;
  /** Mean confidence of all words (0–100), or 0 if empty. */
  meanWordConfidence: number;
  /** Which page segmentation mode produced this result (for debugging). */
  psmUsed: string;
};

const preprocessImage = async (rawBuffer: Buffer): Promise<Buffer> => {
  let pipeline = sharp(rawBuffer).rotate();

  const meta = await pipeline.metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;

  if (w > 0 && w < OCR_TARGET_MIN_WIDTH) {
    pipeline = pipeline.resize({
      width: OCR_TARGET_MIN_WIDTH,
      height: Math.round((h / w) * OCR_TARGET_MIN_WIDTH),
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    });
  } else if (w > OCR_MAX_DIMENSION) {
    pipeline = pipeline.resize({
      width: OCR_MAX_DIMENSION,
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    });
  }

  return pipeline
    .grayscale()
    .normalize()
    .gamma(1.05)
    .sharpen({ sigma: 0.55, m1: 0.45, m2: 1.2 })
    .png()
    .toBuffer();
};

const collectLinesFromPage = (data: {
  blocks: Array<{
    paragraphs: Array<{
      lines: Array<{
        text: string;
        bbox: { x0: number; y0: number; x1: number; y1: number };
        words: Array<{
          text: string;
          confidence: number;
          bbox: { x0: number; y0: number; x1: number; y1: number };
        }>;
      }>;
    }>;
  }> | null;
}): OcrLine[] => {
  const lines: OcrLine[] = [];
  for (const block of data.blocks ?? []) {
    for (const para of block.paragraphs) {
      for (const line of para.lines) {
        const trimmed = line.text.trim();
        if (!trimmed) continue;
        lines.push({
          text: trimmed,
          bbox: line.bbox,
          words: line.words.map((w) => ({
            text: w.text,
            confidence: w.confidence ?? 0,
            bbox: w.bbox,
          })),
        });
      }
    }
  }
  return lines;
};

const averageWordConfidence = (lines: OcrLine[]): number => {
  let sum = 0;
  let n = 0;
  for (const line of lines) {
    for (const w of line.words) {
      sum += w.confidence;
      n += 1;
    }
  }
  return n > 0 ? sum / n : 0;
};

/** Blend page + word scores so we pick a mode that is strong on both layout and glyphs. */
const ocrQualityScore = (pageConf: number, lines: OcrLine[]): number => {
  const mw = averageWordConfidence(lines);
  const words = lines.reduce((n, l) => n + l.words.length, 0);
  const wordCountBonus = Math.min(8, words / 80);
  return pageConf * 0.35 + mw * 0.55 + wordCountBonus;
};

export const ocrFromBuffer = async (rawBuffer: Buffer): Promise<OcrResult> => {
  const processedBuffer = await preprocessImage(rawBuffer);

  const { width: imageWidth = 0, height: imageHeight = 0 } =
    await sharp(processedBuffer).metadata();

  const worker = await createWorker("eng", 1);

  const baseParams = {
    tessedit_char_whitelist: RECEIPT_CHAR_WHITELIST,
    preserve_interword_spaces: "1",
    user_defined_dpi: "360",
  };

  try {
    const run = async (psm: PSM, label: string) => {
      await worker.setParameters({
        ...baseParams,
        tessedit_pageseg_mode: psm,
      });
      const { data } = await worker.recognize(
        processedBuffer,
        {},
        { blocks: true, text: true },
      );
      const lines = collectLinesFromPage(data);
      const pageConf = data.confidence ?? 0;
      return {
        data,
        lines,
        pageConf,
        label,
        score: ocrQualityScore(pageConf, lines),
      };
    };

    const auto = await run(PSM.AUTO, "AUTO");
    const single = await run(PSM.SINGLE_BLOCK, "SINGLE_BLOCK");

    const best = auto.score >= single.score ? auto : single;

    return {
      text: best.data.text,
      lines: best.lines,
      imageWidth,
      imageHeight,
      pageConfidence: best.pageConf,
      meanWordConfidence: averageWordConfidence(best.lines),
      psmUsed: best.label,
    };
  } finally {
    await worker.terminate();
  }
};
