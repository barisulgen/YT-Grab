export type AudioFormat = "mp3" | "flac" | "wav" | "aac";
export type AudioQuality = "128" | "192" | "320";

interface DownloadBarProps {
  selectedCount: number;
  format: AudioFormat;
  quality: AudioQuality;
  onFormatChange: (format: AudioFormat) => void;
  onQualityChange: (quality: AudioQuality) => void;
  onDownload: () => void;
  onStop: () => void;
  downloading: boolean;
  overallProgress: { done: number; total: number };
}

const FORMAT_LABELS: Record<AudioFormat, string> = {
  mp3: "MP3",
  flac: "FLAC",
  wav: "WAV",
  aac: "AAC",
};

const isLossless = (f: AudioFormat) => f === "flac" || f === "wav";

export default function DownloadBar({
  selectedCount,
  format,
  quality,
  onFormatChange,
  onQualityChange,
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
      {/* Format & quality selectors */}
      {!downloading && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Format</label>
            <select
              value={format}
              onChange={(e) => onFormatChange(e.target.value as AudioFormat)}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {Object.entries(FORMAT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Quality</label>
            <select
              value={quality}
              onChange={(e) => onQualityChange(e.target.value as AudioQuality)}
              disabled={isLossless(format)}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500/20 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="128">128 kbps</option>
              <option value="192">192 kbps</option>
              <option value="320">320 kbps</option>
            </select>
            {isLossless(format) && (
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Lossless</span>
            )}
          </div>
        </div>
      )}

      {/* Download / stop + progress */}
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
            disabled={selectedCount === 0}
            className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download {selectedCount} video{selectedCount !== 1 ? "s" : ""} as {FORMAT_LABELS[format]}
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
