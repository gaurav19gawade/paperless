import { useEffect, useRef, useState } from "react";
import { usePdfStore } from "./store/pdfStore";
import { pickPdf } from "./lib/files";
import { loadPdfFromBytes, PdfPasswordError } from "./lib/pdf";

function App() {
  const { document, filePath, pageCount, currentPage, setDocument, setCurrentPage } =
    usePdfStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleOpen() {
    setError(null);
    setIsLoading(true);
    try {
      const picked = await pickPdf();
      if (!picked) {
        setIsLoading(false);
        return;
      }
      const doc = await loadPdfFromBytes(picked.bytes);
      setDocument(doc, picked.path);
    } catch (err) {
      if (err instanceof PdfPasswordError) {
        setError("This PDF is password-protected. Decryption isn't supported yet.");
      } else {
        setError(err instanceof Error ? err.message : "Could not open this file.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Render the current page whenever document or page changes
  useEffect(() => {
    if (!document || !canvasRef.current) return;

    let cancelled = false;
    const canvas = canvasRef.current;

    (async () => {
      const page = await document.getPage(currentPage);
      if (cancelled) return;

      const viewport = page.getViewport({ scale: 1.5 });
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Handle retina/HiDPI: backing store at devicePixelRatio, CSS size at viewport size
      const dpr = window.devicePixelRatio || 1;
      canvas.width = viewport.width * dpr;
      canvas.height = viewport.height * dpr;
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      ctx.scale(dpr, dpr);

      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    })();

    return () => {
      cancelled = true;
    };
  }, [document, currentPage]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <h1 className="text-lg font-semibold">paperless</h1>
        <button
          onClick={handleOpen}
          disabled={isLoading}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Opening..." : "Open PDF"}
        </button>
        {filePath && (
          <span className="text-sm text-gray-600 truncate">{filePath}</span>
        )}
        {document && (
          <div className="ml-auto flex items-center gap-2 text-sm">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              ←
            </button>
            <span>
              Page {currentPage} of {pageCount}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= pageCount}
              className="px-2 py-1 border rounded disabled:opacity-50"
            >
              →
            </button>
          </div>
        )}
      </header>

      {error && (
        <div className="bg-red-100 border-b border-red-300 text-red-800 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <main className="flex-1 overflow-auto p-6 flex justify-center items-start">
        {!document ? (
          <div className="text-gray-400 mt-20">
            Click "Open PDF" to get started.
          </div>
        ) : (
          <canvas ref={canvasRef} className="shadow-lg bg-white" />
        )}
      </main>
    </div>
  );
}

export default App;
