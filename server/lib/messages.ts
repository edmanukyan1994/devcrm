import { Role } from "@prisma/client";
import { isStaff, STAFF_ROLES } from "./permissions";
import { prisma } from "./prisma";
import { notifyUser } from "./notifications";

const userBrief = {
  id: true,
  email: true,
  role: true,
  profile: {
    select: { firstName: true, lastName: true, company: true },
  },
};

export async function getOrCreateDirectConversation(userA: string, userB: string, projectId?: string) {
  if (projectId) {
    const existing = await prisma.conversation.findUnique({
      where: { projectId },
      include: { participants: true },
    });
    if (existing) return existing;
  }

  const shared = await prisma.conversation.findFirst({
    where: {
      projectId: projectId ?? null,
      AND: [
        { participants: { some: { userId: userA } } },
        { participants: { some: { userId: userB } } },
      ],
    },
    include: { participants: true },
  });

  if (shared) return shared;

  return prisma.conversation.create({
    data: {
      projectId,
      participants: {
        create: [{ userId: userA }, { userId: userB }],
      },
    },
    include: { participants: true },
  });
}

export async function createProjectConversation(projectId: string, developerId: string, clientId: string) {
  const existing = await prisma.conversation.findUnique({ where: { projectId } });
  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      projectId,
      participants: {
        create: [{ userId: developerId }, { userId: clientId }],
      },
    },
  });
}

export async function notifyNewMessage(
  conversationId: string,
  senderId: string,
  content: string,
  senderName: string
) {
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId, NOT: { userId: senderId } },
    select: { userId: true },
  });

  const preview = content.length > 80 ? `${content.slice(0, 80)}…` : content;

  await Promise.all(
    participants.map((p) =>
      notifyUser(p.userId, `Сообщение от ${senderName}`, preview, `/messages/${conversationId}`)
    )
  );
}

export async function getDevelopers() {
  return prisma.user.findMany({
    where: { role: { in: STAFF_ROLES } },
    select: userBrief,
  });
}

export async function getSenderName(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profile: { select: { firstName: true, lastName: true } } },
  });
  if (!user?.profile) return "Пользователь";
  return `${user.profile.firstName} ${user.profile.lastName}`.trim();
}
