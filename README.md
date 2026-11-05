# NAUX (clone)

**The aux, handled.** A full recreation of [naux.party](https://naux.party): describe the room,
and it plays a set of Hindi/Punjabi party songs that drop straight into the hook — now with
**Spotify-style crossfade mixing**, **mid-set search**, and **custom + imported playlists**.

naux.party itself is closed-source, so this is a clone built from scratch that mirrors its stack
(Next.js on Vercel, YouTube-powered playback).

---

## Features

| Feature | Where | Notes |
|---|---|---|
| "Tell NAUX the room" flow | `/` → Build a set | 3 questions → an ordered set |
| Curated song lists | `/songs`, `/songs/[slug]` | Real official-version YouTube videos + cut points |
| **Play as a crossfaded set** | player bar / set view | Two YouTube players, volumes blended across the join |
| **Crossfade control** | set view slider | 0–12s, Spotify-style volume overlap |
| **Search a song in between** | set view → "Drop a song in" | Insert "Play next" or queue, mid-set |
| **Custom named playlists** | `/playlists` | Create, rename, delete, reorder, play |
| **Add your own song / link** | `/playlists` → Edit | Search the catalog or paste any YouTube link |
| **Import a public YouTube playlist** | `/playlists` → Import | Pulls the playlist's videos (needs API key) |

## How playback & "mixing" works

Every song is the **official version on YouTube**, played through the **YouTube IFrame API**,
trimmed to its best part (a `start`/`end` cut). The "mix 2 songs like Spotify" feature runs
**two YouTube players at once** (`src/components/PlayerProvider.tsx`): as the active track nears its
cut, the next one starts on the idle player and the engine ramps one volume down while the other
comes up — a crossfade, no gap, no dead air. (True DJ beat-matching isn't possible with YouTube
iframes — that needs raw audio files + the Web Audio API.)

### About YouTube ads
This clone does **not** bypass ads, and neither does naux.party — naux's own player says
*"with YouTube Premium there are no ads."* The IFrame player serves ads based on the **viewer's**
account, so Premium users get none. Stripping ads (scraping audio, Invidious/Piped proxies,
injected blockers) violates YouTube's Terms of Service, so it's intentionally not implemented.

## Run it

```bash
npm install
npm run dev -- -p 3100     # http://localhost:3100  (3000 is used by Open WebUI)
```

### Optional: `YOUTUBE_API_KEY`
Without a key, **mid-set search** works against the built-in catalog + pasted YouTube links, but
**full-YouTube search** and **playlist import** need a free YouTube Data API v3 key:

```bash
cp .env.example .env.local
# then set YOUTUBE_API_KEY=... (Google Cloud Console → enable "YouTube Data API v3")
```

## Tech
Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · YouTube IFrame API.
UI is Apple.com-inspired: SF system type, frosted nav, generous whitespace, scroll reveals.

## Reference repos (the "repos" to learn from)
- **naux.party** — closed-source; no public repo (this is a clone).
- **YouTube playback**: [`react-youtube`](https://github.com/tjallingt/react-youtube),
  [`youtube-player`](https://github.com/gajus/youtube-player).
- **Crossfade / audio mixing**: [`howler.js`](https://github.com/goldfire/howler.js),
  [`Tone.js`](https://github.com/Tonejs/Tone.js); for real-audio DJ mixing:
  [`Mixxx`](https://github.com/mixxxdj/mixxx), [`wavesurfer.js`](https://github.com/katspaugh/wavesurfer.js).
- **Apple-style UI**: [adrianhajdin `iphone`](https://github.com/adrianhajdin/iphone) (Apple iPhone
  clone, GSAP/Three.js) and similar apple-website clones.

---
*Demo project. Playback depends on YouTube embedding being allowed for each video.*
