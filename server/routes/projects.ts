import { Router } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authMiddleware, requireStaff } from "../middleware/auth";
import { isStaff } from "../lib/permissions";
import { paramId } from "../lib/params";
import { createProjectConversation } from "../lib/messages";
import { notifyUser } from "../lib/notifications";
import { imageUpload, deleteUploadFile } from "../lib/upload";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const where =
      req.user!.role && isStaff(req.user!.role) ? {} : { clientId: req.user!.id };

    const projects = await prisma.project.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true, company: true } },
          },
        },
        _count: { select: { orders: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json({ projects });
  } catch (error) {
    console.error("Projects list error:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: paramId(req.params.id) },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true, company: true } },
          },
        },
        orders: {
          orderBy: [{ status: "asc" }, { position: "asc" }],
          include: { _count: { select: { tasks: true } } },
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
              select: { profile: { select: { firstName: true, lastName: true } } },
            },
          },
        },
        _count: { select: { orders: true, comments: true, attachments: true } },
      },
    });

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    if (req.user!.role === Role.CLIENT && project.clientId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.json({ project });
  } catch (error) {
    console.error("Project detail error:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

router.post("/", requireStaff(), async (req, res) => {
  try {
    const { name, description, clientId } = req.body;

    if (!name || !clientId) {
      res.status(400).json({ error: "Name and clientId are required" });
      return;
    }

    const client = await prisma.user.findFirst({
      where: { id: clientId, role: Role.CLIENT },
    });

    if (!client) {
      res.status(400).json({ error: "Invalid client" });
      return;
    }

    const project = await prisma.project.create({
      data: { name, description, clientId },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true, company: true } },
          },
        },
      },
    });

    await createProjectConversation(project.id, req.user!.id, clientId);

    await notifyUser(
      clientId,
      "Новый проект",
      `Вам назначен проект «${name}»`,
      `/projects/${project.id}`
    );

    res.status(201).json({ project });
  } catch (error) {
    console.error("Project create error:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

router.patch("/:id", requireStaff(), async (req, res) => {
  try {
    const { name, description, clientId, coverImage, budget, status, deadline } = req.body;

    const project = await prisma.project.update({
      where: { id: paramId(req.params.id) },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(clientId !== undefined && { clientId }),
        ...(coverImage === null && { coverImage: null }),
        ...(budget !== undefined && { budget: budget === null || budget === "" ? null : budget }),
        ...(status !== undefined && { status }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true, company: true } },
          },
        },
      },
    });

    res.json({ project });
  } catch (error) {
    console.error("Project update error:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

router.post("/:id/cover", requireStaff(), imageUpload.single("file"), async (req, res) => {
  try {
    const id = paramId(req.params.id);
    if (!req.file) {
      res.status(400).json({ error: "file is required" });
      return;
    }

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      deleteUploadFile(`/uploads/${req.file.filename}`);
      res.status(404).json({ error: "Project not found" });
      return;
    }

    if (existing.coverImage) deleteUploadFile(existing.coverImage);

    const coverPath = `/uploads/${req.file.filename}`;
    const project = await prisma.project.update({
      where: { id },
      data: { coverImage: coverPath },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true, company: true } },
          },
        },
        _count: { select: { orders: true } },
      },
    });

    res.json({ project });
  } catch (error) {
    console.error("Cover upload error:", error);
    if (req.file) deleteUploadFile(`/uploads/${req.file.filename}`);
    res.status(500).json({ error: "Failed to upload cover" });
  }
});

router.delete("/:id/cover", requireStaff(), async (req, res) => {
  try {
    const id = paramId(req.params.id);
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    if (existing.coverImage) deleteUploadFile(existing.coverImage);

    const project = await prisma.project.update({
      where: { id },
      data: { coverImage: null },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true, company: true } },
          },
        },
        _count: { select: { orders: true } },
      },
    });

    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove cover" });
  }
});

router.delete("/:id", requireStaff(), async (req, res) => {
  try {
    const id = paramId(req.params.id);
    const existing = await prisma.project.findUnique({ where: { id } });
    if (existing?.coverImage) deleteUploadFile(existing.coverImage);
    await prisma.project.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error("Project delete error:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;
