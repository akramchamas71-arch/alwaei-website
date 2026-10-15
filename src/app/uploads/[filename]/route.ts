import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

// Uploaded article images and PDF attachments are written to `data/uploads`
// (see src/app/admin/actions.ts) because that directory sits on Railway's
// persistent volume, unlike `public/`, which is rebuilt from git on every
// deploy. This route serves those files back out at the same `/uploads/...`
// URL the rest of the site already expects.
export const dynamic = "force-dynamic";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".pdf": "application/pdf",
};

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/uploads/[filename]">
) {
  const { filename } = await ctx.params;

  // A route param for a single `[filename]` segment can never contain a
  // "/", but guard against ".." and an empty value defensively anyway.
  if (!filename || filename.includes("..")) {
    return new NextResponse("غير موجود", { status: 404 });
  }

  const filePath = path.join(process.cwd(), "data", "uploads", filename);
  if (!fs.existsSync(filePath)) {
    return new NextResponse("غير موجود", { status: 404 });
  }

  const ext = path.extname(filename).toLowerCase();
  const body = fs.readFileSync(filePath);

  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
