import { Router } from "express";
import { fetchVideoInfo } from "../lib/ytdlp.js";

const router = Router();

router.get("/", async (req, res) => {
  const url = req.query.url as string | undefined;

  if (!url) {
    res.status(400).json({ error: "Missing url parameter" });
    return;
  }

  try {
    const parsed = new URL(url);
    const validHosts = [
      "www.youtube.com",
      "youtube.com",
      "m.youtube.com",
      "youtu.be",
      "music.youtube.com",
    ];
    if (!validHosts.includes(parsed.hostname)) {
      res.status(400).json({ error: "Invalid YouTube URL" });
      return;
    }
  } catch {
    res.status(400).json({ error: "Invalid URL format" });
    return;
  }

  try {
    const info = await fetchVideoInfo(url);
    res.json(info);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch video info";
    res.status(500).json({ error: message });
  }
});

export default router;
