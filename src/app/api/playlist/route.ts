import { NextRequest, NextResponse } from "next/server";
import type { Song } from "@/data/catalog";

function extractPlaylistId(input: string): string | null {
  const t = input.trim();
  const m = t.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  if (/^(PL|UU|LL|FL|OL|RD)[a-zA-Z0-9_-]+$/.test(t)) return t;
  return null;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url") || "";
  const listId = extractPlaylistId(raw);
  if (!listId) {
    return NextResponse.json({ error: "Could not find a playlist id in that link." }, { status: 400 });
  }

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    return NextResponse.json(
      {
        error: "Importing a YouTube playlist needs a YOUTUBE_API_KEY (free). Add one to .env.local.",
        needKey: true,
        listId,
      },
      { status: 400 },
    );
  }

  try {
    const songs: Song[] = [];
    let pageToken = "";
    // up to 100 items (2 pages)
    for (let page = 0; page < 2; page++) {
      const url =
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet` +
        `&maxResults=50&playlistId=${listId}` +
        (pageToken ? `&pageToken=${pageToken}` : "") +
        `&key=${key}`;
      const r = await fetch(url);
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        return NextResponse.json(
          { error: body?.error?.message || "YouTube rejected the playlist request." },
          { status: 400 },
        );
      }
      const data = await r.json();
      for (const item of data.items ?? []) {
        const sn = item.snippet;
        const vid = sn?.resourceId?.videoId;
        if (!vid) continue;
        if (sn.title === "Private video" || sn.title === "Deleted video") continue;
        songs.push({
          id: `yt-${vid}`,
          title: decodeHtml(sn.title ?? "Untitled"),
          artists: decodeHtml(sn.videoOwnerChannelTitle ?? sn.channelTitle ?? "YouTube"),
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
      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
    }

    const title = raw.match(/list=([^&]+)/)?.[1] ?? "YouTube playlist";
    return NextResponse.json({ listId, title, count: songs.length, songs });
  } catch {
    return NextResponse.json({ error: "Failed to import the playlist." }, { status: 500 });
  }
}
