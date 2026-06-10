import { NextRequest } from "next/server";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { downloadToFile, isValidUrl } from "@/lib/ytdlp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeName(name: string): string {
  return (name || "video").replace(/[^\w.\- ]+/g, "_").slice(0, 120).trim() || "video";
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const url = (params.get("url") || "").trim();
  const formatId = params.get("format") || "best";
  const asMp3 = params.get("mp3") === "1";
  const title = safeName(params.get("title") || "video");

  if (!isValidUrl(url)) {
    return new Response("Invalid or missing url parameter.", { status: 400 });
  }

  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "vidssave-"));

  let filePath: string;
  try {
    filePath = await downloadToFile(url, formatId, asMp3, tmpDir);
  } catch (err) {
    await fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    const message = err instanceof Error ? err.message : "Download failed.";
    return new Response(message, { status: 502 });
  }

  const ext = path.extname(filePath) || (asMp3 ? ".mp3" : ".mp4");
  const stat = await fsp.stat(filePath);
  const downloadName = `${title}${ext}`;
  const contentType = asMp3 ? "audio/mpeg" : "video/mp4";

  const nodeStream = fs.createReadStream(filePath);
  // Clean up the temp directory once the file has been fully streamed.
  nodeStream.on("close", () => {
    fsp.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  });

  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new Response(webStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(stat.size),
      "Content-Disposition": `attachment; filename="${downloadName}"`,
      "Cache-Control": "no-store",
    },
  });
}
