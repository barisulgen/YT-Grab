import { rm } from "fs/promises";
import path from "path";

export interface PendingDownload {
  filePath: string;
  filename: string;
  createdAt: number;
}

// Use globalThis to persist across hot reloads in development
const g = globalThis as unknown as { __ytGrabPending?: Map<string, PendingDownload> };
if (!g.__ytGrabPending) {
  g.__ytGrabPending = new Map();
}
export const pendingDownloads = g.__ytGrabPending;

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
