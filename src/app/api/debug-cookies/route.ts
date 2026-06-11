import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const diagnostics: any = {
    envExists: !!process.env.YOUTUBE_COOKIES,
    envLength: process.env.YOUTUBE_COOKIES ? process.env.YOUTUBE_COOKIES.length : 0,
    cwd: process.cwd(),
    tmpDir: os.tmpdir(),
  };

  // Check local cookies.txt file in project root
  const localPath = path.join(process.cwd(), "cookies.txt");
  try {
    await fs.access(localPath);
    const stat = await fs.stat(localPath);
    diagnostics.localFile = {
      exists: true,
      size: stat.size,
    };
  } catch {
    diagnostics.localFile = { exists: false };
  }

  // Check temp file generated from environment variable
  const tempPath = path.join(os.tmpdir(), "ytdlp-cookies.txt");
  try {
    await fs.access(tempPath);
    const stat = await fs.stat(tempPath);
    const content = await fs.readFile(tempPath, "utf-8");
    diagnostics.tempFile = {
      exists: true,
      size: stat.size,
      startsWithNetscape: content.startsWith("# Netscape HTTP Cookie File"),
      lineCount: content.split("\n").length,
      firstLinePreview: content.split("\n")[0] || "",
      secondLinePreview: content.split("\n")[1] || "",
    };
  } catch {
    diagnostics.tempFile = { exists: false };
  }

  // Run a quick test command with yt-dlp version check
  try {
    const version = await new Promise<string>((resolve, reject) => {
      const bin = process.env.YT_DLP_PATH || "yt-dlp";
      const child = spawn(bin, ["--version"]);
      let out = "";
      child.stdout.on("data", (d) => (out += d.toString()));
      child.on("close", (code) => (code === 0 ? resolve(out.trim()) : reject(new Error(`Exit ${code}`))));
      child.on("error", reject);
    });
    diagnostics.ytdlpVersion = version;
  } catch (err: any) {
    diagnostics.ytdlpError = err.message;
  }

  return NextResponse.json(diagnostics);
}
