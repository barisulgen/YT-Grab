# yt-grab

Download YouTube videos and playlists as MP3 files. Paste a URL, pick the videos you want, and download — right from your browser.

<img width="432" height="435" alt="yt-grab-logo" src="https://github.com/user-attachments/assets/09ff0f31-2f0d-468e-890e-074ea6c472d6" />

## Features

- **Playlist & single video support** — paste any YouTube URL
- **Video metadata** — titles, thumbnails, durations, uploaders
- **Selective download** — checkboxes with select all / deselect all
- **Filter & sort** — search by title, sort by name or length
- **Video preview** — click any thumbnail to preview inline
- **Real-time progress** — per-video status via server-sent events
- **Playlist ZIP** — multiple videos download as a single ZIP file
- **Stop button** — cancel downloads at any time

## Run it locally

```bash
git clone https://github.com/barisulgen/YT-Grab.git
cd yt-grab
npm install
npm run dev
```
Opens at [localhost:5173](http://localhost:5173). `npm install` auto-downloads yt-dlp and ffmpeg.

<img width="875" height="886" alt="image" src="https://github.com/user-attachments/assets/8bcc9ada-5be9-4f47-ad16-6790e04189ab" />

## How it works

```
Browser (React SPA)
    |
    | fetch /api/playlist?url=...     → video metadata
    | POST  /api/download             → SSE progress stream
    | GET   /api/download/file/:id    → MP3 or ZIP file
    |
Express server (yt-dlp + ffmpeg)
```

1. Client sends a YouTube URL to the server
2. Server runs `yt-dlp` to fetch metadata and returns video info
3. User selects videos and clicks Download
4. Server downloads each video, converts to MP3, streams progress via SSE
5. When done, single videos serve as MP3; playlists get zipped
6. Browser receives the file as a standard download

## Deployment

### Railway (recommended)

1. Fork or push this repo to GitHub
2. Create a new project on [Railway](https://railway.app)
3. Connect your GitHub repo — Railway auto-detects the `Dockerfile`
4. Generate a public domain under **Service Settings > Networking**
5. Done

### Docker

```bash
docker build -t yt-grab .
docker run -p 3000:3000 yt-grab
```

### Local development

```bash
npm install        # installs client + server deps, downloads yt-dlp
npm run dev        # starts server (3000) + client (5173) concurrently
```

The Vite dev server proxies `/api/*` requests to the Express server.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Client | React 19, Vite 6, Tailwind CSS v4, TypeScript |
| Server | Express 5, Node.js 22, TypeScript |
| Download | yt-dlp, ffmpeg |
| Deploy | Docker (multi-stage), Railway |

## Project Structure

```
yt-grab/
├── client/                        # React SPA
│   ├── src/
│   │   ├── App.tsx                # Main app + state management
│   │   ├── components/
│   │   │   ├── PlaylistInput.tsx  # URL input + fetch button
│   │   │   ├── VideoList.tsx      # Video list with filter/sort
│   │   │   ├── VideoItem.tsx      # Video row with inline preview
│   │   │   └── DownloadBar.tsx    # Download/stop + progress bar
│   │   └── types/index.ts
│   └── public/yt-grab-logo.png
├── server/                        # Express API
│   ├── src/
│   │   ├── index.ts               # Entry point (API + static files)
│   │   ├── routes/
│   │   │   ├── playlist.ts        # GET /api/playlist
│   │   │   └── download.ts        # POST /api/download + GET /api/download/file/:id
│   │   ├── lib/ytdlp.ts           # yt-dlp wrapper
│   │   └── types/index.ts
│   └── scripts/postinstall.mjs    # Auto-downloads yt-dlp binary
├── Dockerfile                     # Multi-stage build
├── package.json                   # Root orchestrator
└── README.md
```

## License

MIT
