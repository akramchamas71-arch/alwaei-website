import Link from "next/link";
import Logo from "./Logo";
import type { Category } from "@/lib/data";

export default function Footer({ categories }: { categories: Category[] }) {
  return (
    <footer className="bg-[var(--ink)] text-white/70 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 sm:grid-cols-3">
        <div>
          <Logo variant="light" />
          <p className="mt-3 text-sm leading-7 text-white/60">
            الوعي منصة عربية مستقلة تُعنى بالتحليل السياسي والفكري، وتقديم
            قراءة نقدية لأحداث المنطقة بعيداً عن التسطيح الإخباري.
          </p>
        </div>
        <div>
          <h3 className="font-heading font-bold text-white mb-3">الأقسام</h3>
          <ul className="space-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/category/${c.slug}`} className="hover:text-white transition">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-heading font-bold text-white mb-3">تابعونا</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition">فيسبوك</a></li>
            <li><a href="#" className="hover:text-white transition">إكس (تويتر)</a></li>
            <li><a href="#" className="hover:text-white transition">تلغرام</a></li>
            <li><a href="#" className="hover:text-white transition">يوتيوب</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/40">
        © {new Date().getFullYear()} الوعي. جميع الحقوق محفوظة.
      </div>
    </footer>
  );
}
