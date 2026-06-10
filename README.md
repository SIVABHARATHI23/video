# VidsSave — Free Video Downloader (clone)

A working clone of a vidssave.com-style "all video downloader". Paste a link from
YouTube, Instagram, Facebook, TikTok or Pinterest, pick a quality, and download
the file as **MP4** (video) or **MP3** (audio).

Built with **Next.js 14 + TypeScript + Tailwind CSS**. The actual downloading is
powered by **[yt-dlp](https://github.com/yt-dlp/yt-dlp)** + **ffmpeg** running on
the server.

> ⚖️ **Please use responsibly.** Only download videos you own or have permission
> to save. Downloading copyrighted content may violate the source platform's
> Terms of Service and local law.

---

## 1. Requirements

| Tool    | Why it's needed                          | Already installed on this PC |
| ------- | ---------------------------------------- | ---------------------------- |
| Node.js | Runs the website (v18+; v20 recommended) | ✅ v20                        |
| yt-dlp  | Fetches video info & downloads files     | ✅ 2026.05                    |
| ffmpeg  | Merges video+audio and makes MP3         | ✅ 7.1.1                      |

Both `yt-dlp` and `ffmpeg` were detected on this machine, so it works out of the box.

### Installing yt-dlp / ffmpeg on another machine

**Windows (with [winget](https://learn.microsoft.com/windows/package-manager/)):**

```powershell
winget install yt-dlp.yt-dlp
winget install Gyan.FFmpeg
```

**macOS (with [Homebrew](https://brew.sh)):**

```bash
brew install yt-dlp ffmpeg
```

If they are installed but not on your `PATH`, point the app at them with
environment variables (see [Configuration](#4-configuration)).

---

## 2. Run it

```bash
# install dependencies (only the first time)
npm install

# development mode (hot reload) — http://localhost:3000
npm run dev

# OR production mode
npm run build
npm run start
```

Then open **http://localhost:3000**, paste a video link, and press **Download**.

> If port 3000 is busy, start on another port: `PORT=3210 npm run start`
> (PowerShell: `$env:PORT=3210; npm run start`).

---

## 3. How it works

```
Browser (Downloader.tsx)
   │  paste link → POST /api/info
   ▼
/api/info  ──►  yt-dlp -J <url>   → returns title, thumbnail, quality list
   │
   │  click a quality → GET /api/download?url=…&format=…&mp3=…
   ▼
/api/download ──► yt-dlp downloads to a temp file (ffmpeg merges / makes MP3)
                  → streams the file back as an attachment → temp file deleted
```

- **`src/components/Downloader.tsx`** — the search box + results UI (client side).
- **`src/app/api/info/route.ts`** — analyzes a link and returns available formats.
- **`src/app/api/download/route.ts`** — downloads the chosen format and streams it.
- **`src/lib/ytdlp.ts`** — all the yt-dlp logic (format curation, platform detection,
  temp-file download). Video is written to a temp file first because MP4 muxing
  needs seekable output and cannot be piped directly.

---

## 4. Configuration

Optional environment variables (create a `.env.local` file in the project root):

```bash
# Only needed if yt-dlp / ffmpeg are NOT on your PATH
YT_DLP_PATH=C:\tools\yt-dlp.exe
FFMPEG_PATH=C:\tools\ffmpeg\bin
```

Keep yt-dlp current (sites change often): `yt-dlp -U`.

---

## 5. Project structure

```
src/
  app/
    layout.tsx            # fonts + metadata
    page.tsx              # assembles all sections
    globals.css           # Tailwind + design tokens (white / blue theme)
    api/
      info/route.ts       # POST: analyze a link
      download/route.ts   # GET: download a chosen format
  components/
    Header.tsx            # nav + dropdowns + mobile menu
    Hero.tsx + Downloader.tsx   # headline + the interactive downloader
    Platforms.tsx         # supported-platforms strip
    Features.tsx          # "Why choose" grid
    HowToSteps.tsx        # 5-step guide
    PlatformDetails.tsx   # YouTube / Instagram detail cards
    FAQ.tsx               # accordion
    Footer.tsx            # link columns
  lib/ytdlp.ts            # yt-dlp wrapper
  types/index.ts          # shared TypeScript types
```

---

## Notes & limitations

- **UI fidelity:** This was rebuilt from the live site's content and structure
  (no browser-automation extraction was available), so the layout and white/blue
  theme closely match the original but are not guaranteed pixel-identical.
- **Content:** Marketing copy was rewritten in the same structure rather than
  copied verbatim, to avoid reproducing the original site's text.
- **One link at a time**; playlists are intentionally disabled (`--no-playlist`).
- Some platforms require login for private content — those links won't work
  without cookies/auth, which this clone does not implement.
```
