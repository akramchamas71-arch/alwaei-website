"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { verifyCredentials, createSession, destroySession, getSessionUser } from "@/lib/auth";
import {
  createArticle,
  updateArticle,
  deleteArticle,
  createCategory,
  updateCategory,
  deleteCategory,
  type ArticleInput,
} from "@/lib/data";
import { slugify } from "@/lib/format";
import fs from "node:fs";
import path from "node:path";

export async function loginAction(_prevState: unknown, formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const user = await verifyCredentials(email, password);
  if (!user) {
    return { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." };
  }
  await createSession(user);
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

async function requireAuth() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  return user;
}

async function saveUploadedImage(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || ".jpg";
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  fs.writeFileSync(path.join(uploadsDir, filename), bytes);
  return `/uploads/${filename}`;
}

export async function saveArticleAction(formData: FormData) {
  await requireAuth();

  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const title = String(formData.get("title") || "").trim();
  const excerpt = String(formData.get("excerpt") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const categoryId = Number(formData.get("category_id"));
  const authorName = String(formData.get("author_name") || "").trim();
  const status = (formData.get("status") === "draft" ? "draft" : "published") as
    | "draft"
    | "published";
  const isFeatured = formData.get("is_featured") ? 1 : 0;
  const publishedAt = String(formData.get("published_at") || new Date().toISOString().slice(0, 10));
  let slug = String(formData.get("slug") || "").trim();
  if (!slug) slug = slugify(title);

  const imageFile = formData.get("cover_image") as File | null;
  const uploadedPath = await saveUploadedImage(imageFile);
  const existingImage = String(formData.get("existing_cover_image") || "") || null;

  const input: ArticleInput = {
    slug,
    title,
    excerpt,
    content,
    cover_image: uploadedPath || existingImage,
    category_id: categoryId,
    author_name: authorName || "الوعي",
    status,
    is_featured: isFeatured,
    published_at: publishedAt,
  };

  if (id) {
    updateArticle(id, input);
  } else {
    createArticle(input);
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteArticleAction(formData: FormData) {
  await requireAuth();
  const id = Number(formData.get("id"));
  deleteArticle(id);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function saveCategoryAction(formData: FormData) {
  await requireAuth();
  const id = formData.get("id") ? Number(formData.get("id")) : null;
  const name = String(formData.get("name") || "").trim();
  let slug = String(formData.get("slug") || "").trim();
  if (!slug) slug = slugify(name);
  const sortOrder = Number(formData.get("sort_order") || 0);

  if (id) {
    updateCategory(id, slug, name, sortOrder);
  } else {
    createCategory(slug, name, sortOrder);
  }
  revalidatePath("/");
  revalidatePath("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAuth();
  const id = Number(formData.get("id"));
  deleteCategory(id);
  revalidatePath("/");
  revalidatePath("/admin/categories");
}
