# yt-grab

A web app for downloading YouTube videos and playlists as MP3 files. Paste a URL, pick the videos you want, and download.

<img width="432" height="435" alt="yt-grab-logo" src="https://github.com/user-attachments/assets/09ff0f31-2f0d-468e-890e-074ea6c472d6" />

## Features

- **Playlist & single video support** — works with any YouTube URL
- **Video metadata preview** — see titles, thumbnails, durations, and uploaders before downloading
- **Selective download** — checkboxes with select/deselect all to pick exactly which videos to grab
- **Filter & sort** — search by title, sort by name or length
- **Video preview** — click a thumbnail to preview the video inline
- **Real-time progress** — per-video download status streamed via SSE
- **Playlist ZIP** — multiple videos are zipped into a single download
- **Stop downloads** — cancel in-progress downloads at any time
- **Zero system dependencies** — `npm install` handles everything (yt-dlp binary + ffmpeg)

## Getting Started

### Local development

```bash
git clone <repo-url>
cd yt-grab
npm install
npm run dev
```

This starts both the server (port 3000) and the client dev server (port 5173). Open [http://localhost:5173](http://localhost:5173).

`npm install` automatically downloads the yt-dlp binary and installs a bundled ffmpeg.

### Production (Docker)

```bash
docker build -t yt-grab .
docker run -p 3000:3000 yt-grab
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy to Railway

1. Push this repo to GitHub
2. Connect it to [Railway](https://railway.app)
3. Railway auto-detects the Dockerfile and deploys

## Usage

1. Paste a YouTube playlist or video URL into the input field
2. Click **Fetch** to load video info
3. Select which videos to download using the checkboxes
4. Click **Download** and watch progress in real-time
5. Your browser downloads the MP3 file (or a ZIP for playlists)

## Tech Stack

- **Client**: [React](https://react.dev) + [Vite](https://vite.dev) + [Tailwind CSS](https://tailwindcss.com) v4
- **Server**: [Express.js](https://expressjs.com)
- **Download engine**: [yt-dlp](https://github.com/yt-dlp/yt-dlp) + [ffmpeg](https://ffmpeg.org)

## Project Structure

```
yt-grab/
├── client/                        # Vite + React SPA
│   ├── src/
│   │   ├── App.tsx                # Main app with state management
│   │   ├── components/
│   │   │   ├── PlaylistInput.tsx  # URL input + fetch button
│   │   │   ├── VideoList.tsx      # Video list with select all/filter/sort
│   │   │   ├── VideoItem.tsx      # Single video row with preview
│   │   │   └── DownloadBar.tsx    # Download/stop button + progress bar
│   │   └── types/index.ts        # Shared TypeScript types
│   └── public/yt-grab-logo.png
├── server/                        # Express.js API
│   ├── src/
│   │   ├── index.ts               # Entry point (serves client + API)
│   │   ├── routes/
│   │   │   ├── playlist.ts        # Fetch video/playlist metadata
│   │   │   └── download.ts        # Download as MP3/ZIP (SSE progress)
│   │   ├── lib/ytdlp.ts           # yt-dlp wrapper
│   │   └── types/index.ts
│   └── scripts/postinstall.mjs    # Auto-download yt-dlp binary
├── Dockerfile                     # Multi-stage build for deployment
└── package.json                   # Root workspace orchestrator
```

## License

MIT
