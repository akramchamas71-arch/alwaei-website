import Link from "next/link";
import { getFeaturedArticles, getPublishedArticles, getCategories } from "@/lib/data";
import ArticleCard from "@/components/ArticleCard";

export default function HomePage() {
  const featured = getFeaturedArticles(4);
  const latest = getPublishedArticles(13);
  const categories = getCategories();

  const [hero, ...restFeatured] = featured;
  const latestExcludingFeatured = latest.filter(
    (a) => !featured.some((f) => f.id === a.id)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {hero && (
        <section className="grid lg:grid-cols-3 gap-5 mb-10">
          <div className="lg:col-span-2">
            <ArticleCard article={hero} size="large" />
          </div>
          <div className="grid gap-4">
            {restFeatured.slice(0, 2).map((a) => (
              <ArticleCard key={a.id} article={a} size="small" />
            ))}
          </div>
        </section>
      )}

      <section className="mb-10">
        <div className="flex items-center justify-between mb-4 border-b-2 border-brand pb-2">
          <h2 className="font-heading font-extrabold text-xl text-brand">آخر المقالات</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {latestExcludingFeatured.slice(0, 9).map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.slice(0, 8).map((c) => (
          <Link
            key={c.id}
            href={`/category/${c.slug}`}
            className="bg-surface border border-[var(--border)] rounded-lg p-4 text-center font-heading font-bold hover:border-brand hover:text-brand transition"
          >
            {c.name}
          </Link>
        ))}
      </section>
    </div>
  );
}
