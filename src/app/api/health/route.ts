import { NextResponse } from "next/server";
import { join } from "path";
import { homedir } from "os";
import { checkDependencies } from "@/lib/ytdlp";

export async function GET() {
  const result = await checkDependencies();
  const downloadsPath = join(homedir(), "Downloads");

  return NextResponse.json({
    ready: result.ready,
    dependencies: {
      ytdlp: result.ytdlp,
      ffmpeg: result.ffmpeg,
    },
    downloadsPath,
  });
}
