# yt-grab

Download YouTube videos and playlists as audio files. Paste a URL, pick the videos you want, and download.

<img width="432" height="435" alt="yt-grab-logo" src="https://github.com/user-attachments/assets/09ff0f31-2f0d-468e-890e-074ea6c472d6" />

## Features

- **Playlist & single video support** — paste any YouTube URL
- **Video metadata** — titles, thumbnails, durations, uploaders
- **Selective download** — checkboxes with select all / deselect all
- **Audio format picker** — MP3, FLAC, WAV, AAC
- **Quality selector** — 128 / 192 / 320 kbps (for lossy formats)
- **Filter & sort** — search by title, sort by name or length
- **Video preview** — click any thumbnail to preview inline
- **Real-time progress** — per-video status via server-sent events
- **Playlist ZIP** — multiple files download as a single ZIP
- **Drag & drop** — drag a YouTube URL onto the page
- **Stop button** — cancel downloads at any time
- **Zero setup** — `npm install` handles everything (yt-dlp + ffmpeg)

## Run it

```bash
git clone https://github.com/barisulgen/YT-Grab.git
cd yt-grab
npm install
npm run dev
```

Opens at [localhost:3000](http://localhost:3000). `npm install` auto-downloads yt-dlp and ffmpeg.

<img width="875" height="886" alt="image" src="https://github.com/user-attachments/assets/8bcc9ada-5be9-4f47-ad16-6790e04189ab" />

## How it works

```
Browser (Next.js)
    |
    | GET  /api/playlist?url=...      → video metadata
    | POST /api/download              → SSE progress stream
    | GET  /api/download/file/:id     → audio file or ZIP
    |
Next.js API routes (yt-dlp + ffmpeg)
```

1. Paste a YouTube URL and click **Fetch**
2. Select videos and choose format/quality
3. Click **Download** — server downloads and converts each video
4. Browser receives the file (MP3/FLAC/WAV/AAC or ZIP for playlists)

## Tech Stack

| | Technology |
|---|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Styling | Tailwind CSS v4 |
| Language | TypeScript |
| Download | yt-dlp + ffmpeg |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                          # Main page
│   ├── layout.tsx                        # Root layout
│   └── api/
│       ├── playlist/route.ts             # Fetch video/playlist metadata
│       └── download/
│           ├── route.ts                  # Download with SSE progress
│           └── file/[id]/route.ts        # Serve completed download
├── components/
│   ├── PlaylistInput.tsx                 # URL input + fetch button
│   ├── VideoList.tsx                     # Video list with filter/sort
│   ├── VideoItem.tsx                     # Video row with inline preview
│   └── DownloadBar.tsx                   # Format/quality + download/stop
├── lib/
│   ├── ytdlp.ts                          # yt-dlp wrapper
│   └── downloads.ts                      # Pending download state
└── types/index.ts
```

## License

MIT
