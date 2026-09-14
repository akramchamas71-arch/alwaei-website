import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticleBySlug, getArticlesByCategory } from "@/lib/data";
import { formatDate } from "@/lib/format";
import ArticleCard from "@/components/ArticleCard";
import type { Metadata } from "next";

export async function generateMetadata(
  props: PageProps<"/article/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: "مقال غير موجود" };
  return {
    title: article.title,
    description: article.excerpt,
  };
}

export default async function ArticlePage(props: PageProps<"/article/[slug]">) {
  const { slug } = await props.params;
  const article = getArticleBySlug(slug);
  if (!article || article.status !== "published") notFound();

  const related = getArticlesByCategory(article.category_id, 4).filter(
    (a) => a.id !== article.id
  );

  const paragraphs = article.content
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <nav className="text-sm text-muted mb-4">
        <Link href="/" className="hover:text-brand">الرئيسية</Link>
        <span className="mx-2">/</span>
        <Link href={`/category/${article.category_slug}`} className="hover:text-brand">
          {article.category_name}
        </Link>
      </nav>

      <span className="inline-block bg-brand text-white text-xs px-2 py-1 rounded font-heading mb-3">
        {article.category_name}
      </span>

      <h1 className="font-heading font-extrabold text-3xl sm:text-4xl leading-tight mb-4">
        {article.title}
      </h1>

      <div className="flex items-center gap-4 text-sm text-muted border-b border-[var(--border)] pb-5 mb-6">
        <span className="font-semibold text-foreground">{article.author_name}</span>
        <span>{formatDate(article.published_at)}</span>
      </div>

      {article.cover_image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.cover_image}
          alt={article.title}
          className="w-full rounded-lg mb-8 object-cover"
        />
      )}

      <div className="prose-article">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-heading font-extrabold text-xl text-brand border-b-2 border-brand pb-2 mb-4">
            مقالات ذات صلة
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {related.slice(0, 2).map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
