import { Role } from "@prisma/client";
import { prisma } from "./prisma";
import { isStaff } from "./permissions";

export async function canAccessProject(projectId: string, userId: string, role: Role) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return false;
  if (isStaff(role)) return true;
  return project.clientId === userId;
}

export async function canAccessOrder(orderId: string, userId: string, role: Role) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { project: true },
  });
  if (!order) return false;
  if (isStaff(role)) return true;
  return order.project.clientId === userId;
}

export async function canAccessTask(taskId: string, userId: string, role: Role) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { order: { include: { project: true } } },
  });
  if (!task) return false;
  if (isStaff(role)) return true;
  return task.order.project.clientId === userId;
}
