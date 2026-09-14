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
  return input
    .trim()
    .replace(/[ً-ٟ]/g, "") // strip Arabic diacritics
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .toLowerCase();
}
