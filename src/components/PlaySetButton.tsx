"use client";

import type { Song } from "@/data/catalog";
import { usePlayer } from "./PlayerProvider";

export default function PlaySetButton({
  songs,
  label = "Play this as a set",
  index = 0,
}: {
  songs: Song[];
  label?: string;
  index?: number;
}) {
  const { playSet } = usePlayer();
  return (
    <button onClick={() => playSet(songs, index)} className="btn btn-primary">
      ▶ {label}
    </button>
  );
}
