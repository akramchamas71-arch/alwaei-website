"use client";

import { saveArticleAction } from "@/app/admin/actions";
import type { Article, Category } from "@/lib/data";

export default function ArticleForm({
  article,
  categories,
}: {
  article?: Article;
  categories: Category[];
}) {
  return (
    <form action={saveArticleAction} className="space-y-5 max-w-3xl">
      {article && <input type="hidden" name="id" value={article.id} />}
      {article?.cover_image && (
        <input type="hidden" name="existing_cover_image" value={article.cover_image} />
      )}

      <div>
        <label className="block text-sm font-semibold mb-1">العنوان</label>
        <input
          name="title"
          defaultValue={article?.title}
          required
          className="w-full border border-[var(--border)] rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">
          الرابط المختصر (slug) - اتركه فارغاً ليُنشأ تلقائياً
        </label>
        <input
          name="slug"
          defaultValue={article?.slug}
          dir="ltr"
          className="w-full border border-[var(--border)] rounded-lg px-3 py-2 font-mono text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">الملخص</label>
        <textarea
          name="excerpt"
          defaultValue={article?.excerpt}
          rows={2}
          className="w-full border border-[var(--border)] rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">المحتوى</label>
        <textarea
          name="content"
          defaultValue={article?.content}
          rows={16}
          required
          className="w-full border border-[var(--border)] rounded-lg px-3 py-2 leading-8"
        />
        <p className="text-xs text-muted mt-1">
          افصل بين الفقرات بسطر فارغ.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1">القسم</label>
          <select
            name="category_id"
            defaultValue={article?.category_id}
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">الكاتب</label>
          <input
            name="author_name"
            defaultValue={article?.author_name}
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1">تاريخ النشر</label>
          <input
            type="date"
            name="published_at"
            defaultValue={article?.published_at?.slice(0, 10)}
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">الحالة</label>
          <select
            name="status"
            defaultValue={article?.status || "published"}
            className="w-full border border-[var(--border)] rounded-lg px-3 py-2"
          >
            <option value="published">منشور</option>
            <option value="draft">مسودة</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">صورة الغلاف</label>
        <input type="file" name="cover_image" accept="image/*" className="block" />
        {article?.cover_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.cover_image}
            alt="الغلاف الحالي"
            className="mt-2 h-28 rounded-lg object-cover"
          />
        )}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_featured"
          defaultChecked={!!article?.is_featured}
        />
        إبراز المقالة في الصفحة الرئيسية
      </label>

      <button
        type="submit"
        className="bg-brand text-white px-6 py-2.5 rounded-lg font-heading font-bold hover:bg-brand-dark transition"
      >
        حفظ
      </button>
    </form>
  );
}
