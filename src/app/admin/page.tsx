import Link from "next/link";
import { getAllArticlesForAdmin } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { deleteArticleAction } from "./actions";

export default function AdminDashboard() {
  const articles = getAllArticlesForAdmin();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-extrabold text-2xl">المقالات</h1>
        <Link
          href="/admin/articles/new"
          className="bg-brand text-white px-4 py-2 rounded-lg font-heading font-bold hover:bg-brand-dark transition"
        >
          + مقالة جديدة
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--background)] text-start">
            <tr>
              <th className="p-3 text-start">العنوان</th>
              <th className="p-3 text-start">القسم</th>
              <th className="p-3 text-start">الحالة</th>
              <th className="p-3 text-start">التاريخ</th>
              <th className="p-3 text-start">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id} className="border-t border-[var(--border)]">
                <td className="p-3 font-semibold max-w-xs truncate">{a.title}</td>
                <td className="p-3 text-muted">{a.category_name}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      a.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {a.status === "published" ? "منشور" : "مسودة"}
                  </span>
                </td>
                <td className="p-3 text-muted">{formatDate(a.published_at)}</td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/articles/${a.id}/edit`}
                      className="text-brand hover:underline"
                    >
                      تعديل
                    </Link>
                    <form action={deleteArticleAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="text-red-600 hover:underline">حذف</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted">
                  لا توجد مقالات بعد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
