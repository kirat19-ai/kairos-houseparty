import Link from "next/link";

const COLORS: Record<string, string> = {
  "hindi-dance": "linear-gradient(100deg,#ff5e62,#ff9966)",
  "hindi-retro": "linear-gradient(100deg,#a18cd1,#fbc2eb)",
  "hindi-romantic": "linear-gradient(100deg,#ff6a88,#ff99ac)",
  "hindi-sufi": "linear-gradient(100deg,#43cea2,#185a9d)",
  "hindi-hiphop": "linear-gradient(100deg,#f7971e,#ffd200)",
  "punjabi-party": "linear-gradient(100deg,#f12711,#f5af19)",
  "punjabi-wedding": "linear-gradient(100deg,#ec008c,#fc6767)",
  "punjabi-sad": "linear-gradient(100deg,#4b6cb7,#182848)",
  gym: "linear-gradient(100deg,#f00000,#dc281e)",
  "english-pop": "linear-gradient(100deg,#00c6ff,#0072ff)",
  "english-hiphop": "linear-gradient(100deg,#654ea3,#eaafc8)",
  "english-edm": "linear-gradient(100deg,#00f2fe,#4facfe)",
  garba: "linear-gradient(100deg,#f7971e,#ffd200)",
  "tamil-telugu": "linear-gradient(100deg,#fc4a1a,#f7b733)",
  diwali: "linear-gradient(100deg,#ff512f,#f09819)",
  "all-party": "linear-gradient(100deg,#8e2de2,#4a00e0)",
};

export default function ListCard({
  slug,
  title,
  blurb,
  count,
  thumbs,
}: {
  slug: string;
  title: string;
  blurb: string;
  count: number;
  thumbs: string[];
}) {
  const grad = COLORS[slug] ?? "linear-gradient(100deg,#ff2d7e,#ff8a3d)";
  const art = thumbs.slice(0, 4);
  return (
    <Link href={`/songs/${slug}`} className="listcard group block">
      <div className="accent" style={{ background: grad }} />
      <div className="flex gap-4 p-5">
        <div className="mosaic h-[76px] w-[100px] flex-shrink-0" style={{ background: grad }}>
          {art.map((yt, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={`https://i.ytimg.com/vi/${yt}/default.jpg`} alt="" loading="lazy" />
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[1.15rem] font-semibold leading-tight">{title}</h3>
          <p className="mt-1 line-clamp-2 text-[0.85rem] text-ink-2">{blurb}</p>
          <span
            className="mt-2 inline-block bg-clip-text text-[0.8rem] font-bold text-transparent"
            style={{ backgroundImage: grad }}
          >
            {count} songs ›
          </span>
        </div>
      </div>
    </Link>
  );
}
