export type Platform =
  | "youtube"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "pinterest"
  | "generic";

export interface VideoFormat {
  /** yt-dlp format id, used to request the actual download */
  formatId: string;
  /** "mp4", "webm", "m4a", "mp3"… */
  ext: string;
  /** e.g. "1080p", "720p", "audio" */
  qualityLabel: string;
  /** height in px when known */
  height: number | null;
  /** approximate file size in bytes when known */
  filesize: number | null;
  /** true for audio-only formats */
  audioOnly: boolean;
  /** human note such as "video only" or codec info */
  note: string;
}

export interface VideoInfo {
  title: string;
  thumbnail: string | null;
  duration: number | null;
  uploader: string | null;
  platform: Platform;
  webpageUrl: string;
  formats: VideoFormat[];
}

export interface ApiError {
  error: string;
}
