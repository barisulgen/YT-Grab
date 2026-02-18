import { NextRequest } from "next/server";
import { downloadVideo, type AudioFormat, type AudioQuality } from "@/lib/ytdlp";
import { pendingDownloads } from "@/lib/downloads";
import { VALID_YOUTUBE_HOSTS, MAX_VIDEOS_PER_DOWNLOAD } from "@/lib/constants";
import { mkdir, readdir, rm } from "fs/promises";
import { createWriteStream } from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";
import archiver from "archiver";

function slugify(text: string): string {
  const slug = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  return slug || "playlist";
}

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: NextRequest) {
  const { videos, playlistTitle, format, quality } = await request.json() as {
    videos: { id: string; url: string; title: string }[];
    playlistTitle?: string;
    format?: AudioFormat;
    quality?: AudioQuality;
  };

  const audioFormat: AudioFormat = (["mp3", "flac", "wav", "aac"] as const).includes(format as AudioFormat) ? format as AudioFormat : "mp3";
  const audioQuality: AudioQuality = (["128", "192", "320"] as const).includes(quality as AudioQuality) ? quality as AudioQuality : "128";

  if (!videos || !Array.isArray(videos) || videos.length === 0) {
    return jsonError("No videos provided");
  }

  if (videos.length > MAX_VIDEOS_PER_DOWNLOAD) {
    return jsonError(`Maximum ${MAX_VIDEOS_PER_DOWNLOAD} videos per download`);
  }

  for (const video of videos) {
    try {
      const parsed = new URL(video.url);
      if (!VALID_YOUTUBE_HOSTS.includes(parsed.hostname)) {
        return jsonError(`Invalid video URL: ${video.url}`);
      }
    } catch {
      return jsonError(`Invalid URL format: ${video.url}`);
    }
  }

  const sessionId = randomUUID();
  const tempDir = path.join(os.tmpdir(), "yt-grab", sessionId);
  await mkdir(tempDir, { recursive: true });

  const abortController = new AbortController();

  const stream = new ReadableStream({
    async start(controller) {
      let aborted = false;

      function sendEvent(data: Record<string, unknown>) {
        try {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // stream closed
        }
      }

      // Initialize all videos as queued
      for (const video of videos) {
        sendEvent({ videoId: video.id, title: video.title, status: "queued", progress: 0 });
      }

      // Download sequentially
      for (const video of videos) {
        if (aborted) break;

        try {
          await downloadVideo(video.url, video.id, tempDir, {
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
          }, abortController.signal, { format: audioFormat, quality: audioQuality });
        } catch {
          if (abortController.signal.aborted) {
            aborted = true;
            break;
          }
        }
      }

      if (aborted) {
        sendEvent({ type: "stopped" });
        await rm(tempDir, { recursive: true, force: true }).catch(() => {});
        controller.close();
        return;
      }

      // Gather downloaded audio files
      const audioExtensions = [`.${audioFormat}`, ".mp3", ".flac", ".wav", ".aac", ".m4a"];
      const files = await readdir(tempDir);
      const audioFiles = files.filter(f => audioExtensions.some(ext => f.endsWith(ext)));

      if (audioFiles.length === 0) {
        sendEvent({ type: "error", error: "No files were downloaded successfully" });
        await rm(tempDir, { recursive: true, force: true }).catch(() => {});
        controller.close();
        return;
      }

      const downloadId = randomUUID();

      if (audioFiles.length === 1) {
        const filename = audioFiles[0];
        const filePath = path.join(tempDir, filename);
        pendingDownloads.set(downloadId, { filePath, filename, createdAt: Date.now() });
        sendEvent({ type: "ready", downloadId, filename });
      } else {
        const zipName = `${slugify(playlistTitle || "playlist")}.zip`;
        const zipPath = path.join(tempDir, zipName);

        await new Promise<void>((resolve, reject) => {
          const output = createWriteStream(zipPath);
          const archive = archiver("zip", { zlib: { level: 5 } });
          output.on("close", resolve);
          output.on("error", reject);
          archive.on("error", reject);
          archive.pipe(output);
          for (const file of audioFiles) {
            archive.file(path.join(tempDir, file), { name: file });
          }
          archive.finalize();
        });

        pendingDownloads.set(downloadId, { filePath: zipPath, filename: zipName, createdAt: Date.now() });
        sendEvent({ type: "ready", downloadId, filename: zipName });
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
