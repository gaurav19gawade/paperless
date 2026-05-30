// Use the legacy build for compatibility with older WebKit versions.
// The modern build uses Map.prototype.getOrInsertComputed which isn't
// available in older browsers/webviews. Legacy build transpiles this.
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import type { PDFDocumentProxy } from "pdfjs-dist";

import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export class PdfPasswordError extends Error {
  constructor() {
    super("PDF is password-protected");
    this.name = "PdfPasswordError";
  }
}

export class PdfLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfLoadError";
  }
}

/**
 * Load a PDF from a byte array.
 * Throws PdfPasswordError if encrypted, PdfLoadError for any other failure.
 */
export async function loadPdfFromBytes(
  bytes: Uint8Array,
): Promise<PDFDocumentProxy> {
  try {
    // pdf.js mutates the input buffer when parsing — pass a copy.
    const data = new Uint8Array(bytes);
    const loadingTask = pdfjsLib.getDocument({ data });
    const doc = await loadingTask.promise;
    return doc;
  } catch (err: unknown) {
    if (err && typeof err === "object" && "name" in err) {
      if (err.name === "PasswordException") {
        throw new PdfPasswordError();
      }
    }
    const msg = err instanceof Error ? err.message : "Unknown error";
    throw new PdfLoadError(msg);
  }
}
