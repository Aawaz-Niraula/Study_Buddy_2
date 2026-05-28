import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/supabase-api-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_PDF_BYTES = 15 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
type PdfParseResult = {
  text: string;
  numpages: number;
};
type UploadKind = "pdf" | "document";

function isPdfParseResult(value: unknown): value is PdfParseResult {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { text?: unknown; numpages?: unknown };
  return typeof candidate.text === "string" && typeof candidate.numpages === "number";
}

function isTrustedBlobUrl(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "https:") return false;
    return (
      hostname.endsWith(".blob.vercel-storage.com") ||
      hostname.endsWith(".public.blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

/**
 * Fetches a short-lived PDF from Blob, extracts text, then deletes the blob.
 * Expects a small JSON body { url } so requests stay under serverless body limits.
 */
export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to process PDFs." }, { status: 401 });
  }

  let blobUrl: string | null = null;
  try {
    const body = await request.json().catch(() => null) as { url?: string; kind?: string } | null;
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    const kind: UploadKind = body?.kind === "document" ? "document" : "pdf";
    if (!url || !isTrustedBlobUrl(url)) {
      return NextResponse.json({ error: "Invalid or untrusted file URL." }, { status: 400 });
    }
    blobUrl = url;

    const fileRes = await fetch(url);
    if (!fileRes.ok) {
      return NextResponse.json(
        { error: `Could not download file (${fileRes.status}).` },
        { status: 502 }
      );
    }

    const contentLength = fileRes.headers.get("content-length");
    const maxBytes = kind === "pdf" ? MAX_PDF_BYTES : MAX_DOCUMENT_BYTES;
    if (contentLength && Number(contentLength) > maxBytes) {
      return NextResponse.json({ error: `${kind === "pdf" ? "PDF" : "Document"} exceeds 15MB limit.` }, { status: 400 });
    }

    const arrayBuffer = await fileRes.arrayBuffer();
    if (arrayBuffer.byteLength > maxBytes) {
      return NextResponse.json({ error: `${kind === "pdf" ? "PDF" : "Document"} exceeds 15MB limit.` }, { status: 400 });
    }

    const buffer = Buffer.from(arrayBuffer);
    if (kind === "document") {
      const mammoth = await import("mammoth");
      const docData = await mammoth.extractRawText({ buffer });
      return NextResponse.json({
        success: true,
        text: docData.value || "",
        pages: null,
      });
    }

    const pdfParse = (await import("pdf-parse")).default;
    const pdfData = await pdfParse(buffer);
    if (!isPdfParseResult(pdfData)) {
      throw new Error("Could not parse PDF text.");
    }

    return NextResponse.json({
      success: true,
      text: pdfData.text,
      pages: pdfData.numpages,
    });
  } catch (error) {
    console.error("PDF process error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to read PDF. Try another file.",
      },
      { status: 500 }
    );
  } finally {
    if (blobUrl) {
      try {
        await del(blobUrl);
      } catch (e) {
        console.error("Blob delete after PDF process:", e);
      }
    }
  }
}
