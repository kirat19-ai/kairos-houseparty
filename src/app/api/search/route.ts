import { NextRequest, NextResponse } from "next/server";
import { SONGS, type Song } from "@/data/catalog";

// Extract an 11-char YouTube id from a raw id or any youtube url.
function extractYouTubeId(q: string): string | null {
  const trimmed = q.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const m = trimmed.match(
    /(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

function localMatches(q: string): Song[] {
  const needle = q.toLowerCase();
  return SONGS.filter(
    (s) =>
      s.title.toLowerCase().includes(needle) ||
      s.artists.toLowerCase().includes(needle),
  );
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!q) return NextResponse.json({ results: [], youtubeEnabled: !!process.env.YOUTUBE_API_KEY });

  const results: Song[] = [];
  const seen = new Set<string>();
  const push = (s: Song) => {
    if (seen.has(s.yt)) return;
    seen.add(s.yt);
    results.push(s);
  };

  // 1) Direct paste of a YouTube link / id.
  const direct = extractYouTubeId(q);
  if (direct) {
    push({
      id: `yt-${direct}`,
      title: "YouTube video",
      artists: "Pasted link",
      year: 0,
      yt: direct,
      start: 0,
      end: 120,
      lang: "",
      subtype: "",
      tags: [],
      energy: 0,
    });
  }

  // 2) Curated catalog (always available, no key needed).
  for (const s of localMatches(q)) push(s);

  // 3) YouTube Data API (music category) when a key is configured.
  const key = process.env.YOUTUBE_API_KEY;
  if (key) {
    try {
      const url =
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video` +
        `&videoCategoryId=10&maxResults=8&q=${encodeURIComponent(q)}&key=${key}`;
      const r = await fetch(url, { next: { revalidate: 3600 } });
      if (r.ok) {
        const data = await r.json();
        for (const item of data.items ?? []) {
          const vid = item.id?.videoId;
          if (!vid) continue;
          push({
            id: `yt-${vid}`,
            title: decodeHtml(item.snippet?.title ?? "Untitled"),
            artists: decodeHtml(item.snippet?.channelTitle ?? "YouTube"),
            year: 0,
            yt: vid,
            start: 0,
            end: 120,
            lang: "",
            subtype: "",
            tags: [],
            energy: 0,
          });
        }
      }
    } catch {
      // ignore, fall back to local results
    }
  }

  return NextResponse.json({ results, youtubeEnabled: !!key });
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
