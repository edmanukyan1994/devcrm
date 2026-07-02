import { Router } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { paramId } from "../lib/params";
import { notifyUser } from "../lib/notifications";
import { getSenderName } from "../lib/messages";

const router = Router();

router.use(authMiddleware);

async function canAccessTask(taskId: string, userId: string, role: Role) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { order: { include: { project: true } } },
  });

  if (!task) return false;
  if (role === Role.DEVELOPER) return true;
  return task.order.project.clientId === userId;
}

router.get("/task/:taskId", async (req, res) => {
  try {
    const allowed = await canAccessTask(paramId(req.params.taskId), req.user!.id, req.user!.role);
    if (!allowed) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const comments = await prisma.comment.findMany({
      where: { taskId: paramId(req.params.taskId) },
      include: {
        user: {
          select: {
            id: true,
            role: true,
            profile: { select: { firstName: true, lastName: true, avatar: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json({ comments });
  } catch (error) {
    console.error("Comments list error:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { taskId, content } = req.body;

    if (!taskId || !content?.trim()) {
      res.status(400).json({ error: "taskId and content are required" });
      return;
    }

    const allowed = await canAccessTask(taskId, req.user!.id, req.user!.role);
    if (!allowed) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        taskId,
        userId: req.user!.id,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            role: true,
            profile: { select: { firstName: true, lastName: true, avatar: true } },
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            order: {
              select: {
                project: { select: { clientId: true } },
              },
            },
          },
        },
      },
    });

    const clientId = comment.task.order.project.clientId;
    const senderName = await getSenderName(req.user!.id);
    const notifyTarget =
      req.user!.role === Role.DEVELOPER ? clientId : undefined;

    if (notifyTarget) {
      await notifyUser(
        notifyTarget,
        `Комментарий: ${comment.task.title}`,
        `${senderName}: ${content.trim().slice(0, 100)}`,
        `/tasks/${taskId}`
      );
    } else if (req.user!.role === Role.CLIENT) {
      const developers = await prisma.user.findMany({
        where: { role: Role.DEVELOPER },
        select: { id: true },
      });
      await Promise.all(
        developers.map((d) =>
          notifyUser(
            d.id,
            `Комментарий: ${comment.task.title}`,
            `${senderName}: ${content.trim().slice(0, 100)}`,
            `/tasks/${taskId}`
          )
        )
      );
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
      include: { task: { include: { order: { include: { project: true } } } } },
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
    console.error("Comment delete error:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

export default router;
