import { useState } from "react";
import type { VideoInfo, DownloadProgress } from "@/types";
import VideoItem from "./VideoItem";

interface VideoListProps {
  videos: VideoInfo[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  progressMap: Map<string, DownloadProgress>;
}

type SortKey = "default" | "name-asc" | "name-desc" | "length-asc" | "length-desc";

export default function VideoList({
  videos,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
  progressMap,
}: VideoListProps) {
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("default");

  const filteredVideos = filter
    ? videos.filter((v) =>
        v.title.toLowerCase().includes(filter.toLowerCase()) ||
        v.uploader.toLowerCase().includes(filter.toLowerCase())
      )
    : videos;

  const sortedVideos = sortBy === "default"
    ? filteredVideos
    : [...filteredVideos].sort((a, b) => {
        switch (sortBy) {
          case "name-asc": return a.title.localeCompare(b.title);
          case "name-desc": return b.title.localeCompare(a.title);
          case "length-asc": return a.duration - b.duration;
          case "length-desc": return b.duration - a.duration;
          default: return 0;
        }
      });

  const allSelected = videos.length > 0 && selectedIds.size === videos.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < videos.length;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={() => {
                if (allSelected || someSelected) {
                  onDeselectAll();
                } else {
                  onSelectAll();
                }
              }}
              className="h-4 w-4 cursor-pointer rounded border-zinc-300 text-red-600 accent-red-600"
            />
            {allSelected ? "Deselect all" : "Select all"}
          </label>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {selectedIds.size} of {videos.length} selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="default">Original order</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="length-asc">Shortest first</option>
            <option value="length-desc">Longest first</option>
          </select>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by title..."
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Video list */}
      <div className="flex max-h-[480px] flex-col gap-2 overflow-y-auto pr-1">
        {sortedVideos.map((video) => (
          <VideoItem
            key={video.id}
            video={video}
            selected={selectedIds.has(video.id)}
            onToggle={onToggle}
            progress={progressMap.get(video.id)}
          />
        ))}
        {sortedVideos.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-400">
            No videos match your filter.
          </p>
        )}
      </div>
    </div>
  );
}
