import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";

export interface PickedFile {
  path: string;
  bytes: Uint8Array;
}

/**
 * Opens a native file picker for PDFs. Returns null if user cancels.
 */
export async function pickPdf(): Promise<PickedFile | null> {
  const selected = await open({
    multiple: false,
    filters: [{ name: "PDF", extensions: ["pdf"] }],
  });

  if (!selected || typeof selected !== "string") {
    return null;
  }

  const bytes = await readFile(selected);
  return { path: selected, bytes };
}
