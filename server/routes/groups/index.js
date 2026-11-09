import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../lib/middleware.js";

async function listGroups(req, res) {
  const memberships = await prisma.groupMember.findMany({
    where: { userId: req.user.id },
    include: {
      group: {
        include: {
          _count: { select: { members: true } },
          creator: { select: { id: true, fullName: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const groups = memberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    description: m.group.description,
    inviteCode: m.group.inviteCode,
    role: m.role,
    memberCount: m.group._count.members,
    isOwner: m.group.createdBy === req.user.id,
    createdBy: m.group.creator,
  }));

  res.json(groups);
}

async function createGroup(req, res) {
  const { name, description } = req.body || {};

  const cleanName = String(name || "").trim();
  const cleanDescription = String(description || "").trim();

  if (!cleanName) {
    res.status(400).json({ message: "Group name is required" });
    return;
  }

  const crypto = await import("crypto");
  const inviteCode = crypto.randomBytes(4).toString("hex").toUpperCase();

  const group = await prisma.$transaction(async (tx) => {
    const g = await tx.studyGroup.create({
      data: {
        name: cleanName,
        description: cleanDescription || null,
        inviteCode,
        createdBy: req.user.id,
      },
    });
    await tx.groupMember.create({
      data: { groupId: g.id, userId: req.user.id, role: "OWNER" },
    });
    return g;
  });

  res.status(201).json({
    id: group.id,
    name: group.name,
    description: group.description,
    inviteCode,
    role: "OWNER",
    memberCount: 1,
    isOwner: true,
  });
}

export default async function handler(req, res) {
  if (req.method === "GET") return requireAuth(listGroups)(req, res);
  if (req.method === "POST") return requireAuth(createGroup)(req, res);
  res.status(405).json({ message: "Method not allowed" });
}
