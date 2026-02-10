"use client";

interface Dep {
  available: boolean;
  version: string | null;
}

interface DependencyBannerProps {
  dependencies: {
    ytdlp: Dep;
    ffmpeg: Dep;
  };
}

export default function DependencyBanner({ dependencies }: DependencyBannerProps) {
  const missing = (Object.keys(dependencies) as Array<keyof typeof dependencies>).filter(
    (key) => !dependencies[key].available
  );

  if (missing.length === 0) return null;

  const names = missing.map((k) => (k === "ytdlp" ? "yt-dlp" : "ffmpeg"));

  return (
    <div className="mb-6 w-full rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/50">
      <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
        Missing: {names.join(", ")}
      </h3>
      <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
        Dependencies weren&apos;t set up correctly. Try running:
      </p>
      <code className="mt-2 block rounded bg-amber-100 px-3 py-2 font-mono text-xs text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
        npm install
      </code>
      <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">
        This will install ffmpeg and download the yt-dlp binary automatically.
        Refresh this page after running the command.
      </p>
    </div>
  );
}
