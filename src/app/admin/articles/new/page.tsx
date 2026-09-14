import ArticleForm from "@/components/admin/ArticleForm";
import { getCategories } from "@/lib/data";

export default function NewArticlePage() {
  const categories = getCategories();
  return (
    <div>
      <h1 className="font-heading font-extrabold text-2xl mb-6">مقالة جديدة</h1>
      <ArticleForm categories={categories} />
    </div>
  );
}
