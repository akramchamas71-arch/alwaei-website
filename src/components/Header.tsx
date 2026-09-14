import Link from "next/link";
import Logo from "./Logo";
import type { Category } from "@/lib/data";
import SearchBox from "./SearchBox";

export default function Header({ categories }: { categories: Category[] }) {
  return (
    <header className="bg-white border-b border-[var(--border)] sticky top-0 z-40 shadow-sm">
      <div className="bg-[var(--ink)] text-white/80 text-xs">
        <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center justify-between">
          <span>منصة عربية مستقلة للتحليلات السياسية والفكرية</span>
          <div className="hidden sm:flex items-center gap-4">
            <a href="#" className="hover:text-white transition">فيسبوك</a>
            <a href="#" className="hover:text-white transition">إكس</a>
            <a href="#" className="hover:text-white transition">تلغرام</a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
        <Link href="/">
          <Logo />
        </Link>
        <div className="flex-1 max-w-sm w-full">
          <SearchBox />
        </div>
      </div>

      <nav className="border-t border-[var(--border)] bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <ul className="flex items-center gap-1 overflow-x-auto whitespace-nowrap text-sm font-heading font-semibold">
            <li>
              <Link
                href="/"
                className="block px-3 py-3 text-brand hover:bg-[var(--background)] transition"
              >
                الرئيسية
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/category/${c.slug}`}
                  className="block px-3 py-3 hover:bg-[var(--background)] hover:text-brand transition"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
