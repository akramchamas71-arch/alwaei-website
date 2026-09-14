import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretEnv = process.env.SESSION_SECRET || "change-this-secret-in-production-please";
const secret = new TextEncoder().encode(secretEnv);

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get("alwaei_session")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    try {
      await jwtVerify(token, secret);
    } catch {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
