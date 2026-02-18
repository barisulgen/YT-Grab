"use client";

import { useState } from "react";
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
  const [previewing, setPreviewing] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const fallbackThumb = `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;
  const thumbSrc = !imgFailed && video.thumbnail ? video.thumbnail : fallbackThumb;

  return (
    <div className="shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white transition hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-zinc-600">
      <div className="flex items-center gap-3 p-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(video.id)}
          className="h-4 w-4 shrink-0 cursor-pointer rounded border-zinc-300 text-red-600 accent-red-600"
        />

        {/* Thumbnail */}
        <button
          type="button"
          onClick={() => setPreviewing((p) => !p)}
          className="group relative h-16 w-28 shrink-0 overflow-hidden rounded bg-zinc-200 dark:bg-zinc-700"
          title={previewing ? "Close preview" : "Preview video"}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbSrc}
            alt={video.title}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            onError={() => { if (!imgFailed) setImgFailed(true); }}
          />
          <span className="absolute bottom-0.5 right-0.5 rounded bg-black/75 px-1 py-0.5 text-[10px] font-medium text-white">
            {video.durationFormatted}
          </span>
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/40">
            <svg className="h-6 w-6 text-white opacity-0 transition group-hover:opacity-100" fill="currentColor" viewBox="0 0 24 24">
              {previewing
                ? <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                : <path d="M8 5v14l11-7z"/>
              }
            </svg>
          </span>
        </button>

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

      {previewing && (
        <div className="aspect-video w-full border-t border-zinc-200 dark:border-zinc-700">
          <iframe
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
            title={video.title}
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      )}
    </div>
  );
}
