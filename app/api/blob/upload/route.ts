import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/supabase-api-auth";

export const runtime = "nodejs";

const MAX_PDF_BYTES = 15 * 1024 * 1024;

/**
 * Client-upload handoff for Vercel Blob. Uploads go directly to Blob storage (bypasses the ~4.5MB
 * serverless request body limit). PDF text extraction runs in /api/upload-pdf/process.
 */
export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to upload files." }, { status: 401 });
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const jsonResponse = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["application/pdf"],
        maximumSizeInBytes: MAX_PDF_BYTES,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {
        // Extraction and blob deletion happen in /api/upload-pdf/process
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
