import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticleBySlug, getArticlesByCategory } from "@/lib/data";
import { formatDate } from "@/lib/format";
import ArticleCard from "@/components/ArticleCard";
import Reveal from "@/components/Reveal";
import type { Metadata } from "next";

// Always render with the latest data from the database so admin edits
// (status changes, author corrections, new images) show up immediately.
export const dynamic = "force-dynamic";

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

  const isPdfOnly = !!article.pdf_file && paragraphs.length === 0;
  const downloadHref = article.pdf_file || `/article/${article.slug}/print?autoprint=1`;
  const downloadIsDirectFile = !!article.pdf_file;

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

      {isPdfOnly ? (
        <div className="mb-8">
          <div className="rounded-lg overflow-hidden border border-[var(--border)] h-[75vh] bg-[var(--surface)]">
            <iframe
              src={article.pdf_file!}
              title={article.title}
              className="w-full h-full"
            />
          </div>
          <a
            href={article.pdf_file!}
            download
            className="mt-4 inline-flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-lg font-heading font-bold hover:bg-brand-dark transition"
          >
            <DownloadIcon />
            تحميل الملف (PDF)
          </a>
        </div>
      ) : (
        <>
          <div className="prose-article">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <div className="mt-8">
            <a
              href={downloadHref}
              download={downloadIsDirectFile || undefined}
              target={downloadIsDirectFile ? undefined : "_blank"}
              rel={downloadIsDirectFile ? undefined : "noopener"}
              className="inline-flex items-center gap-2 border border-brand text-brand px-5 py-2.5 rounded-lg font-heading font-bold hover:bg-brand hover:text-white transition"
            >
              <DownloadIcon />
              {downloadIsDirectFile ? "تحميل المقال (PDF)" : "تحميل / طباعة المقال (PDF)"}
            </a>
          </div>
        </>
      )}

      {related.length > 0 && (
        <Reveal>
          <section className="mt-14">
            <h2 className="section-heading font-heading font-extrabold text-xl text-foreground mb-4">
              مقالات ذات صلة
            </h2>
            <div className="grid sm:grid-cols-2 gap-5">
              {related.slice(0, 2).map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </section>
        </Reveal>
      )}
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  );
}
