import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { paramId } from "../lib/params";

const router = Router();

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg|pdf)$/i.test(file.originalname);
    if (allowed) cb(null, true);
    else cb(new Error("Only images and PDF files are allowed"));
  },
});

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

    const attachments = await prisma.attachment.findMany({
      where: { taskId: paramId(req.params.taskId) },
      include: {
        uploadedBy: {
          select: {
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ attachments });
  } catch (error) {
    console.error("Attachments list error:", error);
    res.status(500).json({ error: "Failed to fetch attachments" });
  }
});

router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { taskId } = req.body;

    if (!taskId || !req.file) {
      res.status(400).json({ error: "taskId and file are required" });
      return;
    }

    const allowed = await canAccessTask(taskId, req.user!.id, req.user!.role);
    if (!allowed) {
      fs.unlinkSync(req.file.path);
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const attachment = await prisma.attachment.create({
      data: {
        taskId,
        uploadedById: req.user!.id,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: `/uploads/${req.file.filename}`,
      },
      include: {
        uploadedBy: {
          select: {
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    res.status(201).json({ attachment });
  } catch (error) {
    console.error("Attachment upload error:", error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: "Failed to upload attachment" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: paramId(req.params.id) },
    });

    if (!attachment) {
      res.status(404).json({ error: "Attachment not found" });
      return;
    }

    const allowed = await canAccessTask(attachment.taskId, req.user!.id, req.user!.role);
    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const filePath = path.join(uploadsDir, attachment.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await prisma.attachment.delete({ where: { id: paramId(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    console.error("Attachment delete error:", error);
    res.status(500).json({ error: "Failed to delete attachment" });
  }
});

export default router;
