import { Router } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q.length < 2) {
      res.json({ projects: [], orders: [], tasks: [] });
      return;
    }

    const isDeveloper = req.user!.role === Role.DEVELOPER;
    const projectWhere = isDeveloper
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {
          clientId: req.user!.id,
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        };

    const projects = await prisma.project.findMany({
      where: projectWhere,
      select: { id: true, name: true, description: true, coverImage: true },
      take: 10,
      orderBy: { updatedAt: "desc" },
    });

    const orderWhere = isDeveloper
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {
          project: { clientId: req.user!.id },
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        };

    const orders = await prisma.order.findMany({
      where: orderWhere,
      select: {
        id: true,
        title: true,
        status: true,
        project: { select: { id: true, name: true } },
      },
      take: 10,
      orderBy: { updatedAt: "desc" },
    });

    const taskWhere = isDeveloper
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {
          order: { project: { clientId: req.user!.id } },
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
          ],
        };

    const tasks = await prisma.task.findMany({
      where: taskWhere,
      select: {
        id: true,
        title: true,
        status: true,
        order: {
          select: {
            id: true,
            title: true,
            project: { select: { id: true, name: true } },
          },
        },
      },
      take: 10,
      orderBy: { updatedAt: "desc" },
    });

    res.json({ projects, orders, tasks, query: q });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

export default router;
