import Link from "next/link";
import { notFound } from "next/navigation";
import Reveal from "@/components/Reveal";
import PlaySetButton from "@/components/PlaySetButton";
import { LISTS, listSongs } from "@/data/catalog";

export function generateStaticParams() {
  return LISTS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const list = LISTS.find((l) => l.slug === slug);
  return { title: list ? `${list.title} · KAIRO'S HOUSEPARTY` : "KAIRO'S HOUSEPARTY" };
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function ListDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const list = LISTS.find((l) => l.slug === slug);
  if (!list) notFound();
  const songs = listSongs(slug);

  return (
    <section className="px-6 pb-32 pt-16">
      <div className="mx-auto max-w-[840px]">
        <Link href="/songs" className="link-chevron">‹ All lists</Link>
        <Reveal>
          <h1 className="mt-5 t-display">{list.title}</h1>
          <p className="mt-3 max-w-2xl t-sub">{list.blurb}</p>
          <p className="mt-2 text-[0.9rem] text-ink-2">
            {songs.length} songs · each starts at its best part and crossfades into the next.
          </p>
          <div className="mt-7">
            <PlaySetButton songs={songs} />
          </div>
        </Reveal>

        <ol className="mt-12 divide-y divide-black/5 rounded-3xl border border-black/5">
          {songs.map((s, i) => (
            <li key={s.id} className="flex items-center gap-4 px-5 py-4">
              <span className="w-6 text-center text-[0.85rem] text-ink-2">{i + 1}</span>
              <img src={`https://i.ytimg.com/vi/${s.yt}/default.jpg`} alt="" className="h-10 w-16 rounded-md object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[1rem] font-semibold">{s.title}</div>
                <div className="truncate text-[0.8rem] text-ink-2">{s.artists}{s.year ? ` · ${s.year}` : ""}</div>
              </div>
              <span className="text-[0.78rem] text-ink-2">best part {fmt(s.start)}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
