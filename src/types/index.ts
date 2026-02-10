export interface VideoInfo {
  id: string;
  title: string;
  duration: number;
  durationFormatted: string;
  thumbnail: string;
  url: string;
  uploader: string;
}

export interface PlaylistInfo {
  title: string;
  videoCount: number;
  videos: VideoInfo[];
}

export interface DownloadProgress {
  videoId: string;
  title: string;
  status: "queued" | "downloading" | "converting" | "done" | "error";
  progress: number;
  error?: string;
}
