import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function setSessionCookie(res, token, expiresAt) {
  const maxAge = Math.floor((new Date(expiresAt) - Date.now()) / 1000);
  res.setHeader(
    "Set-Cookie",
    `session=${token}; Path=/; Max-Age=${maxAge}; HttpOnly${process.env.NODE_ENV === "production" ? "; Secure" : ""}; SameSite=Lax`
  );
}

export function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", "session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");
}

export function getSessionToken(req) {
  const cookie = req.headers.cookie || "";
  const match = cookie.match(/(?:^|;\s*)session=([^;]+)/);
  return match ? match[1] : null;
}
