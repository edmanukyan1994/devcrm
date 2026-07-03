import type { Role } from "@/types";

export function isOwner(role?: Role | null): boolean {
  return role === "OWNER";
}

export function isStaff(role?: Role | null): boolean {
  return role === "OWNER" || role === "DEVELOPER";
}

export function roleLabel(role?: Role | null): string {
  if (role === "OWNER") return "Руководитель";
  if (role === "DEVELOPER") return "Исполнитель";
  return "Заказчик";
}
