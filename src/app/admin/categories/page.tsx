import { getCategories } from "@/lib/data";
import { saveCategoryAction, deleteCategoryAction } from "../actions";

export default function CategoriesPage() {
  const categories = getCategories();

  return (
    <div className="max-w-2xl">
      <h1 className="font-heading font-extrabold text-2xl mb-6">الأقسام</h1>

      <div className="bg-white rounded-lg border border-[var(--border)] divide-y divide-[var(--border)] mb-8">
        {categories.map((c) => (
          <div key={c.id} className="p-3 flex items-center justify-between">
            <div>
              <span className="font-semibold">{c.name}</span>
              <span className="text-xs text-muted ms-2 font-mono">/{c.slug}</span>
            </div>
            <form action={deleteCategoryAction}>
              <input type="hidden" name="id" value={c.id} />
              <button className="text-red-600 hover:underline text-sm">حذف</button>
            </form>
          </div>
        ))}
      </div>

      <h2 className="font-heading font-bold text-lg mb-3">إضافة قسم جديد</h2>
      <form action={saveCategoryAction} className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold mb-1">اسم القسم</label>
          <input
            name="name"
            required
            className="border border-[var(--border)] rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">الرابط (اختياري)</label>
          <input
            name="slug"
            dir="ltr"
            className="border border-[var(--border)] rounded-lg px-3 py-2 font-mono text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">الترتيب</label>
          <input
            type="number"
            name="sort_order"
            defaultValue={categories.length}
            className="border border-[var(--border)] rounded-lg px-3 py-2 w-24"
          />
        </div>
        <button className="bg-brand text-white px-4 py-2 rounded-lg font-heading font-bold hover:bg-brand-dark transition">
          إضافة
        </button>
      </form>
    </div>
  );
}
