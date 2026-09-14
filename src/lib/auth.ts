import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "./db";

const SESSION_COOKIE = "alwaei_session";
const secretEnv = process.env.SESSION_SECRET || "change-this-secret-in-production-please";
const secret = new TextEncoder().encode(secretEnv);

export type AdminUser = {
  id: number;
  email: string;
  name: string;
};

export async function verifyCredentials(
  email: string,
  password: string
): Promise<AdminUser | null> {
  const row = db
    .prepare("SELECT id, email, password_hash, name FROM admin_users WHERE email = ?")
    .get(email) as
    | { id: number; email: string; password_hash: string; name: string }
    | undefined;
  if (!row) return null;
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return null;
  return { id: row.id, email: row.email, name: row.name };
}

export async function createSession(user: AdminUser) {
  const token = await new SignJWT({ id: user.id, email: user.email, name: user.name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      id: payload.id as number,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export { SESSION_COOKIE };
