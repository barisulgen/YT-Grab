import { NextRequest } from "next/server";
import { stat, rm } from "fs/promises";
import { readFileSync } from "fs";
import path from "path";
import { pendingDownloads } from "@/lib/downloads";

const CONTENT_TYPES: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".flac": "audio/flac",
  ".wav": "audio/wav",
  ".aac": "audio/aac",
  ".m4a": "audio/mp4",
  ".zip": "application/zip",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const download = pendingDownloads.get(id);

  if (!download) {
    return new Response(JSON.stringify({ error: "Download not found or expired" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  pendingDownloads.delete(id);

  try {
    const stats = await stat(download.filePath);
    const ext = path.extname(download.filename);
    const contentType = CONTENT_TYPES[ext] || "application/octet-stream";

    const fileBuffer = readFileSync(download.filePath);

    // Clean up temp dir after reading
    const parentDir = path.dirname(download.filePath);
    rm(parentDir, { recursive: true, force: true }).catch(() => {});

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": stats.size.toString(),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(download.filename)}"`,
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to serve file" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
