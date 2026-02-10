import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";

export async function POST(request: NextRequest) {
  const { path: folderPath } = await request.json();

  if (!folderPath || typeof folderPath !== "string") {
    return NextResponse.json({ error: "No path provided" }, { status: 400 });
  }

  const platform = process.platform;
  let command: string;
  let args: string[];

  if (platform === "win32") {
    command = "explorer";
    args = [folderPath];
  } else if (platform === "darwin") {
    command = "open";
    args = [folderPath];
  } else {
    command = "xdg-open";
    args = [folderPath];
  }

  execFile(command, args, (err) => {
    if (err && !err.killed) {
      console.error("Failed to open folder:", err.message);
    }
  });

  return NextResponse.json({ ok: true });
}
