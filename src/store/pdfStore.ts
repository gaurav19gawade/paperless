import { create } from "zustand";
import type { PDFDocumentProxy } from "pdfjs-dist";

interface PdfState {
  document: PDFDocumentProxy | null;
  filePath: string | null;
  pageCount: number;
  currentPage: number; // 1-indexed
  zoom: number; // 1.0 = 100%

  setDocument: (doc: PDFDocumentProxy, path: string) => void;
  setCurrentPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  closeDocument: () => void;
}

export const usePdfStore = create<PdfState>((set, get) => ({
  document: null,
  filePath: null,
  pageCount: 0,
  currentPage: 1,
  zoom: 1.0,

  setDocument: (doc, path) =>
    set({
      document: doc,
      filePath: path,
      pageCount: doc.numPages,
      currentPage: 1,
      zoom: 1.0,
    }),

  setCurrentPage: (page) => {
    const { pageCount } = get();
    if (page < 1 || page > pageCount) return;
    set({ currentPage: page });
  },

  setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(5, zoom)) }),

  closeDocument: () => {
    const { document } = get();
    if (document) {
      // pdfjs leaks memory if we don't destroy it
      document.destroy();
    }
    set({
      document: null,
      filePath: null,
      pageCount: 0,
      currentPage: 1,
      zoom: 1.0,
    });
  },
}));
