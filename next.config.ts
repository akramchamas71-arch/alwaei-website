import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // baileys (the WhatsApp linked-device library) optionally reaches for
  // jimp/sharp/link-preview-js/audio-decode at runtime via a try/caught
  // dynamic import, for image/link-preview features this app never uses.
  // Those packages aren't installed, and the bundler statically tries to
  // resolve every dynamic import regardless of the surrounding try/catch,
  // which fails the build. Marking the package external leaves it to
  // Node's own module resolution at runtime instead of being traced and
  // bundled, so the unused optional branches never get resolved at all.
  serverExternalPackages: ["baileys", "pino"],
  experimental: {
    // Next.js caps Server Action request bodies at 1MB by default. The
    // admin article form submits the cover image (and now, optionally, a
    // PDF attachment) as part of the same Server Action request, and a
    // single photo from a phone is often well over 1MB on its own — so
    // every save with an image attached was silently rejected with a
    // "Body exceeded 1 MB limit" 413 error. Raised to accommodate a
    // decent-sized cover image plus a PDF article attachment together.
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
