"use client";

import { useEffect, useState } from "react";
import type { VideoInfo, VideoFormat } from "@/types";

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function safeName(name: string): string {
  return (name || "video").replace(/[^\w.\- ]+/g, "_").slice(0, 120).trim() || "video";
}

type Phase = "preparing" | "downloading" | "done" | "error";
interface DownloadState {
  phase: Phase;
  received: number;
  total: number;
  message?: string;
}

const keyOf = (f: VideoFormat) => `${f.formatId}-${f.ext}`;

export default function Downloader() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [downloads, setDownloads] = useState<Record<string, DownloadState>>({});

  // Allow deep-linking / the browser extension to prefill and auto-analyze:
  // e.g. http://localhost:3000/?url=https://youtu.be/xxxx
  useEffect(() => {
    const incoming = new URLSearchParams(window.location.search).get("url");
    if (incoming) {
      setUrl(incoming);
      analyze(undefined, incoming);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function analyze(e?: React.FormEvent, overrideUrl?: string) {
    e?.preventDefault();
    setError("");
    setInfo(null);
    setDownloads({});
    const target = (overrideUrl ?? url).trim();
    if (!target) {
      setError("Please paste a video link first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not analyze that link.");
      } else {
        setInfo(data as VideoInfo);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function downloadHref(f: VideoFormat): string {
    const params = new URLSearchParams({
      url: info!.webpageUrl,
      format: f.formatId,
      title: info!.title,
      mp3: f.audioOnly ? "1" : "0",
    });
    return `/api/download?${params.toString()}`;
  }

  async function startDownload(f: VideoFormat) {
    const key = keyOf(f);
    const set = (s: DownloadState) =>
      setDownloads((d) => ({ ...d, [key]: s }));

    set({ phase: "preparing", received: 0, total: 0 });
    try {
      // While "preparing", the server is running yt-dlp + ffmpeg; the response
      // headers only arrive once the file is ready, then we stream it to the
      // browser tracking bytes for a real progress bar.
      const res = await fetch(downloadHref(f));
      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `Download failed (${res.status}).`);
      }

      const total = Number(res.headers.get("Content-Length")) || 0;
      set({ phase: "downloading", received: 0, total });

      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          set({ phase: "downloading", received, total });
        }
      }

      const blob = new Blob(chunks as BlobPart[], {
        type: f.audioOnly ? "audio/mpeg" : "video/mp4",
      });
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = `${safeName(info!.title)}.${f.audioOnly ? "mp3" : "mp4"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objUrl), 5000);

      set({ phase: "done", received, total: total || received });
    } catch (err) {
      set({
        phase: "error",
        received: 0,
        total: 0,
        message: err instanceof Error ? err.message : "Download failed.",
      });
    }
  }

  async function paste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      /* clipboard not available */
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <form
        onSubmit={analyze}
        className="flex flex-col gap-3 rounded-2xl bg-white p-2 shadow-lg shadow-brand-900/5 ring-1 ring-slate-200 sm:flex-row sm:items-center sm:rounded-full sm:p-2"
      >
        <div className="flex flex-1 items-center gap-2 px-3">
          <svg className="h-5 w-5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none">
            <path
              d="M10 14L21 3m0 0h-6m6 0v6M21 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            type="text"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-label="Video link"
            placeholder="Paste a YouTube, Instagram, TikTok, Facebook or Pinterest link…"
            className="w-full bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={paste}
            className="hidden shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 sm:block"
          >
            Paste
          </button>
        </div>
        <button type="submit" className="btn-primary px-8 py-3.5" disabled={loading}>
          {loading ? (
            <>
              <Spinner /> Analyzing…
            </>
          ) : (
            "Download"
          )}
        </button>
      </form>

      <p className="mt-3 text-center text-xs text-slate-500">
        By using this tool you agree to only download content you have the right to save.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {info && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-4 sm:flex-row">
            {info.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={info.thumbnail}
                alt={info.title}
                className="h-40 w-full rounded-lg object-cover sm:h-28 sm:w-48"
              />
            )}
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 font-semibold text-slate-900">{info.title}</h3>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                {info.uploader && <span>{info.uploader}</span>}
                {info.duration ? <span>{formatDuration(info.duration)}</span> : null}
                <span className="capitalize">{info.platform}</span>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {info.formats.map((f) => (
              <FormatRow
                key={keyOf(f)}
                format={f}
                state={downloads[keyOf(f)]}
                onDownload={() => startDownload(f)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FormatRow({
  format: f,
  state,
  onDownload,
}: {
  format: VideoFormat;
  state?: DownloadState;
  onDownload: () => void;
}) {
  const phase = state?.phase;
  const percent =
    state && state.total > 0
      ? Math.min(100, Math.round((state.received / state.total) * 100))
      : null;

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex h-9 w-14 items-center justify-center rounded-md text-xs font-semibold ${
              f.audioOnly ? "bg-purple-50 text-purple-700" : "bg-brand-50 text-brand-700"
            }`}
          >
            {f.audioOnly ? "MP3" : "MP4"}
          </span>
          <div>
            <div className="text-sm font-medium text-slate-800">{f.qualityLabel}</div>
            <div className="text-xs text-slate-400">
              {[formatBytes(f.filesize), f.note].filter(Boolean).join(" · ")}
            </div>
          </div>
        </div>

        {/* Action button reflects the current phase */}
        {phase === "preparing" && (
          <button className="btn-ghost cursor-default" disabled>
            <Spinner /> Preparing…
          </button>
        )}
        {phase === "downloading" && (
          <button className="btn-ghost cursor-default" disabled>
            <Spinner /> {percent !== null ? `${percent}%` : "Downloading…"}
          </button>
        )}
        {phase === "done" && (
          <button
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-100"
          >
            <CheckIcon /> Completed
          </button>
        )}
        {phase === "error" && (
          <button
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
          >
            Retry
          </button>
        )}
        {!phase && (
          <button onClick={onDownload} className="btn-ghost">
            Download
          </button>
        )}
      </div>

      {/* Status / progress line — announced to screen readers */}
      {phase === "preparing" && (
        <p className="mt-3 text-xs text-slate-500" role="status" aria-live="polite">
          Fetching and processing on the server — this can take a moment for large or
          high-resolution videos…
        </p>
      )}

      {phase === "downloading" && (
        <div
          className="mt-3"
          role="progressbar"
          aria-label={`Downloading ${f.qualityLabel}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent ?? undefined}
        >
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-600 transition-[width] duration-200"
              style={{ width: percent !== null ? `${percent}%` : "100%" }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-slate-500">
            <span>Saving to your device…</span>
            <span>
              {formatBytes(state!.received)}
              {state!.total ? ` / ${formatBytes(state!.total)}` : ""}
            </span>
          </div>
        </div>
      )}

      {phase === "done" && (
        <p className="mt-2 text-xs text-green-700" role="status" aria-live="polite">
          Saved to your downloads folder
          {state!.total ? ` (${formatBytes(state!.total)})` : ""}. Check your browser&apos;s
          downloads if you don&apos;t see it.
        </p>
      )}

      {phase === "error" && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {state!.message}
        </p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
