import { Role } from "@prisma/client";

export async function resolveRegistrationRoleAsync(
  requestedRole: string | undefined,
  inviteCode: string | undefined,
  developerCount: number
): Promise<Role> {
  if (requestedRole === "DEVELOPER") {
    const expected = process.env.DEVELOPER_INVITE_CODE;
    if (expected && inviteCode === expected) {
      return Role.DEVELOPER;
    }
    if (developerCount === 0) {
      return Role.DEVELOPER;
    }
    throw new Error("INVALID_DEVELOPER_INVITE");
  }

  if (developerCount === 0) {
    return Role.DEVELOPER;
  }

  return Role.CLIENT;
}

export function isValidDeveloperInvite(inviteCode: string | undefined): boolean {
  const expected = process.env.DEVELOPER_INVITE_CODE;
  if (!expected) return false;
  return inviteCode === expected;
}
