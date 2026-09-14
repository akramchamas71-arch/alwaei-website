import { notFound } from "next/navigation";
import ArticleForm from "@/components/admin/ArticleForm";
import { getArticleById, getCategories } from "@/lib/data";

export default async function EditArticlePage(
  props: PageProps<"/admin/articles/[id]/edit">
) {
  const { id } = await props.params;
  const article = getArticleById(Number(id));
  if (!article) notFound();
  const categories = getCategories();

  return (
    <div>
      <h1 className="font-heading font-extrabold text-2xl mb-6">تعديل المقالة</h1>
      <ArticleForm article={article} categories={categories} />
    </div>
  );
}
