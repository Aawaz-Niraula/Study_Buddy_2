import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/supabase-api-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_PDF_BYTES = 15 * 1024 * 1024;

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to upload files." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No PDF file was uploaded." }, { status: 400 });
    }

    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return NextResponse.json({ error: "Please upload a PDF file." }, { status: 400 });
    }

    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json({ error: "PDF exceeds 15MB limit." }, { status: 400 });
    }

    const pdfParse = (await import("pdf-parse")).default;
    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfData = await pdfParse(buffer);

    return NextResponse.json({
      success: true,
      text: pdfData.text || "",
      pages: pdfData.numpages ?? 0,
    });
  } catch (error) {
    console.error("PDF upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to read PDF. Try another file.",
      },
      { status: 500 }
    );
  }
}
