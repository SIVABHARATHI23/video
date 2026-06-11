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
    const content = await fs.readFile(localPath, "utf-8");
    
    // Parse cookies to check domains and expiry
    const cookiesInfo: any[] = [];
    const lines = content.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 7) {
        const domain = parts[0];
        const expiry = Number(parts[4]);
        const name = parts[5];
        const expired = expiry > 0 && expiry < Math.floor(Date.now() / 1000);
        cookiesInfo.push({
          domain,
          name,
          expiry,
          expiryDate: expiry > 0 ? new Date(expiry * 1000).toISOString() : "never",
          expired,
        });
      }
    }

    diagnostics.localFile = {
      exists: true,
      size: stat.size,
      startsWithNetscape: content.startsWith("# Netscape HTTP Cookie File"),
      lineCount: lines.length,
      firstLinePreview: lines[0] || "",
      secondLinePreview: lines[1] || "",
      cookiesCount: cookiesInfo.length,
      cookies: cookiesInfo,
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

  // Run a test query with yt-dlp using cookies to see stderr
  try {
    const bin = process.env.YT_DLP_PATH || "yt-dlp";
    // Check which cookies file path actually exists
    let testCookiesPath = "";
    try {
      await fs.access(localPath);
      testCookiesPath = localPath;
    } catch {
      try {
        await fs.access(tempPath);
        testCookiesPath = tempPath;
      } catch {}
    }

    if (testCookiesPath) {
      const testResult = await new Promise<any>((resolve) => {
        const args = [
          "-J",
          "--no-warnings",
          "--no-playlist",
          "--ignore-no-formats-error",
          "--impersonate", "chrome",
          "--cookies", testCookiesPath,
          "https://www.youtube.com/watch?v=ScMzIvxBSi4"
        ];
        const child = spawn(bin, args);
        let stdout = "";
        let stderr = "";
        child.stdout.on("data", (d) => (stdout += d.toString()));
        child.stderr.on("data", (d) => (stderr += d.toString()));
        child.on("close", (code) => {
          let formatsCount = 0;
          let formatsPreview: string[] = [];
          let keys: string[] = [];
          let title = "";
          let parseError = "";
          try {
            const parsed = JSON.parse(stdout);
            keys = Object.keys(parsed);
            title = parsed.title || "";
            if (parsed.formats) {
              formatsCount = parsed.formats.length;
              formatsPreview = parsed.formats.map((f: any) => `${f.format_id} (${f.ext})`).slice(0, 5);
            }
          } catch (err: any) {
            parseError = err.message;
          }
          resolve({
            code,
            stderr: stderr.trim(),
            stdoutLength: stdout.length,
            stdoutPreview: stdout.slice(0, 500),
            parseError,
            keys,
            title,
            formatsCount,
            formatsPreview,
          });
        });
        child.on("error", (err) => resolve({ error: err.message }));
      });
      diagnostics.ytDlpCookieTest = testResult;
    } else {
      diagnostics.ytDlpCookieTest = { status: "No cookies path found to test" };
    }
  } catch (err: any) {
    diagnostics.ytDlpCookieTestError = err.message;
  }

  return NextResponse.json(diagnostics);
}
