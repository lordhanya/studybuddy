import { prisma } from "../../lib/prisma.js";
import { hashPassword, generateToken, setSessionCookie } from "../../lib/auth.js";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  try {
    const { fullName, email, password } = req.body || {};
    const normalizedName = String(fullName || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedName || !normalizedEmail || !password) {
      res.status(400).json({ message: "Invalid input" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      res.status(400).json({ message: "Invalid input" });
      return;
    }
    if (password.length < 8 || password.length > 72) {
      res.status(400).json({ message: "Invalid input" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      // Generic message to avoid leaking whether this email is registered.
      res.status(409).json({ message: "Account creation failed" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { fullName: normalizedName, email: normalizedEmail, passwordHash },
      select: { id: true, fullName: true, email: true },
    });

    const token = generateToken();
    await prisma.session.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    });
    setSessionCookie(res, token, new Date(Date.now() + SESSION_TTL_MS));

    res.status(201).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
}
