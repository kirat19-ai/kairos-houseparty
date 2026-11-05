import Reveal from "@/components/Reveal";
import ListCard from "@/components/ListCard";
import { LISTS, listSongs } from "@/data/catalog";

export const metadata = {
  title: "Song Lists · KAIRO'S HOUSEPARTY",
  description: "Curated Hindi and Punjabi party sets by mood and language.",
};

export default function SongsPage() {
  return (
    <section className="px-6 pb-24 pt-20">
      <div className="mx-auto max-w-[1024px]">
        <Reveal>
          <p className="t-eyebrow">Song lists</p>
          <h1 className="mt-3 t-display">Pick a list. Play it as a set.</h1>
          <p className="mt-4 max-w-2xl t-sub">
            Every song is the official version, trimmed to its best part and crossfaded
            into the next.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {LISTS.map((l, i) => {
            const songs = listSongs(l.slug);
            return (
              <Reveal key={l.slug} delay={i * 50}>
                <ListCard
                  slug={l.slug}
                  title={l.title}
                  blurb={l.blurb}
                  count={songs.length}
                  thumbs={songs.slice(0, 4).map((s) => s.yt)}
                />
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
