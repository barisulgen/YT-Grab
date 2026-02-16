import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import playlistRouter from "./routes/playlist.js";
import downloadRouter from "./routes/download.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/playlist", playlistRouter);
app.use("/api/download", downloadRouter);

// Serve static client files in production
const clientDistPath = path.join(__dirname, "..", "..", "client", "dist");
app.use(express.static(clientDistPath));

// SPA fallback — serve index.html for all non-API routes
app.get("/{*splat}", (_req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`yt-grab server running on port ${PORT}`);
});
