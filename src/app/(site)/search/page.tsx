import { searchArticles } from "@/lib/data";
import ArticleCard from "@/components/ArticleCard";
import SearchBox from "@/components/SearchBox";

export default async function SearchPage(props: PageProps<"/search">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const results = q ? searchArticles(q) : [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="max-w-md mb-8">
        <SearchBox initialValue={q} />
      </div>
      <h1 className="font-heading font-extrabold text-xl mb-6">
        {q ? `نتائج البحث عن: "${q}"` : "ابحث في الموقع"}
      </h1>
      {q && results.length === 0 && (
        <p className="text-muted">لا توجد نتائج مطابقة لبحثك.</p>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {results.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
    </div>
  );
}
