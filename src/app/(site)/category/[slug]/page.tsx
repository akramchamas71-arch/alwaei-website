import { notFound } from "next/navigation";
import { getCategoryBySlug, getArticlesByCategory } from "@/lib/data";
import ArticleCard from "@/components/ArticleCard";
import type { Metadata } from "next";

export async function generateMetadata(
  props: PageProps<"/category/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const category = getCategoryBySlug(slug);
  return { title: category ? category.name : "قسم غير موجود" };
}

export default async function CategoryPage(props: PageProps<"/category/[slug]">) {
  const { slug } = await props.params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const articles = getArticlesByCategory(category.id, 40);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 border-b-2 border-brand pb-2">
        <h1 className="font-heading font-extrabold text-2xl text-brand">
          {category.name}
        </h1>
      </div>
      {articles.length === 0 ? (
        <p className="text-muted py-16 text-center">
          لا توجد مقالات منشورة في هذا القسم بعد.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
