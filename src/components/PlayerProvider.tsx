"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPlayer, YTPlayer, YT_STATE } from "@/lib/youtube";
import type { Song } from "@/data/catalog";

type Slot = "a" | "b";

interface PlayerState {
  queue: Song[];
  index: number;
  isPlaying: boolean;
  ready: boolean;
  fadeSec: number;
  t: number; // current time in the active cut
  cutStart: number;
  cutEnd: number;
  activeSlot: Slot;
  aVol: number;
  bVol: number;
}

interface PlayerApi extends PlayerState {
  current: Song | null;
  attachSlot: (slot: Slot, el: HTMLElement | null) => void;
  playSet: (songs: Song[], index?: number) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  jumpTo: (i: number) => void;
  insertNext: (song: Song) => void;
  appendSong: (song: Song) => void;
  removeAt: (i: number) => void;
  setFadeSec: (n: number) => void;
}

const Ctx = createContext<PlayerApi | null>(null);
export const usePlayer = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePlayer must be used within PlayerProvider");
  return c;
};

const TICK_MS = 150;

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Song[]>([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [fadeSec, setFadeSec] = useState(6);
  const [t, setT] = useState(0);
  const [activeSlot, setActiveSlot] = useState<Slot>("a");
  const [aVol, setAVol] = useState(100);
  const [bVol, setBVol] = useState(0);

  // refs
  const playersRef = useRef<Record<Slot, YTPlayer | null>>({ a: null, b: null });
  const readyRef = useRef<Record<Slot, boolean>>({ a: false, b: false });
  const queueRef = useRef<Song[]>([]);
  const indexRef = useRef(0);
  const fadeRef = useRef(6);
  const activeRef = useRef<Slot>("a");
  const transitioningRef = useRef(false);
  const rampRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { indexRef.current = index; }, [index]);
  useEffect(() => { fadeRef.current = fadeSec; }, [fadeSec]);
  useEffect(() => { activeRef.current = activeSlot; }, [activeSlot]);

  const setVol = (slot: Slot, v: number) => {
    const clamped = Math.max(0, Math.min(100, v));
    try { playersRef.current[slot]?.setVolume(clamped); } catch {}
    if (slot === "a") setAVol(clamped); else setBVol(clamped);
  };

  // ---- create the two players once, into React-detached child nodes ----
  // YT.Player REPLACES its target node, so we hand it a <div> we append
  // ourselves (never one React renders) to avoid removeChild crashes.
  const slotElRef = useRef<Record<Slot, HTMLElement | null>>({ a: null, b: null });
  const createdRef = useRef(false);

  const tryCreate = useCallback(() => {
    if (createdRef.current) return;
    const ea = slotElRef.current.a;
    const eb = slotElRef.current.b;
    if (!ea || !eb) return;
    createdRef.current = true;

    const mk = (slot: Slot, host: HTMLElement) => {
      const target = document.createElement("div");
      target.style.width = "100%";
      target.style.height = "100%";
      host.appendChild(target);
      createPlayer(
        target,
        (p) => {
          playersRef.current[slot] = p;
          readyRef.current[slot] = true;
          try { p.setVolume(slot === "a" ? 100 : 0); } catch {}
          if (readyRef.current.a && readyRef.current.b) setReady(true);
        },
        (state) => {
          if (slot !== activeRef.current) return;
          if (state === YT_STATE.PLAYING) setIsPlaying(true);
          if (state === YT_STATE.PAUSED || state === YT_STATE.ENDED) setIsPlaying(false);
        },
      );
    };
    mk("a", ea);
    mk("b", eb);
  }, []);

  const attachSlot = useCallback(
    (slot: Slot, el: HTMLElement | null) => {
      if (el && slotElRef.current[slot] !== el) {
        slotElRef.current[slot] = el;
        tryCreate();
      }
    },
    [tryCreate],
  );

  const current = queue[index] ?? null;
  const cutStart = current?.start ?? 0;
  const cutEnd = current?.end ?? 0;

  // ---- crossfade into the next track ----
  const startCrossfade = useCallback(() => {
    if (transitioningRef.current) return;
    const q = queueRef.current;
    const i = indexRef.current;
    const nextSong = q[i + 1];
    if (!nextSong) return;

    const active = activeRef.current;
    const idle: Slot = active === "a" ? "b" : "a";
    const ip = playersRef.current[idle];
    const ap = playersRef.current[active];
    if (!ip || !ap) return;

    transitioningRef.current = true;
    const fade = Math.max(0.01, fadeRef.current);

    try {
      ip.loadVideoById({ videoId: nextSong.yt, startSeconds: nextSong.start, endSeconds: nextSong.end });
      ip.setVolume(0);
      ip.playVideo();
    } catch {}

    const steps = Math.max(1, Math.round((fade * 1000) / 50));
    let step = 0;
    if (rampRef.current) clearInterval(rampRef.current);
    rampRef.current = setInterval(() => {
      step++;
      // equal-power-ish fade
      const p = Math.min(1, step / steps);
      setVol(active, Math.round(100 * (1 - p)));
      setVol(idle, Math.round(100 * p));
      if (p >= 1) {
        if (rampRef.current) clearInterval(rampRef.current);
        rampRef.current = null;
        try { ap.pauseVideo(); } catch {}
        setVol(active, 0);
        setVol(idle, 100);
        activeRef.current = idle;
        setActiveSlot(idle);
        setIndex((n) => n + 1);
        transitioningRef.current = false;
      }
    }, 50);
  }, []);

  // ---- main tick: watch the cut, fire crossfade, update progress ----
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      const active = activeRef.current;
      const p = playersRef.current[active];
      if (!p) return;
      let cur = 0;
      try { cur = p.getCurrentTime(); } catch { return; }
      setT(cur);

      const q = queueRef.current;
      const i = indexRef.current;
      const song = q[i];
      if (!song) return;
      const remaining = song.end - cur;
      const hasNext = !!q[i + 1];

      if (!transitioningRef.current && hasNext && remaining <= Math.max(0.3, fadeRef.current)) {
        startCrossfade();
      }
      // last song, let it run to the cut then stop
      if (!transitioningRef.current && !hasNext && remaining <= 0.25) {
        try { p.pauseVideo(); } catch {}
      }
    }, TICK_MS);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [startCrossfade]);

  // ---- public actions ----
  const playSet = useCallback((songs: Song[], startIndex = 0) => {
    if (!songs.length) return;
    if (rampRef.current) { clearInterval(rampRef.current); rampRef.current = null; }
    transitioningRef.current = false;
    setQueue(songs);
    queueRef.current = songs;
    const i = Math.max(0, Math.min(startIndex, songs.length - 1));
    setIndex(i);
    indexRef.current = i;

    const active: Slot = "a";
    activeRef.current = active;
    setActiveSlot(active);
    const song = songs[i];

    const go = () => {
      const ap = playersRef.current.a;
      const bp = playersRef.current.b;
      if (!ap || !bp) { setTimeout(go, 120); return; }
      try {
        bp.pauseVideo();
        ap.loadVideoById({ videoId: song.yt, startSeconds: song.start, endSeconds: song.end });
        setVol("a", 100);
        setVol("b", 0);
        ap.playVideo();
        setIsPlaying(true);
      } catch {}
    };
    go();
  }, []);

  const togglePlay = useCallback(() => {
    const active = activeRef.current;
    const p = playersRef.current[active];
    if (!p) return;
    try {
      if (isPlaying) {
        p.pauseVideo();
        if (transitioningRef.current) playersRef.current[active === "a" ? "b" : "a"]?.pauseVideo();
        setIsPlaying(false);
      } else {
        p.playVideo();
        if (transitioningRef.current) playersRef.current[active === "a" ? "b" : "a"]?.playVideo();
        setIsPlaying(true);
      }
    } catch {}
  }, [isPlaying]);

  // hard switch to an arbitrary index on the active slot (used by next/prev/jump)
  const jumpTo = useCallback((i: number) => {
    const q = queueRef.current;
    if (i < 0 || i >= q.length) return;
    if (rampRef.current) { clearInterval(rampRef.current); rampRef.current = null; }
    transitioningRef.current = false;
    const active = activeRef.current;
    const p = playersRef.current[active];
    const idle: Slot = active === "a" ? "b" : "a";
    const song = q[i];
    try {
      playersRef.current[idle]?.pauseVideo();
      setVol(idle, 0);
      setVol(active, 100);
      p?.loadVideoById({ videoId: song.yt, startSeconds: song.start, endSeconds: song.end });
      p?.playVideo();
      setIsPlaying(true);
    } catch {}
    setIndex(i);
    indexRef.current = i;
  }, []);

  const next = useCallback(() => jumpTo(indexRef.current + 1), [jumpTo]);
  const prev = useCallback(() => jumpTo(indexRef.current - 1), [jumpTo]);

  const insertNext = useCallback((song: Song) => {
    setQueue((q) => {
      const copy = [...q];
      copy.splice(indexRef.current + 1, 0, song);
      queueRef.current = copy;
      return copy;
    });
  }, []);

  const appendSong = useCallback((song: Song) => {
    setQueue((q) => {
      const copy = [...q, song];
      queueRef.current = copy;
      return copy;
    });
  }, []);

  const removeAt = useCallback((i: number) => {
    setQueue((q) => {
      if (i === indexRef.current) return q; // don't remove the playing track
      const copy = q.filter((_, idx) => idx !== i);
      queueRef.current = copy;
      if (i < indexRef.current) {
        const ni = indexRef.current - 1;
        setIndex(ni);
        indexRef.current = ni;
      }
      return copy;
    });
  }, []);

  const api: PlayerApi = useMemo(
    () => ({
      queue, index, isPlaying, ready, fadeSec, t, cutStart, cutEnd,
      activeSlot, aVol, bVol, current, attachSlot,
      playSet, togglePlay, next, prev, jumpTo, insertNext, appendSong,
      removeAt, setFadeSec,
    }),
    [queue, index, isPlaying, ready, fadeSec, t, cutStart, cutEnd, activeSlot, aVol, bVol, current,
      attachSlot, playSet, togglePlay, next, prev, jumpTo, insertNext, appendSong, removeAt],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
