# yt-grab

A local web app for downloading YouTube videos and playlists as MP3 files. Paste a URL, pick the videos you want, choose a folder, and download.

<img width="432" height="435" alt="yt-grab-logo" src="https://github.com/user-attachments/assets/09ff0f31-2f0d-468e-890e-074ea6c472d6" />

## Features

- **Playlist & single video support** — works with any YouTube URL
- **Video metadata preview** — see titles, thumbnails, durations, and uploaders before downloading
- **Selective download** — checkboxes with select/deselect all to pick exactly which videos to grab
- **Filter** — search within a playlist by title
- **Real-time progress** — per-video download status streamed via SSE
- **Browse for output folder** — visual folder picker with create-folder support
- **Playlist subfolder** — downloading multiple videos auto-creates a folder named after the playlist
- **Auto-open folder** — opens the output folder in your file explorer when downloads finish
- **Stop downloads** — cancel in-progress downloads at any time
- **Zero system dependencies** — `npm install` handles everything (yt-dlp binary + ffmpeg)

## Getting Started

```bash
git clone <repo-url>
cd yt-grab
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm install` automatically downloads the yt-dlp binary and installs a bundled ffmpeg — no system-level setup required.

## Usage

1. Paste a YouTube playlist or video URL into the input field
2. Click **Fetch** to load video info
3. Select which videos to download using the checkboxes
4. Click **Browse** to choose an output folder (defaults to your Downloads folder)
5. Click **Download** and watch progress in real-time
6. The output folder opens automatically when all downloads finish

## Tech Stack

- [Next.js](https://nextjs.org) 16 (App Router, Turbopack)
- [Tailwind CSS](https://tailwindcss.com) v4
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) via [yt-dlp-wrap](https://www.npmjs.com/package/yt-dlp-wrap)
- [@ffmpeg-installer/ffmpeg](https://www.npmjs.com/package/@ffmpeg-installer/ffmpeg)

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Main page (URL input, video list, download)
│   ├── layout.tsx                # Root layout
│   └── api/
│       ├── playlist/route.ts     # Fetch video/playlist metadata
│       ├── download/route.ts     # Download videos as MP3 (SSE progress)
│       ├── health/route.ts       # Dependency availability check
│       ├── browse/route.ts       # List/create directories for folder picker
│       └── open-folder/route.ts  # Open folder in system file explorer
├── components/
│   ├── PlaylistInput.tsx         # URL input + fetch button
│   ├── VideoList.tsx             # Video list with select all/filter
│   ├── VideoItem.tsx             # Single video row
│   ├── DownloadBar.tsx           # Download/stop button + progress bar
│   ├── FolderPicker.tsx          # Output folder input + browse button
│   ├── FolderBrowserModal.tsx    # Visual folder browser modal
│   └── DependencyBanner.tsx      # Warning banner if deps are missing
├── lib/
│   └── ytdlp.ts                  # yt-dlp wrapper (metadata + download)
└── types/
    └── index.ts                  # Shared TypeScript types
```

## License

MIT
