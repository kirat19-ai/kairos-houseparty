"use client";

import { useState } from "react";
import { usePlaylists, playlistActions } from "@/lib/playlists";
import { usePlayer } from "@/components/PlayerProvider";
import SearchInsert from "@/components/SearchInsert";

export default function PlaylistsPage() {
  const playlists = usePlaylists();
  const { playSet } = usePlayer();

  const [newName, setNewName] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  // import state
  const [importUrl, setImportUrl] = useState("");
  const [importName, setImportName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<{ type: "err" | "ok"; text: string } | null>(null);

  const create = () => {
    if (!newName.trim()) return;
    const id = playlistActions.create(newName);
    setNewName("");
    setExpanded(id);
  };

  const doImport = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const r = await fetch(`/api/playlist?url=${encodeURIComponent(importUrl)}`);
      const data = await r.json();
      if (!r.ok) {
        setImportMsg({ type: "err", text: data.error || "Import failed." });
      } else if (!data.songs?.length) {
        setImportMsg({ type: "err", text: "That playlist had no playable videos." });
      } else {
        const name = importName.trim() || "Imported from YouTube";
        playlistActions.createWithSongs(name, data.songs, "youtube");
        setImportMsg({ type: "ok", text: `Imported ${data.songs.length} songs into “${name}”.` });
        setImportUrl("");
        setImportName("");
      }
    } catch {
      setImportMsg({ type: "err", text: "Something went wrong importing that playlist." });
    } finally {
      setImporting(false);
    }
  };

  return (
    <section className="px-6 pb-40 pt-16">
      <div className="mx-auto max-w-[840px]">
        <p className="t-eyebrow">Your playlists</p>
        <h1 className="mt-3 t-display">Make it yours.</h1>
        <p className="mt-4 max-w-2xl t-sub">
          Build a named playlist, drop in any song or YouTube link, or import a public
          YouTube playlist — then play it as a crossfaded set.
        </p>

        {/* Create + Import */}
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-black/5 bg-[color:var(--bg-elevated)] p-6">
            <h2 className="text-[1.1rem] font-semibold">New playlist</h2>
            <p className="mt-1 text-[0.85rem] text-ink-2">Give it a name, then add songs.</p>
            <div className="mt-4 flex gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && create()}
                placeholder="e.g. Rohan's Sangeet"
                className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[0.9rem] outline-none focus:border-accent"
              />
              <button onClick={create} className="btn btn-primary !py-2.5">Create</button>
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 bg-[color:var(--bg-elevated)] p-6">
            <h2 className="text-[1.1rem] font-semibold">Import from YouTube</h2>
            <p className="mt-1 text-[0.85rem] text-ink-2">Paste any public playlist link.</p>
            <div className="mt-4 space-y-2">
              <input
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                placeholder="https://youtube.com/playlist?list=…"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[0.9rem] outline-none focus:border-accent"
              />
              <div className="flex gap-2">
                <input
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  placeholder="Name it (optional)"
                  className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[0.9rem] outline-none focus:border-accent"
                />
                <button onClick={doImport} disabled={importing} className="btn btn-dark !py-2.5 disabled:opacity-50">
                  {importing ? "Importing…" : "Import"}
                </button>
              </div>
            </div>
            {importMsg && (
              <p className={`mt-3 text-[0.8rem] ${importMsg.type === "err" ? "text-red-600" : "text-green-700"}`}>
                {importMsg.text}
              </p>
            )}
          </div>
        </div>

        {/* Playlists */}
        <div className="mt-12">
          {playlists.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/15 p-10 text-center text-ink-2">
              No playlists yet. Create one above, or import from YouTube.
            </div>
          ) : (
            <ul className="space-y-4">
              {playlists.map((pl) => (
                <li key={pl.id} className="rounded-2xl border border-black/5 bg-white">
                  <div className="flex items-center gap-3 p-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-[1.15rem] font-semibold">{pl.name}</h3>
                        {pl.source === "youtube" && (
                          <span className="rounded-full bg-black/5 px-2 py-0.5 text-[0.65rem] font-medium text-ink-2">YouTube</span>
                        )}
                      </div>
                      <p className="text-[0.8rem] text-ink-2">{pl.songs.length} songs</p>
                    </div>
                    <button
                      onClick={() => pl.songs.length && playSet(pl.songs, 0)}
                      disabled={!pl.songs.length}
                      className="btn btn-primary !px-4 !py-2 !text-[0.85rem] disabled:opacity-40"
                    >▶ Play</button>
                    <button
                      onClick={() => setExpanded(expanded === pl.id ? null : pl.id)}
                      className="btn btn-dark !px-4 !py-2 !text-[0.85rem]"
                    >{expanded === pl.id ? "Done" : "Edit"}</button>
                    <button
                      onClick={() => { const n = prompt("Rename playlist", pl.name); if (n) playlistActions.rename(pl.id, n); }}
                      className="rounded-full p-2 text-ink-2 transition hover:bg-black/5" title="Rename"
                    >✎</button>
                    <button
                      onClick={() => { if (confirm(`Delete “${pl.name}”?`)) playlistActions.remove(pl.id); }}
                      className="rounded-full p-2 text-ink-2 transition hover:bg-black/5" title="Delete"
                    >🗑</button>
                  </div>

                  {expanded === pl.id && (
                    <div className="border-t border-black/5 p-5">
                      <h4 className="t-eyebrow">Add a song or YouTube link</h4>
                      <div className="mt-2">
                        <SearchInsert
                          onPick={(song) => playlistActions.addSong(pl.id, song)}
                          addLabel="Add"
                          placeholder="Search a song, or paste a YouTube link…"
                        />
                      </div>

                      {pl.songs.length > 0 && (
                        <ul className="mt-5 divide-y divide-black/5 rounded-xl border border-black/5">
                          {pl.songs.map((s, i) => (
                            <li key={`${s.yt}-${i}`} className="flex items-center gap-3 px-4 py-2.5">
                              <span className="w-5 text-center text-[0.78rem] text-ink-2">{i + 1}</span>
                              <img src={`https://i.ytimg.com/vi/${s.yt}/default.jpg`} alt="" className="h-8 w-12 rounded object-cover" />
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-[0.88rem] font-medium">{s.title}</div>
                                <div className="truncate text-[0.72rem] text-ink-2">{s.artists}</div>
                              </div>
                              <button onClick={() => playSet(pl.songs, i)} className="text-[0.78rem] text-accent hover:underline">Play</button>
                              <button onClick={() => playlistActions.removeSong(pl.id, s.yt)} className="text-ink-2 hover:text-ink" title="Remove">✕</button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
