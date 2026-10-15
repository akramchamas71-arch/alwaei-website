import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
