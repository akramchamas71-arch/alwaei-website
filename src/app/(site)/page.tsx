import Link from "next/link";
import { getFeaturedArticles, getPublishedArticles, getCategories } from "@/lib/data";
import { formatDate } from "@/lib/format";
import ArticleCard from "@/components/ArticleCard";
import BreakingTicker from "@/components/BreakingTicker";
import Reveal from "@/components/Reveal";

// Always render with the latest data from the database: this is a
// CMS-backed site where admin edits should show up immediately, not after
// an on-demand revalidation that may not fire for every code path.
export const dynamic = "force-dynamic";

export default function HomePage() {
  const featured = getFeaturedArticles(6);
  const latest = getPublishedArticles(13);
  const categories = getCategories();

  const [hero, ...restFeatured] = featured;
  const latestExcludingFeatured = latest.filter(
    (a) => !featured.some((f) => f.id === a.id)
  );

  return (
    <>
      <BreakingTicker />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {hero && (
          <Reveal>
            <section className="hero-grid mb-12">
              <Link href={`/article/${hero.slug}`} className="hero-lead">
                <div className="hero-lead-media">
                  {hero.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={hero.cover_image}
                      alt={hero.title}
                      className="hero-lead-img"
                    />
                  ) : (
                    <div className="hero-lead-placeholder">الوعي</div>
                  )}
                  <div className="hero-lead-scrim" />
                </div>
                <div className="hero-lead-content">
                  <span className="hero-lead-tag">{hero.category_name}</span>
                  <h1 className="hero-lead-title">{hero.title}</h1>
                  <p className="hero-lead-excerpt line-clamp-2">{hero.excerpt}</p>
                  <div className="hero-lead-meta">
                    <span>{hero.author_name}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatDate(hero.published_at)}</span>
                  </div>
                </div>
              </Link>

              {restFeatured.length > 0 && (
                <aside className="hero-list" aria-label="أبرز العناوين">
                  {restFeatured.slice(0, 5).map((a) => (
                    <Link key={a.id} href={`/article/${a.slug}`} className="hero-list-item">
                      <span className="hero-list-tag">{a.category_name}</span>
                      <span className="hero-list-title line-clamp-2">{a.title}</span>
                      <span className="hero-list-time">{formatDate(a.published_at)}</span>
                    </Link>
                  ))}
                </aside>
              )}
            </section>
          </Reveal>
        )}

        <Reveal>
          <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-heading font-heading font-extrabold text-xl text-foreground">
                آخر المقالات
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {latestExcludingFeatured.slice(0, 9).map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-heading font-heading font-extrabold text-xl text-foreground">
                الأقسام
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.slice(0, 8).map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  className="bg-surface border border-[var(--border)] rounded-lg p-4 text-center font-heading font-bold hover:border-brand hover:text-brand transition"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </section>
        </Reveal>
      </div>
    </>
  );
}
