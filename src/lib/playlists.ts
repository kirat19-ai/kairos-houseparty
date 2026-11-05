"use client";

import { useSyncExternalStore } from "react";
import type { Song } from "@/data/catalog";

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
  source: "custom" | "youtube";
  createdAt: number;
}

const KEY = "naux.playlists.v1";

let state: Playlist[] = [];
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = JSON.parse(raw);
  } catch {
    state = [];
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

function emit() {
  persist();
  subs.forEach((f) => f());
}

function set(next: Playlist[]) {
  state = next;
  emit();
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const playlistActions = {
  create(name: string): string {
    load();
    const id = uid();
    set([
      { id, name: name.trim() || "Untitled playlist", songs: [], source: "custom", createdAt: Date.now() },
      ...state,
    ]);
    return id;
  },
  createWithSongs(name: string, songs: Song[], source: Playlist["source"] = "youtube"): string {
    load();
    const id = uid();
    set([
      { id, name: name.trim() || "Imported playlist", songs, source, createdAt: Date.now() },
      ...state,
    ]);
    return id;
  },
  remove(id: string) {
    set(state.filter((p) => p.id !== id));
  },
  rename(id: string, name: string) {
    set(state.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p)));
  },
  addSong(id: string, song: Song) {
    set(
      state.map((p) =>
        p.id === id && !p.songs.some((s) => s.yt === song.yt)
          ? { ...p, songs: [...p.songs, song] }
          : p,
      ),
    );
  },
  removeSong(id: string, yt: string) {
    set(state.map((p) => (p.id === id ? { ...p, songs: p.songs.filter((s) => s.yt !== yt) } : p)));
  },
};

function subscribe(cb: () => void) {
  load();
  subs.add(cb);
  return () => subs.delete(cb);
}

const EMPTY: Playlist[] = [];

export function usePlaylists(): Playlist[] {
  return useSyncExternalStore(
    subscribe,
    () => (loaded ? state : EMPTY),
    () => EMPTY,
  );
}
