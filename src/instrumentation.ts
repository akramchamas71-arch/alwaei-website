// Starts the background breaking-news poller once, when the server boots.
// Next.js calls register() a single time per server process; it must not
// run in the edge runtime (there is no setInterval/background timer there)
// and must not run during `next build`.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const g = globalThis as unknown as { __alwaei_breaking_started?: boolean };
  if (g.__alwaei_breaking_started) return;
  g.__alwaei_breaking_started = true;

  const POLL_INTERVAL_MS = 5 * 60 * 1000; // كل 5 دقائق

  const run = () => {
    import("@/lib/breakingNews")
      .then(({ pollBreakingNews }) => pollBreakingNews())
      .catch((err) => console.error("[breaking-news] poll failed:", err));
  };

  // Give the server a few seconds to finish booting before the first poll.
  setTimeout(run, 15_000);
  setInterval(run, POLL_INTERVAL_MS);

  // WhatsApp itself runs as a separate standalone service on its own VPS
  // (see src/lib/whatsapp.ts) and resumes its own session on its own
  // boot — this site has nothing to do on startup for it anymore.
}
