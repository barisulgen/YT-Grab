import { NextRequest, NextResponse } from "next/server";
import { fetchVideoInfo } from "@/lib/ytdlp";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Basic YouTube URL validation
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
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
  }

  try {
    const info = await fetchVideoInfo(url);
    return NextResponse.json(info);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch video info";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
