const BLOCKS = [
  {
    name: "YouTube Downloader",
    color: "#FF0000",
    text: "Save YouTube videos, Shorts, music, podcasts and full movies in the quality you want — or grab audio-only as MP3.",
    items: [
      "Videos & Shorts",
      "Music & audio (MP3)",
      "Up to 4K resolution",
      "Playlists & channels",
      "Thumbnails",
      "Subtitles",
    ],
  },
  {
    name: "Instagram Downloader",
    color: "#E1306C",
    text: "Keep Instagram Reels, feed videos, photos, stories and carousels without a watermark and in original quality.",
    items: [
      "Reels & videos",
      "Photos & carousels",
      "Stories & highlights",
      "Profile pictures",
      "HD quality",
      "No watermark",
    ],
  },
];

export default function PlatformDetails() {
  return (
    <section className="bg-slate-50 py-16 sm:py-20">
      <div className="container-page grid gap-8 lg:grid-cols-2">
        {BLOCKS.map((b) => (
          <div key={b.name} className="rounded-2xl border border-slate-100 bg-white p-7">
            <div className="flex items-center gap-3">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: b.color }}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7L8 5z" />
                </svg>
              </span>
              <h3 className="text-lg font-bold text-slate-900">{b.name}</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">{b.text}</p>
            <ul className="mt-5 grid grid-cols-2 gap-2">
              {b.items.map((it) => (
                <li key={it} className="flex items-center gap-2 text-sm text-slate-600">
                  <svg className="h-4 w-4 shrink-0 text-brand-600" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {it}
                </li>
              ))}
            </ul>
            <a href="#downloader" className="btn-primary mt-6">
              Try it now
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
