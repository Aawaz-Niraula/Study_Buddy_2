import { put, del } from "@vercel/blob";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export async function POST(request: Request) {
  let blobUrl: string | null = null;
  
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: `File too large. Maximum size is 15MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      );
    }
    
    if (file.type !== "application/pdf") {
      return Response.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    // Upload to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
      addRandomSuffix: true,
    });
    blobUrl = blob.url;

    // Extract text using pdf-parse
    const pdfParse = (await import("pdf-parse")).default;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfData = await pdfParse(buffer);
    const extractedText = pdfData.text;

    return Response.json({
      success: true,
      text: extractedText,
      filename: file.name,
      pages: pdfData.numpages,
    });
  } catch (error) {
    console.error("PDF upload error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to process PDF" },
      { status: 500 }
    );
  } finally {
    // Always delete the blob after processing
    if (blobUrl) {
      try {
        await del(blobUrl);
        console.log(`Deleted blob: ${blobUrl}`);
      } catch (deleteError) {
        console.error(`Failed to delete blob ${blobUrl}:`, deleteError);
      }
    }
  }
}
