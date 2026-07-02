import { Router } from "express";
import { Role, TaskPriority, TaskStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { paramId } from "../lib/params";

const router = Router();

router.use(authMiddleware);

async function getTaskWithAccess(taskId: string, userId: string, role: Role) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { order: { include: { project: true } } },
  });

  if (!task) return null;
  if (role === Role.CLIENT && task.order.project.clientId !== userId) return null;
  return task;
}

router.get("/order/:orderId", async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: paramId(req.params.orderId) },
      include: { project: true },
    });

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    if (req.user!.role === Role.CLIENT && order.project.clientId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const tasks = await prisma.task.findMany({
      where: { orderId: paramId(req.params.orderId) },
      include: {
        _count: { select: { comments: true, attachments: true } },
      },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    });

    res.json({ tasks });
  } catch (error) {
    console.error("Tasks list error:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: paramId(req.params.id) },
      include: {
        order: {
          select: {
            id: true,
            title: true,
            project: { select: { id: true, name: true, clientId: true } },
          },
        },
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            user: {
              select: {
                id: true,
                role: true,
                profile: { select: { firstName: true, lastName: true, avatar: true } },
              },
            },
          },
        },
        attachments: {
          orderBy: { createdAt: "desc" },
          include: {
            uploadedBy: {
              select: {
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    if (req.user!.role === Role.CLIENT && task.order.project.clientId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.json({ task });
  } catch (error) {
    console.error("Task detail error:", error);
    res.status(500).json({ error: "Failed to fetch task" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { orderId, title, description, priority, status, deadline } = req.body;

    if (!orderId || !title || !description) {
      res.status(400).json({ error: "orderId, title, and description are required" });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { project: true },
    });

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    if (req.user!.role === Role.CLIENT && order.project.clientId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const maxPosition = await prisma.task.aggregate({
      where: { orderId, status: status || TaskStatus.NEW },
      _max: { position: true },
    });

    const task = await prisma.task.create({
      data: {
        orderId,
        title,
        description,
        priority: priority || TaskPriority.MEDIUM,
        status: status || TaskStatus.NEW,
        deadline: deadline ? new Date(deadline) : null,
        position: (maxPosition._max.position ?? -1) + 1,
      },
      include: {
        _count: { select: { comments: true, attachments: true } },
      },
    });

    res.status(201).json({ task });
  } catch (error) {
    console.error("Task create error:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const existing = await getTaskWithAccess(paramId(req.params.id), req.user!.id, req.user!.role);
    if (!existing) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const isDeveloper = req.user!.role === Role.DEVELOPER;
    const { title, description, priority, status, deadline, position } = req.body;

    const task = await prisma.task.update({
      where: { id: paramId(req.params.id) },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(priority !== undefined && { priority }),
        ...(status !== undefined && { status }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(position !== undefined && isDeveloper && { position }),
      },
      include: {
        _count: { select: { comments: true, attachments: true } },
      },
    });

    res.json({ task });
  } catch (error) {
    console.error("Task update error:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const existing = await getTaskWithAccess(paramId(req.params.id), req.user!.id, req.user!.role);
    if (!existing) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    if (req.user!.role === Role.CLIENT) {
      res.status(403).json({ error: "Only developer can delete tasks" });
      return;
    }

    await prisma.task.delete({ where: { id: paramId(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    console.error("Task delete error:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;
