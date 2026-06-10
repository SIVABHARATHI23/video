const COLUMNS = [
  {
    title: "Video Downloaders",
    links: ["YouTube", "Instagram", "Facebook", "TikTok", "Pinterest"],
  },
  {
    title: "YouTube Guides",
    links: ["YouTube to MP3", "YouTube to MP4", "Shorts Downloader", "Thumbnail Grabber", "Playlist Saver"],
  },
  {
    title: "More Guides",
    links: ["Instagram Reels", "TikTok no Watermark", "Pinterest Video", "Facebook Reels", "Topic"],
  },
  {
    title: "Company",
    links: ["About", "Contact", "Privacy Policy", "Terms of Service", "Chrome Extension"],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-slate-50">
      <div className="container-page py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Vids<span className="text-brand-600">Save</span>
              <span className="text-slate-400">.com</span>
            </span>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              The free all-in-one tool to download videos and audio from your favourite platforms.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-slate-900">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-slate-500 transition hover:text-brand-700">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row">
          <p className="text-xs text-slate-400">All rights reserved © 2026 VidsSave.com</p>
          <p className="text-xs text-slate-400">
            Please download only content you own or have permission to save.
          </p>
        </div>
      </div>
    </footer>
  );
}
