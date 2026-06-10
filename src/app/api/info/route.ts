import { NextRequest, NextResponse } from "next/server";
import { getVideoInfo, isValidUrl } from "@/lib/ytdlp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  try {
    const info = await getVideoInfo(url);
    return NextResponse.json(info);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not analyze that link.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
