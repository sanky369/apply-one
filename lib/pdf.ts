// Server-side PDF text extraction via unpdf (serverless-friendly pdf.js build).
import { extractText, getDocumentProxy } from "unpdf";

export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  try {
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    return (Array.isArray(text) ? text.join("\n") : text).trim();
  } catch {
    // Garbled/scanned/encrypted PDFs land here — caller falls back to native reading.
    return "";
  }
}
