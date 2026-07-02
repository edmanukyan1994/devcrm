import { Router } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const { from, to, projectId } = req.query;

    const now = new Date();
    const startDate = from ? new Date(String(from)) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = to
      ? new Date(String(to))
      : new Date(now.getFullYear(), now.getMonth() + 2, 0);

    const [tasks, orders] = await Promise.all([
      prisma.task.findMany({
        where: {
          deadline: { gte: startDate, lte: endDate },
          ...(req.user!.role === Role.CLIENT
            ? { order: { project: { clientId: req.user!.id } } }
            : projectId
              ? { order: { projectId: String(projectId) } }
              : {}),
        },
        include: {
          order: {
            select: {
              id: true,
              title: true,
              project: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { deadline: "asc" },
      }),
      prisma.order.findMany({
        where: {
          deadline: { gte: startDate, lte: endDate },
          ...(req.user!.role === Role.CLIENT
            ? { project: { clientId: req.user!.id } }
            : projectId
              ? { projectId: String(projectId) }
              : {}),
        },
        include: {
          project: { select: { id: true, name: true } },
        },
        orderBy: { deadline: "asc" },
      }),
    ]);

    const events = [
      ...orders.map((order) => ({
        id: order.id,
        type: "order" as const,
        title: order.title,
        deadline: order.deadline,
        status: order.status,
        project: order.project,
      })),
      ...tasks.map((task) => ({
        id: task.id,
        type: "task" as const,
        title: task.title,
        deadline: task.deadline,
        status: task.status,
        priority: task.priority,
        order: task.order,
      })),
    ].sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

    res.json({ events, range: { from: startDate, to: endDate } });
  } catch (error) {
    console.error("Timeline error:", error);
    res.status(500).json({ error: "Failed to fetch timeline" });
  }
});

export default router;
