import Link from "next/link";
import { getPublishedArticles } from "@/lib/data";

// A dark scrolling bar for the latest headlines, shown at the top of the
// homepage. Pure CSS marquee (no JS, no library) so it never blocks
// hydration; pauses on hover and falls back to a horizontally-scrollable
// list when the visitor has asked for reduced motion.
export default function BreakingTicker() {
  const latest = getPublishedArticles(8);
  if (latest.length === 0) return null;

  // Duplicate the list once so the looping animation has no visible seam.
  const items = [...latest, ...latest];

  return (
    <div className="ticker" dir="rtl" role="region" aria-label="آخر العناوين">
      <div className="ticker-badge">
        <span>عاجل</span>
      </div>
      <div className="ticker-track-wrap">
        <ul className="ticker-track">
          {items.map((a, i) => (
            <li key={`${a.id}-${i}`}>
              <Link href={`/article/${a.slug}`}>{a.title}</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
