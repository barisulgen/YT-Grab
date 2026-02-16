import { useState, useCallback, useRef } from "react";
import type { PlaylistInfo, DownloadProgress } from "@/types";
import PlaylistInput from "@/components/PlaylistInput";
import VideoList from "@/components/VideoList";
import DownloadBar from "@/components/DownloadBar";

export default function App() {
  const [playlist, setPlaylist] = useState<PlaylistInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [progressMap, setProgressMap] = useState<Map<string, DownloadProgress>>(new Map());
  const [doneCount, setDoneCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const handleFetch = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    setPlaylist(null);
    setSelectedIds(new Set());
    setProgressMap(new Map());
    setDoneCount(0);

    try {
      const res = await fetch(`/api/playlist?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch");
      }

      const info = data as PlaylistInfo;
      setPlaylist(info);
      setSelectedIds(new Set(info.videos.map((v) => v.id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (playlist) {
      setSelectedIds(new Set(playlist.videos.map((v) => v.id)));
    }
  }, [playlist]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleDownload = useCallback(async () => {
    if (!playlist || selectedIds.size === 0) return;

    const controller = new AbortController();
    abortRef.current = controller;

    setDownloading(true);
    setDoneCount(0);
    setError(null);

    const selectedVideos = playlist.videos
      .filter((v) => selectedIds.has(v.id))
      .map((v) => ({ id: v.id, url: v.url, title: v.title }));

    // Initialize progress
    const initialProgress = new Map<string, DownloadProgress>();
    for (const v of selectedVideos) {
      initialProgress.set(v.id, {
        videoId: v.id,
        title: v.title,
        status: "queued",
        progress: 0,
      });
    }
    setProgressMap(initialProgress);

    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videos: selectedVideos, playlistTitle: playlist.title }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Download failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let completed = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const dataLine = line.replace(/^data: /, "").trim();
          if (!dataLine) continue;

          try {
            const event = JSON.parse(dataLine);

            // File is ready for download
            if (event.type === "ready" && event.downloadId) {
              const a = document.createElement("a");
              a.href = `/api/download/file/${event.downloadId}`;
              a.download = event.filename || "download";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              continue;
            }

            if (event.videoId) {
              setProgressMap((prev) => {
                const next = new Map(prev);
                const existing = next.get(event.videoId);
                next.set(event.videoId, {
                  videoId: event.videoId,
                  title: existing?.title || event.title || "",
                  status: event.status,
                  progress: event.progress ?? 0,
                  error: event.error,
                });
                return next;
              });

              if (event.status === "done") {
                completed++;
                setDoneCount(completed);
              }
            }
          } catch {
            // skip malformed event
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // User clicked Stop
      } else {
        setError(err instanceof Error ? err.message : "Download failed");
      }
    } finally {
      abortRef.current = null;
      setDownloading(false);
    }
  }, [playlist, selectedIds]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="w-full bg-[#151514]">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <img
            src="/yt-grab-logo.png"
            alt="yt-grab"
            className="h-10 w-10"
          />
          <div>
            <h1 className="text-xl font-bold text-white">yt-grab</h1>
            <p className="text-xs text-red-200">Download YouTube videos as MP3</p>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-4 py-8">
        {/* URL Input */}
        <PlaylistInput onFetch={handleFetch} loading={loading} error={error} />

        {/* How to use */}
        {!playlist && !loading && (
          <div className="mt-8 w-full rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-800/50">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              How to use
            </h3>
            <ol className="mt-2 space-y-1 text-sm text-zinc-500 dark:text-zinc-400">
              <li>1. Paste a YouTube video or playlist URL above and click <strong className="text-zinc-700 dark:text-zinc-300">Fetch</strong></li>
              <li>2. Select the videos you want to download</li>
              <li>3. Click <strong className="text-zinc-700 dark:text-zinc-300">Download</strong></li>
            </ol>
            <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
              Files download to your browser as MP3. Playlists are zipped into a single file.
            </p>
          </div>
        )}

        {/* Playlist info + video list */}
        {playlist && (
          <div className="mt-6 w-full space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {playlist.title}
              </h2>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {playlist.videoCount} video{playlist.videoCount !== 1 ? "s" : ""}
              </span>
            </div>

            <VideoList
              videos={playlist.videos}
              selectedIds={selectedIds}
              onToggle={handleToggle}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              progressMap={progressMap}
            />

            <DownloadBar
              selectedCount={selectedIds.size}
              onDownload={handleDownload}
              onStop={handleStop}
              downloading={downloading}
              overallProgress={{ done: doneCount, total: selectedIds.size }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
