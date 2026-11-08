import Link from "next/link";
import { getBreakingArticles } from "@/lib/data";
import { formatDate } from "@/lib/format";

// A dedicated homepage slot for breaking (عاجل) wire items — visually
// separate from the "latest articles" grid of full ArticleCards, since
// these are short, high-volume wire headlines rather than full pieces.
// Lives alongside the top ticker as the second place breaking news shows
// on the homepage (see getPublishedArticlesExcludingCategory in data.ts
// for why they're excluded from the main articles grid).
export default function BreakingBox({ limit = 6 }: { limit?: number }) {
  const items = getBreakingArticles(limit);
  if (items.length === 0) return null;

  return (
    <section className="breaking-box" aria-label="الأخبار العاجلة">
      <div className="breaking-box-head">
        <span className="breaking-box-dot" aria-hidden="true" />
        <h2 className="breaking-box-title">عاجل</h2>
        <Link href="/category/breaking" className="breaking-box-all">
          كل العاجل
        </Link>
      </div>
      <ul className="breaking-box-list">
        {items.map((a) => (
          <li key={a.id}>
            <Link href={`/article/${a.slug}`} className="breaking-box-item">
              <span className="breaking-box-item-title line-clamp-2">{a.title}</span>
              <span className="breaking-box-item-time">{formatDate(a.published_at)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
