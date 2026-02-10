"use client";

import { useState } from "react";
import FolderBrowserModal from "./FolderBrowserModal";

interface FolderPickerProps {
  value: string;
  onChange: (path: string) => void;
  disabled?: boolean;
}

export default function FolderPicker({ value, onChange, disabled }: FolderPickerProps) {
  const [browserOpen, setBrowserOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <label className="shrink-0 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Save to:
        </label>
        <div className="flex flex-1 items-center gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Click Browse to choose a folder"
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={() => setBrowserOpen(true)}
            disabled={disabled}
            className="shrink-0 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Browse
          </button>
        </div>
      </div>

      <FolderBrowserModal
        open={browserOpen}
        onClose={() => setBrowserOpen(false)}
        onSelect={onChange}
        initialPath={value || undefined}
      />
    </>
  );
}
