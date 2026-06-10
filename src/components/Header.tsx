"use client";

import { useState } from "react";

const NAV: { label: string; items?: string[] }[] = [
  { label: "Home" },
  {
    label: "YouTube",
    items: [
      "YouTube Downloader",
      "YouTube Shorts Downloader",
      "YouTube to MP3",
      "YouTube to MP4",
      "YouTube Thumbnail",
    ],
  },
  {
    label: "Instagram",
    items: [
      "Instagram Video Downloader",
      "Instagram Reels Downloader",
      "Instagram Photo Downloader",
      "Instagram Story Downloader",
    ],
  },
  { label: "Facebook" },
  { label: "TikTok" },
  { label: "Pinterest" },
  { label: "Topic" },
];

interface HeaderProps {
  onHomeClick?: () => void;
}

export default function Header({ onHomeClick }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <a
          href="#"
          onClick={(e) => {
            if (onHomeClick) {
              e.preventDefault();
              onHomeClick();
            }
          }}
          className="flex items-center gap-2"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3v12m0 0l4-4m-4 4l-4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Video<span className="text-brand-600">Harvester</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <div
              key={item.label}
              className="relative"
              onMouseEnter={() => item.items && setOpenMenu(item.label)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <button
                onClick={item.label === "Home" ? onHomeClick : undefined}
                aria-haspopup={item.items ? "menu" : undefined}
                aria-expanded={item.items ? openMenu === item.label : undefined}
                className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-brand-700"
              >
                {item.label}
                {item.items && (
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </button>
              {item.items && openMenu === item.label && (
                <div className="absolute left-0 top-full w-60 rounded-xl border border-slate-100 bg-white p-2 shadow-lg">
                  {item.items.map((sub) => (
                    <a
                      key={sub}
                      href="#downloader"
                      className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                    >
                      {sub}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <button className="btn-ghost">Chrome Extension</button>
          <button className="rounded-full px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            EN
          </button>
        </div>

        <button
          className="rounded-lg p-2 text-slate-600 lg:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
            <path
              d={mobileOpen ? "M6 6l12 12M6 18L18 6" : "M4 7h16M4 12h16M4 17h16"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((item) => (
              <a
                key={item.label}
                href="#downloader"
                onClick={(e) => {
                  setMobileOpen(false);
                  if (item.label === "Home" && onHomeClick) {
                    e.preventDefault();
                    onHomeClick();
                  }
                }}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#downloader"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              Chrome Extension
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
