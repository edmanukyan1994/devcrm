import { Role } from "@prisma/client";
import { prisma } from "./prisma";

const userSelect = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
  profile: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      company: true,
      phone: true,
      avatar: true,
    },
  },
};

export async function ensureOwnerByEmail(userId: string, email: string) {
  const ownerEmail = process.env.OWNER_EMAIL?.toLowerCase().trim();
  if (!ownerEmail || email.toLowerCase() !== ownerEmail) {
    return prisma.user.findUnique({ where: { id: userId }, select: userSelect });
  }

  return prisma.user.update({
    where: { id: userId },
    data: { role: Role.OWNER },
    select: userSelect,
  });
}

export { userSelect };
