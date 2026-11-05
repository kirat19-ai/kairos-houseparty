"use client";

import { useState } from "react";
import { usePlayer } from "./PlayerProvider";
import SearchInsert from "./SearchInsert";

function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function Icon({ name }: { name: "play" | "pause" | "prev" | "next" }) {
  const common = { width: 22, height: 22, fill: "currentColor" } as const;
  if (name === "play") return <svg viewBox="0 0 24 24" {...common}><path d="M8 5v14l11-7z" /></svg>;
  if (name === "pause") return <svg viewBox="0 0 24 24" {...common}><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>;
  if (name === "prev") return <svg viewBox="0 0 24 24" {...common}><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" /></svg>;
  return <svg viewBox="0 0 24 24" {...common}><path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z" /></svg>;
}

export default function PlayerBar() {
  const p = usePlayer();
  const [expanded, setExpanded] = useState(false);
  const active = p.current;
  const played = Math.max(0, p.t - p.cutStart);
  const dur = Math.max(0.1, p.cutEnd - p.cutStart);
  const pct = Math.min(100, (played / dur) * 100);

  return (
    <>
      {/* ---- Always-mounted YouTube engine (two stacked slots) ----
           The iframes render at a real 320x180 (YouTube refuses to play
           below ~200px wide); the wrapper clips them to a neat thumbnail. */}
      <div
        className="fixed z-50 overflow-hidden rounded-lg bg-black shadow-lg transition-all duration-500"
        style={
          active
            ? { left: 20, bottom: 13, width: 112, height: 63, opacity: 1 }
            : { left: 0, bottom: 0, width: 112, height: 63, opacity: 0.001, pointerEvents: "none" }
        }
      >
        {(["a", "b"] as const).map((slot) => (
          <div
            key={slot}
            ref={(el) => p.attachSlot(slot, el)}
            className="absolute transition-opacity duration-200"
            style={{
              width: 320,
              height: 180,
              left: (112 - 320) / 2,
              top: (63 - 180) / 2,
              opacity: (slot === "a" ? p.aVol : p.bVol) / 100,
            }}
          />
        ))}
      </div>

      {/* ---- Collapsed bar ---- */}
      <div
        className="nav-blur fixed inset-x-0 bottom-0 z-40 transition-all duration-500"
        style={{
          transform: active && !expanded ? "translateY(0)" : "translateY(110%)",
          opacity: active && !expanded ? 1 : 0,
        }}
      >
        <div className="mx-auto flex h-[76px] max-w-[1024px] items-center gap-4 pl-[150px] pr-6">
          <div className="min-w-0 flex-1">
            <div className="truncate text-[0.92rem] font-semibold">{active?.title}</div>
            <div className="truncate text-[0.76rem] text-ink-2">{active?.artists}</div>
            <div className="mt-1.5 h-[3px] w-full max-w-sm overflow-hidden rounded bg-black/10">
              <div className="h-full rounded bg-accent transition-[width] duration-200" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* crossfade meter */}
          <MixMeter a={p.aVol} b={p.bVol} />

          <div className="flex items-center gap-1 text-ink">
            <button onClick={p.prev} className="rounded-full p-2 transition hover:bg-black/5"><Icon name="prev" /></button>
            <button onClick={p.togglePlay} className="rounded-full p-2 transition hover:bg-black/5">
              <Icon name={p.isPlaying ? "pause" : "play"} />
            </button>
            <button onClick={p.next} className="rounded-full p-2 transition hover:bg-black/5"><Icon name="next" /></button>
          </div>

          <button onClick={() => setExpanded(true)} className="btn btn-dark !px-4 !py-2 !text-[0.82rem]">
            Open set
          </button>
        </div>
      </div>

      {/* ---- Expanded full set view ---- */}
      {active && (
        <div
          className="fixed inset-0 z-[60] overflow-y-auto bg-white transition-all duration-500"
          style={{
            transform: expanded ? "translateY(0)" : "translateY(100%)",
            opacity: expanded ? 1 : 0,
            pointerEvents: expanded ? "auto" : "none",
          }}
        >
          <div className="mx-auto max-w-[1024px] px-6 py-8">
            <div className="flex items-center justify-between">
              <span className="t-eyebrow">Now playing · Tonight&apos;s set</span>
              <button
                onClick={() => setExpanded(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-ink-2 transition hover:bg-black/10"
                aria-label="Close"
              >✕</button>
            </div>

            {/* Now playing hero */}
            <div className="mt-6 flex flex-col gap-7 md:flex-row md:items-center">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black md:w-[420px]">
                <img src={`https://i.ytimg.com/vi/${active.yt}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-4">
                  <div className="eq"><span /><span /><span /><span /></div>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="t-headline">{active.title}</h2>
                <p className="mt-1 text-[1.05rem] text-ink-2">{active.artists}</p>
                <p className="mt-1 text-[0.85rem] text-ink-2">
                  Cut {fmt(active.start)}–{fmt(active.end)} · now at {fmt(p.t)}
                </p>

                <div className="mt-5 flex items-center gap-2">
                  <button onClick={p.prev} className="rounded-full bg-black/5 p-3 transition hover:bg-black/10"><Icon name="prev" /></button>
                  <button onClick={p.togglePlay} className="rounded-full bg-ink p-4 text-white transition hover:bg-black">
                    <Icon name={p.isPlaying ? "pause" : "play"} />
                  </button>
                  <button onClick={p.next} className="rounded-full bg-black/5 p-3 transition hover:bg-black/10"><Icon name="next" /></button>
                </div>

                {/* Crossfade control — the Spotify-style mix */}
                <div className="mt-7 max-w-md">
                  <div className="flex items-center justify-between text-[0.85rem]">
                    <span className="font-medium">Crossfade between songs</span>
                    <span className="text-ink-2">{p.fadeSec === 0 ? "Off" : `${p.fadeSec.toFixed(0)}s`}</span>
                  </div>
                  <input
                    type="range" min={0} max={12} step={1} value={p.fadeSec}
                    onChange={(e) => p.setFadeSec(Number(e.target.value))}
                    className="apple mt-3 w-full"
                  />
                  <div className="mt-2 flex items-center gap-3">
                    <MixMeter a={p.aVol} b={p.bVol} big />
                    <span className="text-[0.78rem] text-ink-2">
                      Two players, volumes blended across the join — no gap, no dead air.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search a song in between */}
            <div className="mt-10">
              <h3 className="t-eyebrow">Drop a song in</h3>
              <p className="mb-3 mt-1 text-[0.9rem] text-ink-2">
                Someone requested a track? Search it and slot it in right after the current song.
              </p>
              <SearchInsert />
            </div>

            {/* Queue */}
            <div className="mt-10">
              <h3 className="t-eyebrow">Up next · {p.queue.length} songs</h3>
              <ul className="mt-3 divide-y divide-black/5 rounded-2xl border border-black/5">
                {p.queue.map((s, i) => (
                  <li
                    key={`${s.id}-${i}`}
                    className={`flex items-center gap-3 px-4 py-3 ${i === p.index ? "bg-accent/5" : ""}`}
                  >
                    <span className="w-6 text-center text-[0.8rem] text-ink-2">
                      {i === p.index ? <span className="eq inline-flex"><span /><span /><span /></span> : i + 1}
                    </span>
                    <img src={`https://i.ytimg.com/vi/${s.yt}/default.jpg`} alt="" className="h-8 w-12 rounded object-cover" />
                    <button onClick={() => p.jumpTo(i)} className="min-w-0 flex-1 text-left">
                      <div className={`truncate text-[0.9rem] ${i === p.index ? "font-semibold text-accent" : "font-medium"}`}>{s.title}</div>
                      <div className="truncate text-[0.74rem] text-ink-2">{s.artists}</div>
                    </button>
                    <span className="text-[0.74rem] text-ink-2">{fmt(s.end - s.start)}</span>
                    {i !== p.index && (
                      <button onClick={() => p.removeAt(i)} className="text-ink-2 transition hover:text-ink" aria-label="Remove">✕</button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MixMeter({ a, b, big = false }: { a: number; b: number; big?: boolean }) {
  const h = big ? 34 : 24;
  const Bar = ({ v, color }: { v: number; color: string }) => (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-end" style={{ height: h }}>
        <div
          className="w-1.5 rounded-full transition-all duration-150"
          style={{ height: `${Math.max(6, (v / 100) * h)}px`, background: color }}
        />
      </div>
    </div>
  );
  return (
    <div className="flex items-end gap-1.5" title="Live mix: A / B">
      <Bar v={a} color="var(--accent)" />
      <Bar v={b} color="#1d1d1f" />
    </div>
  );
}
