import Link from "next/link";
import type { Article } from "@/lib/data";
import { formatDate } from "@/lib/format";

export default function ArticleCard({
  article,
  size = "normal",
}: {
  article: Article;
  size?: "normal" | "large" | "small";
}) {
  const titleSize =
    size === "large" ? "text-2xl sm:text-3xl" : size === "small" ? "text-base" : "text-lg";

  return (
    <article className="group flex flex-col bg-surface rounded-lg overflow-hidden border border-[var(--border)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-brand/40 focus-within:-translate-y-1 focus-within:shadow-xl focus-within:ring-2 focus-within:ring-[var(--gold)] focus-within:ring-offset-2 h-full">
      <Link href={`/article/${article.slug}`} className="block relative aspect-video bg-gradient-to-br from-brand to-brand-dark overflow-hidden">
        {article.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.cover_image}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 font-heading text-4xl font-black">
            الوعي
          </div>
        )}
        <span className="absolute top-2 start-2 bg-brand text-white text-xs px-2 py-1 rounded font-heading">
          {article.category_name}
        </span>
      </Link>
      <div className="p-4 flex-1 flex flex-col">
        <Link href={`/article/${article.slug}`}>
          <h3 className={`font-heading font-bold ${titleSize} leading-snug group-hover:text-brand transition line-clamp-2`}>
            {article.title}
          </h3>
        </Link>
        {size !== "small" && (
          <p className="mt-2 text-sm text-muted line-clamp-2 flex-1">
            {article.excerpt}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          <span>{article.author_name}</span>
          <span>{formatDate(article.published_at)}</span>
        </div>
      </div>
    </article>
  );
}
