import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import type { Platform, VideoFormat, VideoInfo } from "@/types";

/**
 * Path to the yt-dlp executable. Override with the YT_DLP_PATH env var if it is
 * not on your PATH (e.g. "C:\\tools\\yt-dlp.exe").
 */
export const YT_DLP_BIN = process.env.YT_DLP_PATH || "yt-dlp";

/** Optional path to ffmpeg, forwarded to yt-dlp when merging/extracting audio. */
export const FFMPEG_LOCATION = process.env.FFMPEG_PATH || "";

export function detectPlatform(url: string): Platform {
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("facebook.com") || u.includes("fb.watch")) return "facebook";
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("pinterest.")) return "pinterest";
  return "generic";
}

export function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Run yt-dlp and collect stdout. Rejects with stderr on a non-zero exit. */
function runYtDlp(args: string[], timeoutMs = 60_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(YT_DLP_BIN, args, { windowsHide: true });
    let stdout = "";
    let stderr = "";

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("yt-dlp timed out. The link may be slow or unavailable."));
    }, timeoutMs);

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("error", (err) => {
      clearTimeout(timer);
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        reject(
          new Error(
            "yt-dlp is not installed or not found on PATH. Install it and/or set YT_DLP_PATH.",
          ),
        );
      } else {
        reject(err);
      }
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else reject(new Error(cleanError(stderr) || `yt-dlp exited with code ${code}`));
    });
  });
}

function cleanError(stderr: string): string {
  const line = stderr
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .reverse()
    .find((l) => l.startsWith("ERROR:"));
  return line ? line.replace(/^ERROR:\s*/, "") : stderr.trim().split("\n").pop() || "";
}

interface RawFormat {
  format_id: string;
  ext: string;
  height?: number | null;
  vcodec?: string;
  acodec?: string;
  filesize?: number | null;
  filesize_approx?: number | null;
  format_note?: string;
}

interface RawInfo {
  title?: string;
  thumbnail?: string;
  duration?: number;
  uploader?: string;
  webpage_url?: string;
  formats?: RawFormat[];
}

/** Fetch metadata + a curated list of downloadable formats for a URL. */
export async function getVideoInfo(url: string): Promise<VideoInfo> {
  const stdout = await runYtDlp([
    "-J",
    "--no-warnings",
    "--no-playlist",
    url,
  ]);
  const raw = JSON.parse(stdout) as RawInfo;

  const formats = curateFormats(raw.formats || []);

  return {
    title: raw.title || "Untitled video",
    thumbnail: raw.thumbnail || null,
    duration: raw.duration ?? null,
    uploader: raw.uploader || null,
    platform: detectPlatform(raw.webpage_url || url),
    webpageUrl: raw.webpage_url || url,
    formats,
  };
}

/**
 * Turn yt-dlp's long raw format list into a short, user-friendly menu:
 * a handful of progressive/merged video heights plus a best-audio (MP3) option.
 */
function curateFormats(raw: RawFormat[]): VideoFormat[] {
  const out: VideoFormat[] = [];
  const seenHeights = new Set<number>();

  const videos = raw
    .filter((f) => f.vcodec && f.vcodec !== "none" && f.height)
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  for (const f of videos) {
    const h = f.height as number;
    if (seenHeights.has(h)) continue;
    seenHeights.add(h);
    const videoOnly = !f.acodec || f.acodec === "none";
    out.push({
      formatId: videoOnly ? `${f.format_id}+bestaudio/best` : f.format_id,
      ext: "mp4",
      qualityLabel: `${h}p`,
      height: h,
      filesize: f.filesize ?? f.filesize_approx ?? null,
      audioOnly: false,
      note: videoOnly ? "video + audio (merged)" : "video + audio",
    });
  }

  // Always offer an audio-only MP3 option.
  out.push({
    formatId: "bestaudio/best",
    ext: "mp3",
    qualityLabel: "Audio (MP3)",
    height: null,
    filesize: null,
    audioOnly: true,
    note: "best available audio",
  });

  return out;
}

/**
 * Download a chosen format into `destDir` as a real file (merging video+audio or
 * extracting MP3 when needed). Streaming yt-dlp to stdout cannot mux MP4 because
 * the container needs seekable output, so we write to disk then stream the file.
 * Resolves with the absolute path of the produced file.
 */
export async function downloadToFile(
  url: string,
  formatId: string,
  asMp3: boolean,
  destDir: string,
): Promise<string> {
  const template = path.join(destDir, "media.%(ext)s");
  const args: string[] = ["--no-warnings", "--no-playlist", "-o", template];

  if (FFMPEG_LOCATION) args.push("--ffmpeg-location", FFMPEG_LOCATION);

  if (asMp3) {
    args.push("-f", "bestaudio/best", "-x", "--audio-format", "mp3");
  } else {
    args.push("-f", formatId, "--merge-output-format", "mp4");
  }

  args.push(url);

  await new Promise<void>((resolve, reject) => {
    const child = spawn(YT_DLP_BIN, args, { windowsHide: true });
    let stderr = "";

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("Download timed out."));
    }, 300_000);

    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (err) => {
      clearTimeout(timer);
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        reject(new Error("yt-dlp is not installed or not found on PATH."));
      } else {
        reject(err);
      }
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(cleanError(stderr) || `yt-dlp exited with code ${code}`));
    });
  });

  const produced = (await fs.readdir(destDir)).find((f) => f.startsWith("media."));
  if (!produced) throw new Error("Download finished but no file was produced.");
  return path.join(destDir, produced);
}
