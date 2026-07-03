import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { paramId } from "../lib/params";
import { fileUpload, deleteUploadFile, toPublicPath } from "../lib/upload";
import { canAccessProject, canAccessOrder, canAccessTask } from "../lib/access";

const router = Router();

router.use(authMiddleware);

const uploaderSelect = {
  profile: { select: { firstName: true, lastName: true } },
};

async function listAttachments(where: { taskId?: string; orderId?: string; projectId?: string }) {
  return prisma.attachment.findMany({
    where,
    include: { uploadedBy: { select: uploaderSelect } },
    orderBy: { createdAt: "desc" },
  });
}

router.get("/project/:projectId", async (req, res) => {
  const projectId = paramId(req.params.projectId);
  const allowed = await canAccessProject(projectId, req.user!.id, req.user!.role);
  if (!allowed) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json({ attachments: await listAttachments({ projectId }) });
});

router.get("/order/:orderId", async (req, res) => {
  const orderId = paramId(req.params.orderId);
  const allowed = await canAccessOrder(orderId, req.user!.id, req.user!.role);
  if (!allowed) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json({ attachments: await listAttachments({ orderId }) });
});

router.get("/task/:taskId", async (req, res) => {
  const taskId = paramId(req.params.taskId);
  const allowed = await canAccessTask(taskId, req.user!.id, req.user!.role);
  if (!allowed) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json({ attachments: await listAttachments({ taskId }) });
});

router.post("/", fileUpload.single("file"), async (req, res) => {
  try {
    const { taskId, orderId, projectId } = req.body;
    const targets = [taskId, orderId, projectId].filter(Boolean);

    if (targets.length !== 1 || !req.file) {
      if (req.file) deleteUploadFile(toPublicPath(req.file.filename));
      res.status(400).json({ error: "Exactly one of taskId, orderId, projectId and file required" });
      return;
    }

    let allowed = false;
    if (taskId) allowed = await canAccessTask(taskId, req.user!.id, req.user!.role);
    else if (orderId) allowed = await canAccessOrder(orderId, req.user!.id, req.user!.role);
    else if (projectId) allowed = await canAccessProject(projectId, req.user!.id, req.user!.role);

    if (!allowed) {
      deleteUploadFile(toPublicPath(req.file.filename));
      res.status(404).json({ error: "Not found" });
      return;
    }

    const attachment = await prisma.attachment.create({
      data: {
        taskId: taskId || null,
        orderId: orderId || null,
        projectId: projectId || null,
        uploadedById: req.user!.id,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: toPublicPath(req.file.filename),
      },
      include: { uploadedBy: { select: uploaderSelect } },
    });

    res.status(201).json({ attachment });
  } catch (error) {
    if (req.file) deleteUploadFile(toPublicPath(req.file.filename));
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

    let allowed = false;
    if (attachment.taskId) allowed = await canAccessTask(attachment.taskId, req.user!.id, req.user!.role);
    else if (attachment.orderId) allowed = await canAccessOrder(attachment.orderId, req.user!.id, req.user!.role);
    else if (attachment.projectId)
      allowed = await canAccessProject(attachment.projectId, req.user!.id, req.user!.role);

    if (!allowed) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    deleteUploadFile(attachment.path);
    await prisma.attachment.delete({ where: { id: paramId(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete attachment" });
  }
});

export default router;
