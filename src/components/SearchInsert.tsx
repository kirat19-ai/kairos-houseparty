"use client";

import { useEffect, useRef, useState } from "react";
import type { Song } from "@/data/catalog";
import { usePlayer } from "./PlayerProvider";

export default function SearchInsert({
  onPick,
  addLabel = "Add",
  placeholder = "Search a song to drop in — or paste a YouTube link",
}: {
  onPick?: (song: Song) => void;
  addLabel?: string;
  placeholder?: string;
} = {}) {
  const { insertNext, appendSong } = usePlayer();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [ytEnabled, setYtEnabled] = useState(true);
  const [added, setAdded] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await r.json();
        setResults(data.results ?? []);
        setYtEnabled(data.youtubeEnabled);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q]);

  const flash = (song: Song) => {
    setAdded(song.yt);
    setTimeout(() => setAdded((a) => (a === song.yt ? null : a)), 1200);
  };

  return (
    <div>
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-2"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-black/10 bg-white py-3 pl-11 pr-4 text-[0.95rem] outline-none transition focus:border-accent"
        />
      </div>

      {!ytEnabled && q.trim() && (
        <p className="mt-2 text-[0.75rem] text-ink-2">
          Searching the built-in catalog. Add a free <code>YOUTUBE_API_KEY</code> to search all of YouTube.
        </p>
      )}

      {q.trim() && (
        <div className="mt-3 max-h-72 overflow-y-auto rounded-2xl border border-black/5">
          {loading && results.length === 0 && (
            <div className="px-4 py-3 text-[0.85rem] text-ink-2">Searching…</div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-[0.85rem] text-ink-2">No matches.</div>
          )}
          {results.map((s) => (
            <div
              key={s.yt}
              className="flex items-center gap-3 border-b border-black/5 px-4 py-2.5 last:border-0"
            >
              <img
                src={`https://i.ytimg.com/vi/${s.yt}/default.jpg`}
                alt=""
                className="h-9 w-14 flex-shrink-0 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[0.9rem] font-medium">{s.title}</div>
                <div className="truncate text-[0.75rem] text-ink-2">{s.artists}</div>
              </div>
              {onPick ? (
                <button
                  onClick={() => { onPick(s); flash(s); }}
                  className="btn btn-primary !px-3 !py-1.5 !text-[0.8rem]"
                >
                  {added === s.yt ? "Added ✓" : addLabel}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { insertNext(s); flash(s); }}
                    className="btn btn-primary !px-3 !py-1.5 !text-[0.8rem]"
                  >
                    {added === s.yt ? "Added ✓" : "Play next"}
                  </button>
                  <button
                    onClick={() => { appendSong(s); flash(s); }}
                    className="text-[0.8rem] text-accent hover:underline"
                  >
                    Queue
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
