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
  tbr?: number | null;
}

interface RawThumbnail {
  url: string;
  width?: number;
  height?: number;
  preference?: number;
}

interface RawInfo {
  title?: string;
  thumbnail?: string;
  thumbnails?: RawThumbnail[];
  duration?: number;
  uploader?: string;
  webpage_url?: string;
  formats?: RawFormat[];
}

/** Pick the largest available thumbnail/image URL. */
function bestImage(raw: RawInfo): string | null {
  const list = raw.thumbnails || [];
  if (list.length) {
    const sorted = [...list].sort(
      (a, b) => (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0),
    );
    if (sorted[0]?.url) return sorted[0].url;
  }
  return raw.thumbnail || null;
}

/** Fetch metadata + a curated list of downloadable formats for a URL. */
export async function getVideoInfo(url: string): Promise<VideoInfo> {
  const args = [
    "-J",
    "--no-warnings",
    "--no-playlist",
    "--ignore-no-formats-error",
  ];

  // Auto-detect cookies.txt in project root to bypass YouTube blockages
  const cookiesPath = path.join(process.cwd(), "cookies.txt");
  try {
    await fs.access(cookiesPath);
    args.push("--cookies", cookiesPath);
  } catch {
    // No cookies.txt found
  }

  args.push(url);
  const stdout = await runYtDlp(args);
  const raw = JSON.parse(stdout) as RawInfo;

  const image = bestImage(raw);
  const formats = curateFormats(raw.formats || [], image);

  if (formats.length === 0) {
    throw new Error(
      "No downloadable video or image was found at that link. It may be private, " +
        "removed, or a type of post this tool doesn't support.",
    );
  }

  return {
    title: raw.title || "Untitled",
    thumbnail: image,
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
/** Best candidate among formats: prefer H.264 (avc1) for fast copy, then bitrate. */
function pickBest(list: RawFormat[]): RawFormat | undefined {
  return [...list].sort((a, b) => {
    const aAvc = (a.vcodec || "").startsWith("avc1") ? 1 : 0;
    const bAvc = (b.vcodec || "").startsWith("avc1") ? 1 : 0;
    if (aAvc !== bAvc) return bAvc - aAvc;
    return (b.tbr || 0) - (a.tbr || 0);
  })[0];
}

const sizeOf = (f: RawFormat) => f.filesize ?? f.filesize_approx ?? null;

const VIDEO_EXTS = ["mp4", "mov", "m4v", "mkv"];

/**
 * Is this a video format? True when it has a real video codec, OR when the codec
 * is unknown (null) but it's a video container — Facebook's sd/hd come back with
 * vcodec/acodec null and ext "mp4", and must NOT be treated as audio-only.
 */
function isVideoFormat(f: RawFormat): boolean {
  if (f.vcodec && f.vcodec !== "none") return true;
  if (f.vcodec == null && VIDEO_EXTS.includes((f.ext || "").toLowerCase())) return true;
  return false;
}

function curateFormats(raw: RawFormat[], image: string | null): VideoFormat[] {
  const out: VideoFormat[] = [];

  const videoFormats = raw.filter(isVideoFormat);
  const withHeight = videoFormats.filter((f) => f.height);
  const heights = Array.from(new Set(withHeight.map((f) => f.height as number))).sort(
    (a, b) => b - a,
  );

  for (const h of heights) {
    const atHeight = withHeight.filter((f) => f.height === h);
    // A progressive format already contains audio → no ffmpeg merge needed (fast).
    const progressive = pickBest(atHeight.filter((f) => f.acodec && f.acodec !== "none"));

    if (progressive) {
      out.push({
        formatId: progressive.format_id,
        ext: "mp4",
        qualityLabel: `${h}p`,
        height: h,
        filesize: sizeOf(progressive),
        audioOnly: false,
        image: false,
        note: "video + audio",
      });
    } else {
      // Video-only: merge with the best m4a audio (stream-copy into mp4, fast).
      const vo = pickBest(atHeight)!;
      out.push({
        formatId: `${vo.format_id}+bestaudio[ext=m4a]/bestaudio/best`,
        ext: "mp4",
        qualityLabel: `${h}p`,
        height: h,
        filesize: sizeOf(vo),
        audioOnly: false,
        image: false,
        note: "video + audio (merged)",
      });
    }
  }

  // Fallback for sites that report no height/codec (e.g. Facebook's sd/hd, which
  // are progressive video+audio). Without this they'd be dropped and only an
  // audio option would remain — causing "audio only" downloads.
  if (out.length === 0 && videoFormats.length) {
    const labels: Record<string, string> = { hd: "HD", sd: "SD" };
    const rank: Record<string, number> = { hd: 2, sd: 1 };
    const sorted = [...videoFormats].sort(
      (a, b) => (rank[b.format_id] || 0) - (rank[a.format_id] || 0),
    );
    const seen = new Set<string>();
    for (const f of sorted) {
      const label = labels[f.format_id] || f.format_note || f.format_id.toUpperCase();
      if (seen.has(label)) continue;
      seen.add(label);
      out.push({
        formatId: f.format_id,
        ext: "mp4",
        qualityLabel: label,
        height: f.height ?? null,
        filesize: sizeOf(f),
        audioOnly: false,
        image: false,
        note: "video + audio",
      });
    }
  }

  const hasAudio = raw.some((f) => f.acodec && f.acodec !== "none");

  // Offer an audio-only MP3 option only when real media exists.
  if (videoFormats.length || hasAudio) {
    out.push({
      formatId: "bestaudio/best",
      ext: "mp3",
      qualityLabel: "Audio (MP3)",
      height: null,
      filesize: null,
      audioOnly: true,
      image: false,
      note: "best available audio",
    });
  }

  // No playable media but there's a picture (e.g. an image pin/photo post):
  // offer the image itself as a download.
  if (out.length === 0 && image) {
    out.push({
      formatId: "image",
      ext: "jpg",
      qualityLabel: "Image (JPG)",
      height: null,
      filesize: null,
      audioOnly: false,
      image: true,
      note: "full-resolution photo",
    });
  }

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
  // --concurrent-fragments downloads DASH/HLS fragments in parallel (big speedup).
  const args: string[] = [
    "--no-warnings",
    "--no-playlist",
    "--concurrent-fragments",
    "5",
    "-o",
    template,
  ];

  if (FFMPEG_LOCATION) args.push("--ffmpeg-location", FFMPEG_LOCATION);

  if (asMp3) {
    args.push("-f", "bestaudio/best", "-x", "--audio-format", "mp3");
  } else {
    args.push("-f", formatId, "--merge-output-format", "mp4");
  }

  // Auto-detect cookies.txt in project root
  const cookiesPath = path.join(process.cwd(), "cookies.txt");
  try {
    await fs.access(cookiesPath);
    args.push("--cookies", cookiesPath);
  } catch {
    // No cookies.txt found
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

/**
 * Download the image/photo for an image-only post (e.g. a Pinterest pin) by
 * writing its thumbnail through yt-dlp and converting it to JPG. Reusing yt-dlp
 * keeps us on one trusted code path (no arbitrary server-side URL fetching).
 * Resolves with the absolute path of the produced image.
 */
export async function downloadImageToFile(url: string, destDir: string): Promise<string> {
  const template = "thumbnail:" + path.join(destDir, "media.%(ext)s");
  const args = ["--no-warnings", "--no-playlist", "--ignore-no-formats-error",
    "--skip-download", "--write-thumbnail", "--convert-thumbnails", "jpg"];
  if (FFMPEG_LOCATION) args.push("--ffmpeg-location", FFMPEG_LOCATION);

  // Auto-detect cookies.txt in project root
  const cookiesPath = path.join(process.cwd(), "cookies.txt");
  try {
    await fs.access(cookiesPath);
    args.push("--cookies", cookiesPath);
  } catch {
    // No cookies.txt found
  }

  args.push("-o", template, url);

  await new Promise<void>((resolve, reject) => {
    const child = spawn(YT_DLP_BIN, args, { windowsHide: true });
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("Image download timed out."));
    }, 120_000);
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
      // yt-dlp may exit non-zero due to "no formats" even though the thumbnail
      // was written, so we don't hard-fail on the code here.
      resolve();
    });
  });

  const produced = (await fs.readdir(destDir)).find((f) => f.startsWith("media."));
  if (!produced) throw new Error(cleanError("") || "Could not download the image.");
  return path.join(destDir, produced);
}
