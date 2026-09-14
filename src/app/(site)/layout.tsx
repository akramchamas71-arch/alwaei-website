import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCategories } from "@/lib/data";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = getCategories();

  return (
    <>
      <Header categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer categories={categories} />
    </>
  );
}
