import { getSetting, setSetting } from "./db";
import { getCategoryBySlug } from "./data";

// Polls external breaking-news RSS feeds and publishes any new item as an
// ordinary article in the dedicated "breaking" (عاجل) category. The
// homepage's BreakingTicker component already renders the latest published
// articles, so nothing else needs to change for a new item to appear there
// — this module only needs to get it into the articles table.
//
// Sources are intentionally a short, explicit list: each entry needs a feed
// that reliably marks which items are actual breaking news (not just
// "breaking" in the headline text). Candidates considered and the reason
// they're not wired up yet:
//   - الجزيرة (Al Jazeera): no public RSS endpoint for the Arabic site could
//     be confirmed working at the time this was written.
//   - RT عربية (rtarabic.com/rss): feed works, but items carry no
//     <category> tag at all — "breaking" can only be guessed from the
//     headline text, which is too unreliable to auto-publish on.
// Add a source here once a feed with a real breaking-news marker is found
// for it; everything else (dedupe, publishing, the ticker) already supports
// any number of sources.
//
// Al Manar specifically uses a DEDICATED feed for this, not the generic
// /rss filtered by <category>عاجل</category>: their own homepage has an
// "الأخبار العاجلة" toggle that's powered by https://www.almanar.com.lb/c/urgent/rss,
// which is far more complete (every item is pre-filtered as urgent by
// Al Manar itself — the generic feed's <category> tag only caught a small
// fraction of what actually shows on their live ticker).
type ParsedItem = {
  guid: string;
  title: string;
  link: string;
  pubDate: string;
  categories: string[];
};

type Source = {
  key: string;
  name: string;
  url: string;
  isBreaking: (item: ParsedItem) => boolean;
};

const SOURCES: Source[] = [
  {
    key: "almanar-urgent",
    name: "قناة المنار",
    url: "https://www.almanar.com.lb/c/urgent/rss",
    // Every item in this feed is already urgent-news-only by construction
    // (it's Al Manar's own dedicated "عاجل" feed), so no further filtering
    // is needed — but keep the <category> check too as a harmless safety
    // net in case the feed ever mixes in non-urgent items.
    isBreaking: (item) => item.categories.length === 0 || item.categories.includes("عاجل"),
  },
];

const MAX_SEEN_GUIDS = 300;
const POLL_TIMEOUT_MS = 15_000;

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function extractTag(block: string, tag: string): string {
  const re = new RegExp(
    `<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`,
    "i"
  );
  const m = block.match(re);
  return m ? decodeEntities(m[1].trim()) : "";
}

function extractAllTags(block: string, tag: string): string[] {
  const re = new RegExp(
    `<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`,
    "gi"
  );
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) out.push(decodeEntities(m[1].trim()));
  return out;
}

function parseItems(xml: string): ParsedItem[] {
  const blocks = xml.split(/<item[\s>]/i).slice(1).map((b) => b.split(/<\/item>/i)[0]);
  return blocks.map((block) => ({
    guid: extractTag(block, "guid") || extractTag(block, "link"),
    title: extractTag(block, "title"),
    link: extractTag(block, "link"),
    pubDate: extractTag(block, "pubDate"),
    categories: extractAllTags(block, "category"),
  }));
}

function getSeenGuids(sourceKey: string): Set<string> {
  const raw = getSetting(`breaking_seen_${sourceKey}`, "[]");
  try {
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveSeenGuids(sourceKey: string, guids: Set<string>): void {
  const arr = Array.from(guids).slice(-MAX_SEEN_GUIDS);
  setSetting(`breaking_seen_${sourceKey}`, JSON.stringify(arr));
}

function slugForItem(link: string, title: string): string {
  const idMatch = link.match(/\/(\d{4,})\/?$/);
  if (idMatch) return `khabar-ajel-${idMatch[1]}`;
  const base = title
    .trim()
    .replace(/[ً-ٟ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]+/g, "")
    .toLowerCase()
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base ? `khabar-ajel-${base}` : `khabar-ajel-${Date.now()}`;
}

function toPublishedAt(pubDate: string): string {
  const d = pubDate ? new Date(pubDate) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

async function publishInternally(payload: Record<string, unknown>): Promise<boolean> {
  const token = process.env.PUBLISH_API_TOKEN || "";
  if (token.length < 24) {
    console.error("[breaking-news] PUBLISH_API_TOKEN not set; skipping publish");
    return false;
  }
  const port = process.env.PORT || "3000";
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/publish`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(POLL_TIMEOUT_MS),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[breaking-news] publish failed (${res.status}): ${text}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[breaking-news] publish request failed:", err);
    return false;
  }
}

let polling = false;

export async function pollBreakingNews(): Promise<void> {
  if (polling) return; // never run two polls at once
  polling = true;
  try {
    if (!getCategoryBySlug("breaking")) {
      console.error('[breaking-news] "breaking" category missing; skipping poll');
      return;
    }

    for (const source of SOURCES) {
      try {
        const res = await fetch(source.url, {
          signal: AbortSignal.timeout(POLL_TIMEOUT_MS),
          headers: { "user-agent": "alwaei-breaking-news-bot/1.0" },
        });
        if (!res.ok) {
          console.error(`[breaking-news] ${source.key}: fetch failed (${res.status})`);
          continue;
        }
        const xml = await res.text();
        const items = parseItems(xml).filter((it) => it.guid && it.title);

        const initKey = `breaking_init_${source.key}`;
        const seen = getSeenGuids(source.key);

        if (getSetting(initKey, "") !== "done") {
          // First time we've ever polled this source: remember every item
          // that's currently in the feed without publishing it, so we
          // don't flood the ticker with the source's entire backlog the
          // moment this feature goes live. Only items that appear *after*
          // this point get published.
          for (const it of items) seen.add(it.guid);
          saveSeenGuids(source.key, seen);
          setSetting(initKey, "done");
          continue;
        }

        // Oldest-first, so the ticker fills in chronological order when
        // several items land in the same 5-minute window.
        const fresh = items.filter((it) => !seen.has(it.guid) && source.isBreaking(it)).reverse();

        for (const item of fresh) {
          const ok = await publishInternally({
            title: item.title,
            slug: slugForItem(item.link, item.title),
            content: `${item.title}\n\nالمصدر: ${source.name}${item.link ? `\n${item.link}` : ""}`,
            excerpt: item.title.slice(0, 250),
            category_slug: "breaking",
            author_name: source.name,
            published_at: toPublishedAt(item.pubDate),
            status: "published",
          });
          // Mark as seen even on failure so a permanently-malformed item
          // can't block every later item from that source forever; a
          // transient failure just means that one item gets skipped.
          seen.add(item.guid);
          if (!ok) {
            console.error(`[breaking-news] ${source.key}: failed to publish "${item.title}"`);
          }
        }
        saveSeenGuids(source.key, seen);
      } catch (err) {
        console.error(`[breaking-news] ${source.key}: error`, err);
      }
    }
  } finally {
    polling = false;
  }
}
