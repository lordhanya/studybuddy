import { prisma } from "../../lib/prisma.js";
import { getSessionToken, clearSessionCookie } from "../../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  try {
    const token = getSessionToken(req);
    if (token) {
      await prisma.session.deleteMany({ where: { token } });
    }
    clearSessionCookie(res);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Logout failed" });
  }
}
