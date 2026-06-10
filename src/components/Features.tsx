const FEATURES = [
  {
    title: "Instant Link Analysis",
    text: "Paste any supported link and the available formats are fetched in seconds — no waiting, no sign-up.",
    icon: "M13 2L3 14h7l-1 8 10-12h-7l1-8z",
  },
  {
    title: "Works on Any Device",
    text: "Phone, tablet, laptop or desktop — the downloader runs right in your browser on every operating system.",
    icon: "M3 5h18v11H3zM8 21h8M12 16v5",
  },
  {
    title: "Wide Platform Support",
    text: "Save videos from YouTube, TikTok, Instagram, Facebook and Pinterest from one simple place.",
    icon: "M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18",
  },
  {
    title: "Flexible Quality Choices",
    text: "Pick exactly what you need, from compact 144p clips all the way up to crisp 4K, or audio-only MP3.",
    icon: "M4 6h16v12H4zM10 9l5 3-5 3V9z",
  },
  {
    title: "Multilingual Experience",
    text: "A clean interface that's easy to use, designed to feel familiar in dozens of languages worldwide.",
    icon: "M4 5h16M9 3v2c0 5-2 9-5 11M5 9c0 3 4 6 9 7M14 21l4-9 4 9M15.5 18h5",
  },
  {
    title: "Privacy-First by Design",
    text: "Links are processed only to fetch your file. We don't ask you to log in or keep your downloads.",
    icon: "M12 3l8 3v6c0 4.5-3.4 7.5-8 9-4.6-1.5-8-4.5-8-9V6l8-3z",
  },
];

export default function Features() {
  return (
    <section className="bg-slate-50 py-16 sm:py-20">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Why Millions Choose VideoHarvester
          </h2>
          <p className="mt-3 text-slate-500">
            One fast, free and friendly tool for every video you want to keep.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-100 bg-white p-6 transition hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                  <path
                    d={f.icon}
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
