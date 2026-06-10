import { NextRequest, NextResponse } from "next/server";
import { getVideoInfo, isValidUrl } from "@/lib/ytdlp";
import type { VideoInfo } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cache analyze results briefly so re-checking the same link is instant
// instead of spawning yt-dlp again.
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { at: number; data: VideoInfo }>();

export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const url = (body.url || "").trim();
  if (!url) {
    return NextResponse.json({ error: "Please paste a video link." }, { status: 400 });
  }
  if (!isValidUrl(url)) {
    return NextResponse.json(
      { error: "That doesn't look like a valid http(s) link." },
      { status: 400 },
    );
  }

  const cached = cache.get(url);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  try {
    const info = await getVideoInfo(url);
    cache.set(url, { at: Date.now(), data: info });
    return NextResponse.json(info);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not analyze that link.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
