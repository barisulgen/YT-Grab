"use client";

import FolderPicker from "./FolderPicker";

interface DownloadBarProps {
  selectedCount: number;
  outputDir: string;
  onOutputDirChange: (dir: string) => void;
  onDownload: () => void;
  onStop: () => void;
  downloading: boolean;
  overallProgress: { done: number; total: number };
}

export default function DownloadBar({
  selectedCount,
  outputDir,
  onOutputDirChange,
  onDownload,
  onStop,
  downloading,
  overallProgress,
}: DownloadBarProps) {
  const progressPct =
    overallProgress.total > 0
      ? Math.round((overallProgress.done / overallProgress.total) * 100)
      : 0;

  return (
    <div className="w-full space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
      <FolderPicker
        value={outputDir}
        onChange={onOutputDirChange}
        disabled={downloading}
      />

      <div className="flex items-center gap-3">
        {downloading ? (
          <>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Downloading... ({overallProgress.done}/{overallProgress.total})
            </span>
            <button
              onClick={onStop}
              className="rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-700 dark:bg-zinc-800 dark:text-red-400 dark:hover:bg-zinc-700"
            >
              Stop
            </button>
          </>
        ) : (
          <button
            onClick={onDownload}
            disabled={selectedCount === 0 || !outputDir.trim()}
            className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download {selectedCount} video{selectedCount !== 1 ? "s" : ""}
          </button>
        )}

        {downloading && (
          <div className="flex flex-1 items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className="h-full rounded-full bg-red-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {progressPct}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
