import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { createArticle } from "@/lib/data";
import { slugify } from "@/lib/format";

// Machine publishing endpoint, used by the n8n automation that posts the
// daily «ملخص آخر التطورات» brief. Disabled unless PUBLISH_API_TOKEN is set
// in the service's environment; callers must send
//   Authorization: Bearer <PUBLISH_API_TOKEN>
// The admin session cookie is NOT accepted here, and this endpoint can only
// create articles (never edit or delete existing ones).
export const dynamic = "force-dynamic";

function tokenMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function uniqueSlug(base: string): string {
  const exists = db.prepare("SELECT 1 FROM articles WHERE slug = ?");
  if (!exists.get(base)) return base;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}-${i}`;
    if (!exists.get(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export async function POST(req: NextRequest) {
  const expected = process.env.PUBLISH_API_TOKEN || "";
  if (expected.length < 24) {
    return NextResponse.json({ error: "publishing API is disabled" }, { status: 503 });
  }

  const auth = req.headers.get("authorization") || "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!provided || !tokenMatches(provided, expected)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const title = str(body.title);
  const content = str(body.content);
  if (!title || !content) {
    return NextResponse.json({ error: "title and content are required" }, { status: 400 });
  }
  if (title.length > 300 || content.length > 200_000) {
    return NextResponse.json({ error: "title or content too long" }, { status: 413 });
  }

  // Category by slug (preferred) or numeric id; defaults to "politics".
  const categorySlug = str(body.category_slug) || "politics";
  let category = db
    .prepare("SELECT id FROM categories WHERE slug = ?")
    .get(categorySlug) as { id: number } | undefined;
  if (!category && typeof body.category_id === "number") {
    category = db
      .prepare("SELECT id FROM categories WHERE id = ?")
      .get(body.category_id) as { id: number } | undefined;
  }
  if (!category) {
    return NextResponse.json({ error: `unknown category: ${categorySlug}` }, { status: 400 });
  }

  const publishedAt = /^\d{4}-\d{2}-\d{2}$/.test(str(body.published_at))
    ? str(body.published_at)
    : new Date().toISOString().slice(0, 10);
  const status = body.status === "draft" ? "draft" : "published";
  const slug = uniqueSlug(slugify(str(body.slug) || title));

  const id = createArticle({
    slug,
    title,
    excerpt: str(body.excerpt).slice(0, 1000),
    content,
    cover_image: null,
    pdf_file: null,
    category_id: category.id,
    author_name: str(body.author_name) || "الوعي",
    status,
    is_featured: body.is_featured === true ? 1 : 0,
    published_at: publishedAt,
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/category/${categorySlug}`);

  return NextResponse.json({ id, slug, status, url: `/article/${slug}` }, { status: 201 });
}
