import { Router } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authMiddleware, requireRole } from "../middleware/auth";
import { paramId } from "../lib/params";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const where =
      req.user!.role === Role.DEVELOPER ? {} : { clientId: req.user!.id };

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

router.post("/", requireRole(Role.DEVELOPER), async (req, res) => {
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

    res.status(201).json({ project });
  } catch (error) {
    console.error("Project create error:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

router.patch("/:id", requireRole(Role.DEVELOPER), async (req, res) => {
  try {
    const { name, description, clientId } = req.body;

    const project = await prisma.project.update({
      where: { id: paramId(req.params.id) },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(clientId !== undefined && { clientId }),
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

router.delete("/:id", requireRole(Role.DEVELOPER), async (req, res) => {
  try {
    await prisma.project.delete({ where: { id: paramId(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    console.error("Project delete error:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

export default router;
