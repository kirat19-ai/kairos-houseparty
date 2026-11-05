// KAIRO'S HOUSEPARTY — full catalog, sourced from naux.party's public dataset.
// Each song carries its real YouTube id and best-part cut (start/end).
import songsJson from "./songs.json";

export interface Song {
  id: string;
  title: string;
  artists: string;
  year: number;
  yt: string; // YouTube video id
  start: number; // best-part start (seconds)
  end: number; // cut point (seconds)
  lang: string; // hindi | punjabi | english | gujarati | tamil-telugu | ...
  subtype: string; // party | dance | retro | romantic | wedding | gym | ...
  tags: string[];
  energy: number; // 0–10
}

export const SONGS: Song[] = songsJson as Song[];

export const byId = (id: string) => SONGS.find((s) => s.id === id);

// ---- Lists (mirrors naux.party's categories) ----

export interface SongList {
  slug: string;
  title: string;
  blurb: string;
  filter: (s: Song) => boolean;
}

const has = (s: Song, t: string) => s.tags.includes(t);

export const LISTS: SongList[] = [
  { slug: "hindi-dance", title: "Hindi Dance", blurb: "Bollywood dance-floor hits every Indian house party knows.", filter: (s) => s.lang === "hindi" && (s.subtype === "dance" || has(s, "dance")) },
  { slug: "hindi-retro", title: "Hindi Retro", blurb: "The throwbacks that still clear the floor.", filter: (s) => s.lang === "hindi" && s.subtype === "retro" },
  { slug: "hindi-romantic", title: "Hindi Romantic", blurb: "Slow it down without killing the room.", filter: (s) => s.lang === "hindi" && s.subtype === "romantic" },
  { slug: "hindi-sufi", title: "Hindi Sufi", blurb: "Goosebumps-on-the-dancefloor energy.", filter: (s) => s.lang === "hindi" && s.subtype === "sufi" },
  { slug: "hindi-hiphop", title: "Hindi Desi Hip-Hop", blurb: "Desi rap and trap that hits hard.", filter: (s) => s.lang === "hindi" && s.subtype === "hiphop" },
  { slug: "punjabi-party", title: "Punjabi Party", blurb: "The Punjabi anthems that take the roof off.", filter: (s) => s.lang === "punjabi" && s.subtype === "party" },
  { slug: "punjabi-wedding", title: "Punjabi Wedding", blurb: "Sangeet-ready, everyone-on-the-floor tracks.", filter: (s) => s.lang === "punjabi" && (s.subtype === "wedding" || has(s, "wedding")) },
  { slug: "punjabi-sad", title: "Punjabi Sad", blurb: "For when the night turns emotional.", filter: (s) => s.lang === "punjabi" && s.subtype === "sad" },
  { slug: "gym", title: "Gym / Workout", blurb: "Beast-mode bangers for the pump.", filter: (s) => s.subtype === "gym" || has(s, "gym") },
  { slug: "english-pop", title: "English Pop", blurb: "Crossover pop for the mixed crowd.", filter: (s) => s.lang === "english" && s.subtype === "pop" },
  { slug: "english-hiphop", title: "English Hip-Hop", blurb: "Hip-hop to switch up the vibe.", filter: (s) => s.lang === "english" && s.subtype === "hiphop" },
  { slug: "english-edm", title: "English EDM", blurb: "Drops for the peak of the night.", filter: (s) => s.lang === "english" && has(s, "edm") },
  { slug: "garba", title: "Garba & Dandiya", blurb: "Navratri on the floor.", filter: (s) => s.subtype === "garba" || has(s, "garba") },
  { slug: "tamil-telugu", title: "Tamil & Telugu", blurb: "Kuthu and mass beats from the south.", filter: (s) => s.lang === "tamil-telugu" },
  { slug: "diwali", title: "Diwali Party", blurb: "The big festive set — party, wedding and dance across languages.", filter: (s) => has(s, "party") || has(s, "wedding") || has(s, "dance") },
  { slug: "all-party", title: "The Whole Party", blurb: "Every song KAIRO'S HOUSEPARTY knows, in one long set.", filter: () => true },
];

export const listSongs = (slug: string): Song[] => {
  const l = LISTS.find((x) => x.slug === slug);
  return l ? SONGS.filter(l.filter) : [];
};

// ---- "Tell it the room" flow ----

export interface RoomStep {
  id: string;
  question: string;
  options: { value: string; label: string; emoji: string }[];
}

export const ROOM_STEPS: RoomStep[] = [
  {
    id: "crowd",
    question: "What's the room?",
    options: [
      { value: "house", label: "Desi house party", emoji: "🏠" },
      { value: "wedding", label: "Wedding / sangeet", emoji: "💍" },
      { value: "club", label: "Pre-game / club", emoji: "🪩" },
    ],
  },
  {
    id: "lang",
    question: "What do they want to hear?",
    options: [
      { value: "both", label: "Hindi + Punjabi", emoji: "🎶" },
      { value: "hindi", label: "Mostly Hindi", emoji: "🎬" },
      { value: "punjabi", label: "Mostly Punjabi", emoji: "🔥" },
    ],
  },
  {
    id: "energy",
    question: "How hard do we go?",
    options: [
      { value: "max", label: "All gas, no brakes", emoji: "⚡️" },
      { value: "warm", label: "Warm it up first", emoji: "🌊" },
    ],
  },
];

export type RoomAnswers = Record<string, string>;

const PARTY_SUBTYPES = new Set(["party", "dance", "hiphop", "pop"]);
const MAX_SET = 60; // keep a generated set to a manageable night

export function buildSet(answers: RoomAnswers): Song[] {
  let pool = SONGS.filter((s) => s.lang === "hindi" || s.lang === "punjabi");

  if (answers.lang === "hindi") pool = pool.filter((s) => s.lang === "hindi");
  if (answers.lang === "punjabi") pool = pool.filter((s) => s.lang === "punjabi");

  if (answers.crowd === "wedding") {
    pool = pool.filter((s) => s.tags.includes("wedding") || PARTY_SUBTYPES.has(s.subtype) || s.subtype === "romantic");
  } else if (answers.crowd === "club") {
    pool = pool.filter((s) => PARTY_SUBTYPES.has(s.subtype));
  } else {
    pool = pool.filter((s) => PARTY_SUBTYPES.has(s.subtype) || s.tags.includes("party"));
  }

  // Highest-energy first; "warm" climbs from lower energy upward.
  pool.sort((a, b) => b.energy - a.energy || b.year - a.year);
  const top = pool.slice(0, MAX_SET);
  if (answers.energy === "warm") top.reverse();
  return top;
}
