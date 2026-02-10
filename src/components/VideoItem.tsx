"use client";

import type { VideoInfo, DownloadProgress } from "@/types";

interface VideoItemProps {
  video: VideoInfo;
  selected: boolean;
  onToggle: (id: string) => void;
  progress?: DownloadProgress;
}

function statusLabel(status: DownloadProgress["status"]): string {
  switch (status) {
    case "queued": return "Queued";
    case "downloading": return "Downloading";
    case "converting": return "Converting";
    case "done": return "Done";
    case "error": return "Error";
  }
}

function statusColor(status: DownloadProgress["status"]): string {
  switch (status) {
    case "queued": return "text-zinc-400";
    case "downloading": return "text-blue-500";
    case "converting": return "text-yellow-500";
    case "done": return "text-green-500";
    case "error": return "text-red-500";
  }
}

export default function VideoItem({ video, selected, onToggle, progress }: VideoItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 transition hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600">
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(video.id)}
        className="h-4 w-4 shrink-0 cursor-pointer rounded border-zinc-300 text-red-600 accent-red-600"
      />

      {/* Thumbnail */}
      <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-700">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnail}
          alt={video.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <span className="absolute bottom-0.5 right-0.5 rounded bg-black/75 px-1 py-0.5 text-[10px] font-medium text-white">
          {video.durationFormatted}
        </span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100" title={video.title}>
          {video.title}
        </p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {video.uploader}
        </p>
      </div>

      {/* Download status */}
      {progress && (
        <div className="shrink-0 text-right">
          <p className={`text-xs font-medium ${statusColor(progress.status)}`}>
            {statusLabel(progress.status)}
          </p>
          {progress.status === "downloading" && (
            <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          )}
          {progress.status === "error" && progress.error && (
            <p className="mt-0.5 max-w-[150px] truncate text-[10px] text-red-400" title={progress.error}>
              {progress.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
