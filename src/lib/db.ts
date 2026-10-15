import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "alwaei.db");

// Singleton connection (survives across hot-reloads in dev)
const globalForDb = globalThis as unknown as { __alwaei_db?: DatabaseSync };

export const db: DatabaseSync =
  globalForDb.__alwaei_db ?? new DatabaseSync(DB_PATH);

if (!globalForDb.__alwaei_db) {
  globalForDb.__alwaei_db = db;
}

db.exec(`
  PRAGMA busy_timeout = 10000;
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    cover_image TEXT,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    author_name TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'published',
    is_featured INTEGER NOT NULL DEFAULT 0,
    views INTEGER NOT NULL DEFAULT 0,
    published_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
  CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
  CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);

  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT 'المشرف',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Migration: add external_url to articles if it doesn't exist yet (used for
// linking a book/article to an external order or promo page).
//
// Next's production build spins up several worker processes that each
// import this module against the same on-disk database file at roughly
// the same time. The PRAGMA check below can pass in more than one worker
// before any of them finishes the ALTER TABLE, so the ALTER itself is
// wrapped in a try/catch and a "duplicate column" failure from losing
// that race is swallowed rather than crashing the build.
const articleColumns = db.prepare("PRAGMA table_info(articles)").all() as {
  name: string;
}[];
if (!articleColumns.some((c) => c.name === "external_url")) {
  try {
    db.exec("ALTER TABLE articles ADD COLUMN external_url TEXT");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!/duplicate column/i.test(message)) {
      throw err;
    }
  }
}

// Migration: add pdf_file to articles if it doesn't exist yet. Stores the
// path (e.g. /uploads/169...-123.pdf) to an admin-uploaded PDF for the
// article — used both for "download this article as PDF" and for
// PDF-only articles that have no typed content at all. Same
// parallel-worker race guard as the migration above.
const articleColumnsForPdf = db.prepare("PRAGMA table_info(articles)").all() as {
  name: string;
}[];
if (!articleColumnsForPdf.some((c) => c.name === "pdf_file")) {
  try {
    db.exec("ALTER TABLE articles ADD COLUMN pdf_file TEXT");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!/duplicate column/i.test(message)) {
      throw err;
    }
  }
}

// One-time correction: the admin display name was seeded with a misspelling
// of the author's surname (شمس instead of شمص).
db.exec(
  `UPDATE admin_users SET name = 'أكرم شمص' WHERE name = 'أكرم شمس'`
);

export function getSetting(key: string, fallback = ""): string {
  const row = db
    .prepare("SELECT value FROM site_settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value ?? fallback;
}

export function setSetting(key: string, value: string) {
  db.prepare(
    `INSERT INTO site_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, value);
}
