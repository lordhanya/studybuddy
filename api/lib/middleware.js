import { prisma } from "./prisma.js";
import { getSessionToken } from "./auth.js";

export function requireAuth(handler) {
  return async (req, res) => {
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

    req.user = session.user;
    return handler(req, res);
  };
}

export function runMiddleware(handler) {
  return handler;
}
