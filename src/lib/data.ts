import { db } from "./db";
import { sendWhatsAppText } from "./whatsapp";
import { SITE_URL } from "./site";

// node:sqlite returns row objects with a null prototype, which React
// refuses to pass from Server Components to Client Components. Convert
// to plain objects (and arrays of them) before they leave this module.
function plain<T>(row: T): T {
  return row == null ? row : ({ ...(row as object) } as T);
}
function plainAll<T>(rows: T[]): T[] {
  return rows.map(plain);
}

export type Category = {
  id: number;
  slug: string;
  name: string;
  sort_order: number;
};

export type Article = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  pdf_file: string | null;
  category_id: number;
  author_name: string;
  status: "published" | "draft";
  is_featured: number;
  views: number;
  published_at: string;
  created_at: string;
  updated_at: string;
  category_name?: string;
  category_slug?: string;
};

export function getCategories(): Category[] {
  return plainAll(
    db.prepare("SELECT * FROM categories ORDER BY sort_order ASC").all() as Category[]
  );
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return plain(
    db.prepare("SELECT * FROM categories WHERE slug = ?").get(slug) as
      | Category
      | undefined
  );
}

const ARTICLE_JOIN = `
  SELECT a.*, c.name AS category_name, c.slug AS category_slug
  FROM articles a
  JOIN categories c ON c.id = a.category_id
`;

export function getPublishedArticles(limit = 100, offset = 0): Article[] {
  return plainAll(
    db
      .prepare(
        `${ARTICLE_JOIN} WHERE a.status = 'published'
         ORDER BY a.published_at DESC LIMIT ? OFFSET ?`
      )
      .all(limit, offset) as Article[]
  );
}

// Like getPublishedArticles, but leaves out a given category (by slug).
// Used on the homepage's "latest articles" grid so the high-volume
// breaking-news wire items (auto-imported every few minutes — see
// breakingNews.ts) don't flood out the site's actual analysis pieces;
// breaking items get their own ticker + box instead (see getBreakingArticles).
export function getPublishedArticlesExcludingCategory(
  categorySlug: string,
  limit = 100,
  offset = 0
): Article[] {
  return plainAll(
    db
      .prepare(
        `${ARTICLE_JOIN} WHERE a.status = \'published\' AND c.slug != ?
         ORDER BY a.published_at DESC LIMIT ? OFFSET ?`
      )
      .all(categorySlug, limit, offset) as Article[]
  );
}

// The most recent "breaking" (عاجل) wire items, for the homepage ticker
// and breaking-news box.
export function getBreakingArticles(limit = 20, offset = 0): Article[] {
  return plainAll(
    db
      .prepare(
        `${ARTICLE_JOIN} WHERE a.status = \'published\' AND c.slug = \'breaking\'
         ORDER BY a.published_at DESC LIMIT ? OFFSET ?`
      )
      .all(limit, offset) as Article[]
  );
}

export function getFeaturedArticles(limit = 5): Article[] {
  return plainAll(
    db
      .prepare(
        `${ARTICLE_JOIN} WHERE a.status = 'published' AND a.is_featured = 1
         ORDER BY a.published_at DESC LIMIT ?`
      )
      .all(limit) as Article[]
  );
}

export function getArticlesByCategory(
  categoryId: number,
  limit = 20,
  offset = 0
): Article[] {
  return plainAll(
    db
      .prepare(
        `${ARTICLE_JOIN} WHERE a.status = 'published' AND a.category_id = ?
         ORDER BY a.published_at DESC LIMIT ? OFFSET ?`
      )
      .all(categoryId, limit, offset) as Article[]
  );
}

export function getArticleBySlug(slug: string): Article | undefined {
  return plain(
    db.prepare(`${ARTICLE_JOIN} WHERE a.slug = ?`).get(slug) as
      | Article
      | undefined
  );
}

export function getArticleById(id: number): Article | undefined {
  return plain(
    db.prepare(`${ARTICLE_JOIN} WHERE a.id = ?`).get(id) as Article | undefined
  );
}

export function searchArticles(query: string, limit = 30): Article[] {
  const like = `%${query}%`;
  return plainAll(
    db
      .prepare(
        `${ARTICLE_JOIN} WHERE a.status = 'published'
         AND (a.title LIKE ? OR a.excerpt LIKE ? OR a.content LIKE ?)
         ORDER BY a.published_at DESC LIMIT ?`
      )
      .all(like, like, like, limit) as Article[]
  );
}

export function incrementViews(id: number) {
  db.prepare("UPDATE articles SET views = views + 1 WHERE id = ?").run(id);
}

// ---- Admin CRUD ----

export function getAllArticlesForAdmin(): Article[] {
  return plainAll(
    db.prepare(`${ARTICLE_JOIN} ORDER BY a.created_at DESC`).all() as Article[]
  );
}

export type ArticleInput = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  cover_image: string | null;
  pdf_file: string | null;
  category_id: number;
  author_name: string;
  status: "published" | "draft";
  is_featured: number;
  published_at: string;
};

export function createArticle(input: ArticleInput): number {
  const stmt = db.prepare(`
    INSERT INTO articles
      (slug, title, excerpt, content, cover_image, pdf_file, category_id, author_name, status, is_featured, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    input.slug,
    input.title,
    input.excerpt,
    input.content,
    input.cover_image,
    input.pdf_file,
    input.category_id,
    input.author_name,
    input.status,
    input.is_featured,
    input.published_at
  );
  const id = Number(result.lastInsertRowid);

  if (input.status === "published") {
    // Best-effort, never allowed to slow down or fail a publish: WhatsApp
    // delivery runs after the fact and swallows its own errors.
    notifyWhatsApp(input).catch((err) => console.error("[whatsapp] notify failed:", err));
  }

  return id;
}

async function notifyWhatsApp(input: ArticleInput): Promise<void> {
  const category = db
    .prepare("SELECT slug FROM categories WHERE id = ?")
    .get(input.category_id) as { slug: string } | undefined;
  const url = `${SITE_URL}/article/${input.slug}`;
  const isBreaking = category?.slug === "breaking";
  const text = isBreaking
    ? `\ud83d\udd34 عاجل | ${input.title}\n\n${url}`
    : `\ud83d\udcf0 ${input.title}${input.excerpt ? `\n\n${input.excerpt}` : ""}\n\n${url}`;
  await sendWhatsAppText(text);
}

export function updateArticle(id: number, input: ArticleInput) {
  db.prepare(`
    UPDATE articles SET
      slug = ?, title = ?, excerpt = ?, content = ?, cover_image = ?, pdf_file = ?,
      category_id = ?, author_name = ?, status = ?, is_featured = ?,
      published_at = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    input.slug,
    input.title,
    input.excerpt,
    input.content,
    input.cover_image,
    input.pdf_file,
    input.category_id,
    input.author_name,
    input.status,
    input.is_featured,
    input.published_at,
    id
  );
}

export function deleteArticle(id: number) {
  db.prepare("DELETE FROM articles WHERE id = ?").run(id);
}

export function createCategory(slug: string, name: string, sortOrder: number) {
  db.prepare(
    "INSERT INTO categories (slug, name, sort_order) VALUES (?, ?, ?)"
  ).run(slug, name, sortOrder);
}

export function updateCategory(id: number, slug: string, name: string, sortOrder: number) {
  db.prepare(
    "UPDATE categories SET slug = ?, name = ?, sort_order = ? WHERE id = ?"
  ).run(slug, name, sortOrder, id);
}

export function deleteCategory(id: number) {
  db.prepare("DELETE FROM categories WHERE id = ?").run(id);
}
