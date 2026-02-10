"use client";

import { useState, useEffect, useCallback } from "react";

interface FolderEntry {
  name: string;
  path: string;
}

interface BrowseResponse {
  current: string;
  parent: string | null;
  folders: FolderEntry[];
  error?: string;
}

interface FolderBrowserModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  initialPath?: string;
}

export default function FolderBrowserModal({
  open,
  onClose,
  onSelect,
  initialPath,
}: FolderBrowserModalProps) {
  const [currentPath, setCurrentPath] = useState("");
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  const browse = useCallback(async (path?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = path ? `?path=${encodeURIComponent(path)}` : "";
      const res = await fetch(`/api/browse${params}`);
      const data: BrowseResponse = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to browse");
      }
      setCurrentPath(data.current);
      setParentPath(data.parent);
      setFolders(data.folders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to browse");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      browse(initialPath || undefined);
    }
  }, [open, initialPath, browse]);

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      const fullPath = `${currentPath}${currentPath.endsWith("\\") || currentPath.endsWith("/") ? "" : "/"}${newFolderName.trim()}`;
      const res = await fetch("/api/browse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: fullPath }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create folder");
      }
      setNewFolderName("");
      await browse(currentPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create folder");
    } finally {
      setCreatingFolder(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Choose folder
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current path */}
        <div className="border-b border-zinc-200 px-4 py-2 dark:border-zinc-700">
          <p className="truncate text-xs font-mono text-zinc-500 dark:text-zinc-400" title={currentPath}>
            {currentPath}
          </p>
        </div>

        {/* Folder list */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="h-5 w-5 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : error ? (
            <p className="px-4 py-6 text-center text-sm text-red-500">{error}</p>
          ) : (
            <div className="py-1">
              {/* Go up */}
              {parentPath && (
                <button
                  onClick={() => browse(parentPath)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <svg className="h-4 w-4 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-zinc-500 dark:text-zinc-400">..</span>
                </button>
              )}

              {folders.length === 0 && !parentPath && (
                <p className="px-4 py-6 text-center text-sm text-zinc-400">No folders found</p>
              )}

              {folders.map((folder) => (
                <button
                  key={folder.path}
                  onClick={() => browse(folder.path)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <svg className="h-4 w-4 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                  <span className="truncate text-zinc-700 dark:text-zinc-300">
                    {folder.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* New folder */}
        <div className="border-t border-zinc-200 px-4 py-2 dark:border-zinc-700">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              placeholder="New folder name"
              className="flex-1 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs outline-none transition focus:border-red-500 focus:ring-1 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              disabled={creatingFolder}
            />
            <button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || creatingFolder}
              className="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Create
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSelect(currentPath);
              onClose();
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Select this folder
          </button>
        </div>
      </div>
    </div>
  );
}
