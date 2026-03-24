"use client";

import { useRef, useState } from "react";
import type { ParsedReceipt } from "~/usecase/receipt/parse-receipt-text";
import { formatAmount } from "~/utils/amount";

type OcrResult = {
  ocrText: string;
  parsed: ParsedReceipt;
};

const OcrTestPage = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [category, setCategory] = useState("groceries");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (fileInputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInputRef.current.files = dt.files;
    }
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Please select an image first.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    const form = new FormData();
    form.append("image", file);
    form.append("category", category);

    try {
      const res = await fetch("/api/ocr-test", { method: "POST", body: form });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Unknown server error.");
      }
      const data = (await res.json()) as OcrResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">OCR Receipt Tester</h1>
          <p className="mt-1 text-sm text-gray-400">
            Upload a receipt image to inspect raw OCR output and parsed items
            before deploying.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Drop zone */}
          <label
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-700 bg-gray-900 px-6 py-10 transition hover:border-indigo-500 hover:bg-gray-800/60"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Receipt preview"
                className="max-h-72 rounded-lg object-contain"
              />
            ) : (
              <>
                <svg
                  className="h-10 w-10 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16v-8m0 0-3 3m3-3 3 3M4.5 19.5h15a.75.75 0 0 0 .75-.75V7.875a.75.75 0 0 0-.75-.75H15a.75.75 0 0 1-.53-.22L12.22 4.66a.75.75 0 0 0-.53-.22H4.5a.75.75 0 0 0-.75.75v14.25c0 .414.336.75.75.75Z"
                  />
                </svg>
                <span className="text-sm text-gray-400">
                  Drag & drop a receipt image or{" "}
                  <span className="text-indigo-400 underline">browse</span>
                </span>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {/* Category */}
          <div className="flex items-center gap-3">
            <label className="w-24 shrink-0 text-sm text-gray-400">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. groceries"
              className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Processing…" : "Run OCR"}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-lg border border-red-700 bg-red-950/50 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* Raw OCR text */}
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold tracking-widest text-gray-500 uppercase">
                Raw OCR Text
              </h2>
              <pre className="flex-1 overflow-auto rounded-xl bg-gray-900 p-4 text-xs leading-relaxed text-gray-300 ring-1 ring-gray-800">
                {result.ocrText}
              </pre>
            </section>

            {/* Parsed result */}
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold tracking-widest text-gray-500 uppercase">
                Parsed Result
              </h2>
              <div className="rounded-xl bg-gray-900 p-4 ring-1 ring-gray-800">
                {result.parsed.merchantName && (
                  <p className="mb-3 text-sm text-gray-400">
                    Merchant:{" "}
                    <span className="font-medium text-white">
                      {result.parsed.merchantName}
                    </span>
                  </p>
                )}

                {result.parsed.entries.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800 text-left text-xs tracking-wider text-gray-500 uppercase">
                        <th className="pr-4 pb-2">Item</th>
                        <th className="pb-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.parsed.entries.map((entry, i) => (
                        <tr
                          key={i}
                          className="border-b border-gray-800/50 last:border-0"
                        >
                          <td className="py-2 pr-4 text-gray-200">
                            {entry.description ?? "—"}
                          </td>
                          <td className="py-2 text-right font-mono text-gray-300">
                            {formatAmount(entry.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {result.parsed.total !== null && (
                      <tfoot>
                        <tr className="border-t-2 border-gray-700">
                          <td className="pt-3 font-semibold text-white">
                            Total
                          </td>
                          <td className="pt-3 text-right font-mono font-semibold text-indigo-400">
                            {formatAmount(result.parsed.total)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                ) : (
                  <p className="text-sm text-gray-500">No items extracted.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
};

export default OcrTestPage;
