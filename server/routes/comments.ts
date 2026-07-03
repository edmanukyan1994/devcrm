import { Router } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { paramId } from "../lib/params";
import { notifyUser } from "../lib/notifications";
import { getSenderName } from "../lib/messages";
import { canAccessProject, canAccessOrder, canAccessTask } from "../lib/access";

const router = Router();
const userSelect = {
  id: true,
  role: true,
  profile: { select: { firstName: true, lastName: true, avatar: true } },
};

router.use(authMiddleware);

async function listComments(where: { taskId?: string; orderId?: string; projectId?: string }) {
  return prisma.comment.findMany({
    where,
    include: { user: { select: userSelect } },
    orderBy: { createdAt: "asc" },
  });
}

router.get("/project/:projectId", async (req, res) => {
  const projectId = paramId(req.params.projectId);
  const allowed = await canAccessProject(projectId, req.user!.id, req.user!.role);
  if (!allowed) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json({ comments: await listComments({ projectId }) });
});

router.get("/order/:orderId", async (req, res) => {
  const orderId = paramId(req.params.orderId);
  const allowed = await canAccessOrder(orderId, req.user!.id, req.user!.role);
  if (!allowed) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json({ comments: await listComments({ orderId }) });
});

router.get("/task/:taskId", async (req, res) => {
  const taskId = paramId(req.params.taskId);
  const allowed = await canAccessTask(taskId, req.user!.id, req.user!.role);
  if (!allowed) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json({ comments: await listComments({ taskId }) });
});

router.post("/", async (req, res) => {
  try {
    const { taskId, orderId, projectId, content } = req.body;
    const targets = [taskId, orderId, projectId].filter(Boolean);
    if (targets.length !== 1 || !content?.trim()) {
      res.status(400).json({ error: "Exactly one of taskId, orderId, projectId and content required" });
      return;
    }

    let allowed = false;
    let notifyLink = "";
    let notifyTitle = "";
    let clientId: string | undefined;

    if (taskId) {
      allowed = await canAccessTask(taskId, req.user!.id, req.user!.role);
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { order: { include: { project: true } } },
      });
      if (task) {
        notifyLink = `/tasks/${taskId}`;
        notifyTitle = `Комментарий: ${task.title}`;
        clientId = task.order.project.clientId;
      }
    } else if (orderId) {
      allowed = await canAccessOrder(orderId, req.user!.id, req.user!.role);
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { project: true },
      });
      if (order) {
        notifyLink = `/orders/${orderId}`;
        notifyTitle = `Комментарий к заказу: ${order.title}`;
        clientId = order.project.clientId;
      }
    } else if (projectId) {
      allowed = await canAccessProject(projectId, req.user!.id, req.user!.role);
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (project) {
        notifyLink = `/projects/${projectId}`;
        notifyTitle = `Комментарий к проекту: ${project.name}`;
        clientId = project.clientId;
      }
    }

    if (!allowed) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        taskId: taskId || null,
        orderId: orderId || null,
        projectId: projectId || null,
        userId: req.user!.id,
        content: content.trim(),
      },
      include: { user: { select: userSelect } },
    });

    const senderName = await getSenderName(req.user!.id);
    const preview = `${senderName}: ${content.trim().slice(0, 100)}`;

    if (req.user!.role === Role.DEVELOPER && clientId) {
      await notifyUser(clientId, notifyTitle, preview, notifyLink);
    } else if (req.user!.role === Role.CLIENT) {
      const developers = await prisma.user.findMany({ where: { role: Role.DEVELOPER }, select: { id: true } });
      await Promise.all(developers.map((d) => notifyUser(d.id, notifyTitle, preview, notifyLink)));
    }

    res.status(201).json({ comment });
  } catch (error) {
    console.error("Comment create error:", error);
    res.status(500).json({ error: "Failed to create comment" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: paramId(req.params.id) },
      include: {
        task: { include: { order: { include: { project: true } } } },
        order: { include: { project: true } },
        project: true,
      },
    });

    if (!comment) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }

    const isOwner = comment.userId === req.user!.id;
    const isDeveloper = req.user!.role === Role.DEVELOPER;
    if (!isOwner && !isDeveloper) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await prisma.comment.delete({ where: { id: paramId(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

export default router;
