import { Router } from "express";
import { downloadVideo } from "../lib/ytdlp.js";
import { v4 as uuidv4 } from "uuid";
import { mkdir, readdir, rm, stat } from "fs/promises";
import { createReadStream, createWriteStream } from "fs";
import path from "path";
import os from "os";
import archiver from "archiver";

const router = Router();

interface PendingDownload {
  filePath: string;
  filename: string;
  createdAt: number;
}

const pendingDownloads = new Map<string, PendingDownload>();

// Cleanup downloads older than 30 minutes
const MAX_AGE_MS = 30 * 60 * 1000;
setInterval(async () => {
  const now = Date.now();
  for (const [id, download] of pendingDownloads) {
    if (now - download.createdAt > MAX_AGE_MS) {
      pendingDownloads.delete(id);
      const parentDir = path.dirname(download.filePath);
      await rm(parentDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}, 5 * 60 * 1000);

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

// POST /api/download — SSE stream with progress, then "ready" event
router.post("/", async (req, res) => {
  const { videos, playlistTitle } = req.body as {
    videos: { id: string; url: string; title: string }[];
    playlistTitle?: string;
  };

  if (!videos || !Array.isArray(videos) || videos.length === 0) {
    res.status(400).json({ error: "No videos provided" });
    return;
  }

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Create temp directory
  const sessionId = uuidv4();
  const tempDir = path.join(os.tmpdir(), "yt-grab", sessionId);
  await mkdir(tempDir, { recursive: true });

  let aborted = false;
  const abortController = new AbortController();

  req.on("close", () => {
    aborted = true;
    abortController.abort();
  });

  function sendEvent(data: Record<string, unknown>) {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
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
      }, abortController.signal);
    } catch {
      if (aborted) break;
    }
  }

  if (aborted) {
    sendEvent({ type: "stopped" });
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
    res.end();
    return;
  }

  // Gather downloaded MP3 files
  const files = await readdir(tempDir);
  const mp3Files = files.filter(f => f.endsWith(".mp3"));

  if (mp3Files.length === 0) {
    sendEvent({ type: "error", error: "No files were downloaded successfully" });
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
    res.end();
    return;
  }

  const downloadId = uuidv4();

  if (mp3Files.length === 1) {
    // Single file — serve directly
    const filename = mp3Files[0];
    const filePath = path.join(tempDir, filename);
    pendingDownloads.set(downloadId, { filePath, filename, createdAt: Date.now() });
    sendEvent({ type: "ready", downloadId, filename });
  } else {
    // Multiple files — create zip
    const zipName = playlistTitle ? `${slugify(playlistTitle)}.zip` : "playlist.zip";
    const zipPath = path.join(tempDir, zipName);

    await new Promise<void>((resolve, reject) => {
      const output = createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 5 } });
      output.on("close", resolve);
      archive.on("error", reject);
      archive.pipe(output);
      for (const mp3 of mp3Files) {
        archive.file(path.join(tempDir, mp3), { name: mp3 });
      }
      archive.finalize();
    });

    pendingDownloads.set(downloadId, { filePath: zipPath, filename: zipName, createdAt: Date.now() });
    sendEvent({ type: "ready", downloadId, filename: zipName });
  }

  res.end();
});

// GET /api/download/file/:id — serve the completed file
router.get("/file/:id", async (req, res) => {
  const { id } = req.params;
  const download = pendingDownloads.get(id);

  if (!download) {
    res.status(404).json({ error: "Download not found or expired" });
    return;
  }

  try {
    const stats = await stat(download.filePath);
    res.setHeader("Content-Length", stats.size);
    res.setHeader("Content-Type", download.filename.endsWith(".zip")
      ? "application/zip"
      : "audio/mpeg");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(download.filename)}"`);

    const stream = createReadStream(download.filePath);
    stream.pipe(res);
    stream.on("end", async () => {
      pendingDownloads.delete(id);
      const parentDir = path.dirname(download.filePath);
      await rm(parentDir, { recursive: true, force: true }).catch(() => {});
    });
  } catch {
    res.status(500).json({ error: "Failed to serve file" });
  }
});

export default router;
