import { prisma } from "./prisma.js";

/**
 * Check whether a user may read an activity.
 * Access is granted when the user authored the activity, belongs to the
 * activity's group, or belongs to the group that owns its workspace.
 * Activities with no group/workspace scope are private to their author.
 */
export async function getActivityAccess(activityId, userId) {
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: { workspace: { select: { groupId: true } } },
  });

  if (!activity) {
    return { status: "not_found", activity: null };
  }

  if (activity.userId === userId) {
    return { status: "ok", activity };
  }

  const groupIds = [
    ...new Set(
      [activity.groupId, activity.workspace?.groupId].filter(Boolean)
    ),
  ];

  if (groupIds.length === 0) {
    return { status: "forbidden", activity };
  }

  const membership = await prisma.groupMember.findFirst({
    where: { userId, groupId: { in: groupIds } },
    select: { id: true },
  });

  return membership
    ? { status: "ok", activity }
    : { status: "forbidden", activity };
}

export function denyActivityAccess(res, access) {
  if (access.status === "not_found") {
    res.status(404).json({ message: "Activity not found" });
    return;
  }
  res.status(403).json({ message: "You do not have access to this activity" });
}
