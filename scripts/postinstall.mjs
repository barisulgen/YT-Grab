import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const binDir = join(__dirname, "..", "bin");
const platform = process.platform;
const binaryName = platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
const binaryPath = join(binDir, binaryName);

if (existsSync(binaryPath)) {
  console.log(`yt-dlp binary already exists at ${binaryPath}`);
  process.exit(0);
}

console.log("Downloading yt-dlp binary...");

if (!existsSync(binDir)) {
  mkdirSync(binDir, { recursive: true });
}

const mod = await import("yt-dlp-wrap");
const YTDlpWrap = mod.default?.default || mod.default;

try {
  await YTDlpWrap.downloadFromGithub(binaryPath);
  console.log(`yt-dlp downloaded to ${binaryPath}`);
} catch (err) {
  console.error("Failed to download yt-dlp:", err instanceof Error ? err.message : err);
  console.error("You can manually download it from https://github.com/yt-dlp/yt-dlp/releases");
  process.exit(1);
}
