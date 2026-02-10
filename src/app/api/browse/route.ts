import { NextRequest, NextResponse } from "next/server";
import { readdir, mkdir } from "fs/promises";
import { join, dirname, sep } from "path";
import { homedir } from "os";

export async function GET(request: NextRequest) {
  const rawPath = request.nextUrl.searchParams.get("path") || homedir();

  // Normalize path
  const currentPath = rawPath.replace(/\//g, sep);

  try {
    const entries = await readdir(currentPath, { withFileTypes: true });
    const folders = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => ({
        name: e.name,
        path: join(currentPath, e.name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const parent = dirname(currentPath);

    return NextResponse.json({
      current: currentPath,
      parent: parent !== currentPath ? parent : null,
      folders,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Cannot read directory: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { path: dirPath } = await request.json();

  if (!dirPath || typeof dirPath !== "string") {
    return NextResponse.json({ error: "No path provided" }, { status: 400 });
  }

  try {
    await mkdir(dirPath, { recursive: true });
    return NextResponse.json({ created: dirPath });
  } catch (err) {
    return NextResponse.json(
      { error: `Cannot create folder: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 400 }
    );
  }
}
