import type { Metadata } from "next";
import { Inter, Anton } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VideoHarvester — Free All-in-One Video Downloader",
  description:
    "Download videos from YouTube, Instagram, Facebook, TikTok and Pinterest for free. Paste a link, pick a quality and save MP4 or MP3 to any device.",
  icons: {
    icon: "/favicon.png",
  },
  keywords: [
    "video downloader",
    "youtube downloader",
    "instagram downloader",
    "tiktok downloader",
    "facebook downloader",
    "mp4",
    "mp3",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${anton.variable} scroll-smooth`}>
      <body className="min-h-screen bg-white text-slate-900">{children}</body>
    </html>
  );
}
