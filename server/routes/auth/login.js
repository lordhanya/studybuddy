import { prisma } from "../../lib/prisma.js";
import { comparePassword, generateToken, setSessionCookie } from "../../lib/auth.js";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  try {
    const { email, password } = req.body || {};
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      // Always run bcrypt against a dummy hash so a missing user doesn't short-circuit.
      try {
        await comparePassword(password, "$2b$12$abcdefghijklmnopqrstuv");
      } catch {
        // Ignore; the hash is intentionally invalid. We just want constant work.
      }
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // Invalidate any existing sessions for this user (single-session simplicity)
    await prisma.session.deleteMany({ where: { userId: user.id } });

    const token = generateToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await prisma.session.create({
      data: { token, userId: user.id, expiresAt },
    });
    setSessionCookie(res, token, expiresAt);

    res.json({ user: { id: user.id, fullName: user.fullName, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
}
