export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("ar", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function slugify(input: string): string {
  // NOTE: dynamic routes on this deployment do not reliably resolve
  // non-ASCII (e.g. Arabic) slugs, which previously caused published
  // articles with auto-generated Arabic slugs to 404 on the live site.
  // To avoid that, we only keep ASCII letters/digits/hyphens here, and
  // fall back to a safe generated slug when nothing ASCII remains.
  const base = input
    .trim()
    .replace(/[ً-ٟ]/g, "") // strip Arabic diacritics
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]+/g, "")
    .toLowerCase()
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `article-${Date.now()}`;
}
