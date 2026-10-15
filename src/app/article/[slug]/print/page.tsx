import { notFound } from "next/navigation";
import { getArticleBySlug } from "@/lib/data";
import { formatDate } from "@/lib/format";
import type { Metadata } from "next";
import PrintTrigger from "./PrintTrigger";

// A separate, chrome-free (no header/footer/nav) print-friendly version of
// an article. This is what the "تحميل / طباعة المقال" button on a normal
// article page opens when no PDF has been uploaded for it: the browser's
// own print-to-PDF renders this page with full, correct Arabic shaping —
// no server-side PDF library or headless browser needed.
export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/article/[slug]/print">
): Promise<Metadata> {
  const { slug } = await props.params;
  const article = getArticleBySlug(slug);
  return {
    title: article ? `${article.title} — نسخة للطباعة` : "غير موجود",
    robots: { index: false, follow: false },
  };
}

export default async function ArticlePrintPage(
  props: PageProps<"/article/[slug]/print">
) {
  const { slug } = await props.params;
  const article = getArticleBySlug(slug);
  if (!article || article.status !== "published") notFound();

  const paragraphs = article.content
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="print-article">
      <style>{`
        .print-article {
          max-width: 46rem;
          margin: 0 auto;
          padding: 2.5rem 1.5rem 4rem;
        }
        .print-toolbar {
          display: flex;
          justify-content: center;
          margin-bottom: 2rem;
        }
        @media print {
          .print-toolbar {
            display: none;
          }
          .print-article {
            padding: 0;
            max-width: none;
          }
        }
      `}</style>

      <div className="print-toolbar">
        <button
          type="button"
          data-print-trigger
          className="bg-brand text-white px-5 py-2.5 rounded-lg font-heading font-bold hover:bg-brand-dark transition"
        >
          طباعة / حفظ كـ PDF
        </button>
      </div>

      <p className="text-sm text-muted mb-1">{article.category_name}</p>
      <h1 className="font-heading font-extrabold text-3xl mb-3 leading-tight">
        {article.title}
      </h1>
      <div className="flex items-center gap-3 text-sm text-muted border-b border-[var(--border)] pb-4 mb-6">
        <span className="font-semibold text-foreground">{article.author_name}</span>
        <span>{formatDate(article.published_at)}</span>
      </div>

      {article.cover_image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.cover_image}
          alt={article.title}
          className="w-full rounded-lg mb-6 object-cover"
        />
      )}

      <div className="prose-article">
        {paragraphs.length > 0 ? (
          paragraphs.map((p, i) => <p key={i}>{p}</p>)
        ) : (
          <p className="text-muted">
            لا يحتوي هذا المقال على نص مكتوب — راجع نسخة PDF المرفقة في صفحة
            المقال.
          </p>
        )}
      </div>

      <p className="text-xs text-muted mt-10 border-t border-[var(--border)] pt-4">
        الوعي — https://alwaei-website-production.up.railway.app/article/{article.slug}
      </p>

      <PrintTrigger />
    </div>
  );
}
