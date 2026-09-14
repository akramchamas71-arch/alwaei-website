import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { logoutAction } from "./actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <div className="min-h-screen bg-[#f2efe9]">
      {user && (
        <header className="bg-[var(--ink)] text-white">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="font-heading font-bold">
                لوحة تحكم الوعي
              </Link>
              <nav className="flex items-center gap-4 text-sm text-white/70">
                <Link href="/admin" className="hover:text-white">المقالات</Link>
                <Link href="/admin/articles/new" className="hover:text-white">مقالة جديدة</Link>
                <Link href="/admin/categories" className="hover:text-white">الأقسام</Link>
                <Link href="/" target="_blank" className="hover:text-white">عرض الموقع ↗</Link>
              </nav>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-white/60">{user.name}</span>
              <form action={logoutAction}>
                <button className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition">
                  خروج
                </button>
              </form>
            </div>
          </div>
        </header>
      )}
      <div className="max-w-6xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
