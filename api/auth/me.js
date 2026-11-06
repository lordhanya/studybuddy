import { prisma } from "../lib/prisma.js";
import { getSessionToken } from "../lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  try {
    const token = getSessionToken(req);
    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || new Date(session.expiresAt) < new Date()) {
      if (session) await prisma.session.delete({ where: { id: session.id } });
      res.status(401).json({ message: "Session expired" });
      return;
    }

    res.json({ user: { id: session.user.id, fullName: session.user.fullName, email: session.user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load session" });
  }
}
