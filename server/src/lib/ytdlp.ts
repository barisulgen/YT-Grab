import { existsSync } from "fs";
import { join, dirname } from "path";
import { execFile, spawn } from "child_process";
import { promisify } from "util";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import type { VideoInfo, PlaylistInfo } from "../types/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const execFileAsync = promisify(execFile);

// Resolve paths to bundled binaries
function getYtDlpPath(): string {
  const binaryName = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
  const localPath = join(process.cwd(), "bin", binaryName);
  if (existsSync(localPath)) return localPath;
  // Also check relative to server root (for monorepo layout)
  const serverBinPath = join(__dirname, "..", "..", "bin", binaryName);
  if (existsSync(serverBinPath)) return serverBinPath;
  // Fallback to system PATH
  return "yt-dlp";
}

function getFfmpegPath(): string {
  try {
    return require("@ffmpeg-installer/ffmpeg").path;
  } catch {
    return "ffmpeg";
  }
}

const ytDlpPath = getYtDlpPath();
const ffmpegPath = getFfmpegPath();

/** Turn raw yt-dlp error output into a short, human-readable message. */
function friendlyError(raw: string): string {
  const s = raw.toLowerCase();

  if (s.includes("playlist does not exist"))
    return "This playlist doesn't exist. It may be private or the link may be wrong.";
  if (s.includes("private video") || s.includes("sign in to confirm your age") || s.includes("login required"))
    return "This video is private or age-restricted and can't be accessed.";
  if (s.includes("video unavailable") || s.includes("this video is unavailable"))
    return "This video is unavailable. It may have been removed or region-locked.";
  if (s.includes("is not a valid url") || s.includes("unsupported url"))
    return "This URL isn't recognized. Please paste a valid YouTube video or playlist link.";
  if (s.includes("no video formats found") || s.includes("requested format not available"))
    return "No downloadable formats were found for this video.";
  if (s.includes("http error 403") || s.includes("forbidden"))
    return "Access denied by YouTube. The content may be restricted.";
  if (s.includes("http error 404") || s.includes("not found"))
    return "Content not found. The video or playlist may have been deleted.";
  if (s.includes("http error 429") || s.includes("too many requests"))
    return "Too many requests. YouTube is rate-limiting you — try again later.";
  if (s.includes("unable to download webpage") || s.includes("urlopen error") || s.includes("network"))
    return "Network error. Check your internet connection and try again.";
  if (s.includes("copyright"))
    return "This video can't be downloaded due to a copyright claim.";

  // Try to extract just the "ERROR:" line from yt-dlp output
  const errorLine = raw.match(/ERROR:\s*(.+)/i);
  if (errorLine) {
    const cleaned = errorLine[1].replace(/\[[\w:]+\]\s*[\w-]+:\s*/, "").trim();
    if (cleaned.length > 0 && cleaned.length < 200) return cleaned;
  }

  return "Something went wrong while fetching this URL. Please check the link and try again.";
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function isPlaylistUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.has("list");
  } catch {
    return false;
  }
}

function validString(val: unknown): string | null {
  if (typeof val === "string" && val.length > 0 && val !== "None" && val !== "NA") return val;
  return null;
}

function parseVideoEntry(data: Record<string, unknown>): VideoInfo {
  const id = validString(data.id) || "";
  const duration = (typeof data.duration === "number" ? data.duration : 0) || 0;
  return {
    id,
    title: validString(data.title) || "Unknown Title",
    duration,
    durationFormatted: formatDuration(Math.round(duration)),
    thumbnail:
      validString(data.thumbnail) ||
      `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
    url: validString(data.webpage_url) || validString(data.url) || `https://www.youtube.com/watch?v=${id}`,
    uploader: validString(data.uploader) || validString(data.channel) || "Unknown",
  };
}

export async function fetchVideoInfo(url: string): Promise<PlaylistInfo> {
  try {
    if (isPlaylistUrl(url)) {
      return await fetchPlaylistInfo(url);
    }
    return await fetchSingleVideoInfo(url);
  } catch (err) {
    throw new Error(friendlyError(err instanceof Error ? err.message : String(err)));
  }
}

async function fetchSingleVideoInfo(url: string): Promise<PlaylistInfo> {
  const { stdout } = await execFileAsync(ytDlpPath, [
    "--dump-json",
    "--no-download",
    "--no-warnings",
    "--ffmpeg-location", ffmpegPath,
    url,
  ], { maxBuffer: 10 * 1024 * 1024 });

  const data = JSON.parse(stdout.trim());
  const video = parseVideoEntry(data);

  return {
    title: video.title,
    videoCount: 1,
    videos: [video],
  };
}

async function fetchPlaylistInfo(url: string): Promise<PlaylistInfo> {
  const { stdout } = await execFileAsync(ytDlpPath, [
    "--flat-playlist",
    "--dump-json",
    "--no-warnings",
    "--ffmpeg-location", ffmpegPath,
    url,
  ], { maxBuffer: 50 * 1024 * 1024 });

  const lines = stdout.trim().split("\n").filter(Boolean);
  const videos: VideoInfo[] = lines.map((line) => {
    const data = JSON.parse(line);
    return parseVideoEntry(data);
  });

  let playlistTitle = "Playlist";
  if (videos.length > 0) {
    try {
      const firstData = JSON.parse(lines[0]);
      if (firstData.playlist_title) {
        playlistTitle = firstData.playlist_title;
      }
    } catch {
      // ignore
    }
  }

  return {
    title: playlistTitle,
    videoCount: videos.length,
    videos,
  };
}

export interface DownloadCallbacks {
  onProgress: (videoId: string, progress: number) => void;
  onStatusChange: (videoId: string, status: string) => void;
  onError: (videoId: string, error: string) => void;
  onDone: (videoId: string) => void;
}

export function downloadVideo(
  videoUrl: string,
  videoId: string,
  outputDir: string,
  callbacks: DownloadCallbacks,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error("Cancelled"));
      return;
    }

    callbacks.onStatusChange(videoId, "downloading");

    const proc = spawn(ytDlpPath, [
      "-x",
      "--audio-format", "mp3",
      "--audio-quality", "0",
      "--ffmpeg-location", ffmpegPath,
      "-o", `${outputDir}/%(title)s.%(ext)s`,
      "--no-warnings",
      "--newline",
      videoUrl,
    ]);

    const onAbort = () => {
      proc.kill();
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    let stderrData = "";

    proc.stdout.on("data", (data: Buffer) => {
      const text = data.toString();
      const progressMatch = text.match(/\[download\]\s+([\d.]+)%/);
      if (progressMatch) {
        callbacks.onProgress(videoId, parseFloat(progressMatch[1]));
      }
      if (text.includes("[ExtractAudio]") || text.includes("[PostProcessor]")) {
        callbacks.onStatusChange(videoId, "converting");
      }
    });

    proc.stderr.on("data", (data: Buffer) => {
      const text = data.toString();
      stderrData += text;
      const progressMatch = text.match(/\[download\]\s+([\d.]+)%/);
      if (progressMatch) {
        callbacks.onProgress(videoId, parseFloat(progressMatch[1]));
      }
    });

    proc.on("close", (code) => {
      signal?.removeEventListener("abort", onAbort);
      if (signal?.aborted) {
        reject(new Error("Cancelled"));
      } else if (code === 0) {
        callbacks.onProgress(videoId, 100);
        callbacks.onDone(videoId);
        resolve();
      } else {
        const errorMsg = friendlyError(stderrData.trim() || `yt-dlp exited with code ${code}`);
        callbacks.onError(videoId, errorMsg);
        reject(new Error(errorMsg));
      }
    });

    proc.on("error", (err) => {
      signal?.removeEventListener("abort", onAbort);
      callbacks.onError(videoId, err.message);
      reject(err);
    });
  });
}

/** Check if both yt-dlp and ffmpeg are available */
export async function checkDependencies(): Promise<{
  ready: boolean;
  ytdlp: { available: boolean; version: string | null };
  ffmpeg: { available: boolean; version: string | null };
}> {
  const check = async (cmd: string, args: string[]) => {
    try {
      const { stdout } = await execFileAsync(cmd, args, { timeout: 5000 });
      return { available: true, version: stdout.trim().split("\n")[0] };
    } catch {
      return { available: false, version: null };
    }
  };

  const [ytdlp, ffmpeg] = await Promise.all([
    check(ytDlpPath, ["--version"]),
    check(ffmpegPath, ["-version"]),
  ]);

  return { ready: ytdlp.available && ffmpeg.available, ytdlp, ffmpeg };
}
