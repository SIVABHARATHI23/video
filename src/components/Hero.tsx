import Downloader from "./Downloader";

export default function Hero() {
  return (
    <section
      id="downloader"
      className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 to-white py-16 sm:py-24"
    >
      {/* soft decorative blobs */}
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-32 h-72 w-72 rounded-full bg-purple-200/30 blur-3xl" />

      <div className="container-page relative">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-4 py-1.5 text-xs font-medium text-brand-700 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            100% free · no sign-up · no watermark
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Free All Video Downloader
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-500 sm:text-lg">
            Download videos and music from YouTube, Instagram, Facebook, TikTok and Pinterest.
            Paste a link, choose your quality, and save it in seconds.
          </p>
        </div>

        <div className="mt-10">
          <Downloader />
        </div>
      </div>
    </section>
  );
}
