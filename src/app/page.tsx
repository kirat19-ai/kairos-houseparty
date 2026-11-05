import Link from "next/link";
import Reveal from "@/components/Reveal";
import RoomFlow from "@/components/RoomFlow";
import ListCard from "@/components/ListCard";
import { LISTS, listSongs } from "@/data/catalog";

export default function Home() {
  // Album-art strip: a cover from each list, doubled for a seamless marquee loop.
  const strip = LISTS.map((l) => listSongs(l.slug)[0]?.yt).filter(Boolean) as string[];
  const marquee = [...strip, ...strip];
  const total = listSongs("all-party").length;

  return (
    <>
      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden px-6 pb-16 pt-24 text-center sm:pt-32">
        <div className="blobs">
          <div className="blob blob-1" />
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>
        <div className="relative z-10">
          <Reveal>
            <span className="chip">
              <span className="eq inline-flex"><span /><span /><span /></span>
              {total} songs · Hindi · Punjabi · Bollywood
            </span>
            <h1 className="mx-auto mt-6 max-w-4xl t-hero">
              Describe the room.
              <br />
              <span className="text-gradient">It plays the party.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl t-sub">
              The official versions, cut to the hook and blended with a crossfade —
              so the floor never goes quiet.
            </p>
            <div className="mt-9 flex items-center justify-center gap-4">
              <Link href="#build" className="btn btn-party">Build a set</Link>
              <Link href="/songs" className="btn btn-dark">Browse {LISTS.length} lists</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---- Album-art marquee ---- */}
      <div className="marquee relative z-10 py-4">
        <div className="marquee-track">
          {marquee.map((yt, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={`https://i.ytimg.com/vi/${yt}/mqdefault.jpg`} alt="" loading="lazy" />
          ))}
        </div>
      </div>

      {/* ---- How it works ---- */}
      <section id="how" className="border-t hairline bg-[color:var(--bg-elevated)] px-6 py-24">
        <div className="mx-auto max-w-[1024px]">
          <Reveal>
            <h2 className="t-display text-center">Three taps to a full night.</h2>
          </Reveal>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {[
              { n: "01", t: "Tell it the room", d: "House party, sangeet, or pre-game. Hindi, Punjabi, or both. Warm-up or all gas." },
              { n: "02", t: "It builds the set", d: "It orders the night and starts every track at the hook — never the slow intro." },
              { n: "03", t: "It mixes the join", d: "Two players, one crossfade. Each song melts into the next like a real DJ set." },
            ].map((c, i) => (
              <Reveal key={c.n} delay={i * 120}>
                <div>
                  <div className="text-gradient text-3xl font-bold">{c.n}</div>
                  <h3 className="mt-2 t-headline">{c.t}</h3>
                  <p className="mt-2 text-[1rem] leading-relaxed text-ink-2">{c.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Build (the room flow) ---- */}
      <section id="build" className="relative overflow-hidden px-6 py-24">
        <div className="blobs opacity-60">
          <div className="blob blob-2" />
          <div className="blob blob-3" />
        </div>
        <div className="relative z-10 mx-auto max-w-[840px]">
          <Reveal>
            <h2 className="t-display text-center">Build tonight&apos;s set.</h2>
            <p className="mx-auto mb-10 mt-4 max-w-xl text-center t-sub">
              Answer three quick questions. It starts playing the second you&apos;re done.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <RoomFlow />
          </Reveal>
        </div>
      </section>

      {/* ---- Lists teaser ---- */}
      <section className="border-t hairline px-6 py-24">
        <div className="mx-auto max-w-[1024px]">
          <Reveal>
            <h2 className="t-display">Or pick a list.</h2>
            <p className="mb-10 mt-3 t-sub">Curated sets by mood and language, ready to play.</p>
          </Reveal>
          <div className="grid gap-5 sm:grid-cols-2">
            {LISTS.slice(0, 6).map((l, i) => {
              const songs = listSongs(l.slug);
              return (
                <Reveal key={l.slug} delay={i * 60}>
                  <ListCard slug={l.slug} title={l.title} blurb={l.blurb} count={songs.length} thumbs={songs.slice(0, 4).map((s) => s.yt)} />
                </Reveal>
              );
            })}
          </div>
          <div className="mt-8 text-center">
            <Link href="/songs" className="btn btn-dark">See all {LISTS.length} lists</Link>
          </div>
        </div>
      </section>

      <footer className="border-t hairline px-6 py-12 text-center text-[0.8rem] text-ink-2">
        KAIRO&apos;S HOUSEPARTY · YouTube-powered crossfade mixing, mid-set search, and your own playlists.
      </footer>
    </>
  );
}
