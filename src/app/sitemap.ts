import type { MetadataRoute } from "next";
import { getCategories, getPublishedArticles } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

// Generated fresh on every request (not cached at build time) so a newly
// published article shows up in the sitemap immediately instead of waiting
// for the next deploy — content here changes through the admin panel at
// runtime, not through new builds.
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const categories = getCategories();
  // This site's whole catalog is small enough that a single page of
  // results comfortably covers it; raise this (or switch to
  // generateSitemaps) if the article count ever grows into the thousands.
  const articles = getPublishedArticles(5000);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/search`, changeFrequency: "monthly", priority: 0.3 },
  ];

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/category/${category.slug}`,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const articleEntries: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE_URL}/article/${article.slug}`,
    lastModified: new Date(article.updated_at || article.published_at),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticEntries, ...categoryEntries, ...articleEntries];
}
