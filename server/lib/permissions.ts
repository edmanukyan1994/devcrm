import { Role } from "@prisma/client";

export function isOwner(role: Role | string | undefined): boolean {
  return role === Role.OWNER;
}

export function isStaff(role: Role | string | undefined): boolean {
  return role === Role.OWNER || role === Role.DEVELOPER;
}

export function isClient(role: Role | string | undefined): boolean {
  return role === Role.CLIENT;
}

export const STAFF_ROLES: Role[] = [Role.OWNER, Role.DEVELOPER];
