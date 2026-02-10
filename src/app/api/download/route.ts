import { NextRequest } from "next/server";
import { downloadVideo } from "@/lib/ytdlp";
import { mkdir } from "fs/promises";
import path from "path";

interface DownloadRequestBody {
  videos: { id: string; url: string; title: string }[];
  outputDir: string;
  playlistTitle?: string;
}

function slugify(text: string): string {
  return text
    .normalize("NFD")                    // decompose accents (ğ → g + combining mark)
    .replace(/[\u0300-\u036f]/g, "")     // remove combining marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")        // non-alphanumeric → underscore
    .replace(/^_+|_+$/g, "")            // trim leading/trailing underscores
    .replace(/_+/g, "_");               // collapse consecutive underscores
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as DownloadRequestBody;
  const { videos, outputDir, playlistTitle } = body;

  if (!videos || !Array.isArray(videos) || videos.length === 0) {
    return new Response(JSON.stringify({ error: "No videos provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!outputDir || typeof outputDir !== "string") {
    return new Response(JSON.stringify({ error: "No output directory provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // For multiple videos, create a subfolder named after the playlist
  let finalDir = path.resolve(outputDir);
  if (videos.length > 1 && playlistTitle) {
    const folderName = slugify(playlistTitle);
    if (folderName) {
      finalDir = path.join(finalDir, folderName);
    }
  }

  // Ensure directory exists
  try {
    await mkdir(finalDir, { recursive: true });
  } catch (mkdirErr) {
    return new Response(
      JSON.stringify({
        error: `Cannot create directory: ${mkdirErr instanceof Error ? mkdirErr.message : "Unknown error"}`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // AbortController to kill yt-dlp when client disconnects
  const abortController = new AbortController();

  // Use SSE to stream progress
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(data: Record<string, unknown>) {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Stream already closed
        }
      }

      // Initialize all videos as queued
      for (const video of videos) {
        sendEvent({
          videoId: video.id,
          title: video.title,
          status: "queued",
          progress: 0,
        });
      }

      // Download sequentially
      for (const video of videos) {
        if (abortController.signal.aborted) break;

        try {
          await downloadVideo(video.url, video.id, finalDir, {
            onProgress: (videoId, progress) => {
              sendEvent({ videoId, status: "downloading", progress });
            },
            onStatusChange: (videoId, status) => {
              sendEvent({ videoId, status, progress: status === "converting" ? 100 : 0 });
            },
            onError: (videoId, error) => {
              sendEvent({ videoId, status: "error", progress: 0, error });
            },
            onDone: (videoId) => {
              sendEvent({ videoId, status: "done", progress: 100 });
            },
          }, abortController.signal);
        } catch {
          if (abortController.signal.aborted) break;
          // Error already sent via callback
        }
      }

      if (abortController.signal.aborted) {
        sendEvent({ type: "stopped" });
      } else {
        sendEvent({ type: "complete", path: finalDir });
      }
      controller.close();
    },
    cancel() {
      abortController.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
