import { Role } from "@prisma/client";
import { isStaff } from "./permissions";

export async function resolveRegistrationRoleAsync(
  requestedRole: string | undefined,
  inviteCode: string | undefined,
  staffCount: number
): Promise<Role> {
  if (requestedRole === "DEVELOPER") {
    const expected = process.env.DEVELOPER_INVITE_CODE;
    if (expected && inviteCode === expected) {
      return Role.DEVELOPER;
    }
    if (staffCount === 0) {
      return Role.DEVELOPER;
    }
    throw new Error("INVALID_DEVELOPER_INVITE");
  }

  if (staffCount === 0) {
    return Role.DEVELOPER;
  }

  return Role.CLIENT;
}

export function isValidDeveloperInvite(inviteCode: string | undefined): boolean {
  const expected = process.env.DEVELOPER_INVITE_CODE;
  if (!expected) return false;
  return inviteCode === expected;
}

export { isStaff };
