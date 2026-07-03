import { Router } from "express";
import { OrderStatus, Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authMiddleware, requireRole } from "../middleware/auth";
import { paramId } from "../lib/params";

const router = Router();

router.use(authMiddleware);

async function getOrderWithAccess(orderId: string, userId: string, role: Role) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { project: true },
  });

  if (!order) return null;
  if (role === Role.CLIENT && order.project.clientId !== userId) return null;
  return order;
}

router.get("/", async (req, res) => {
  try {
    const { projectId } = req.query;

    const projectFilter =
      req.user!.role === Role.DEVELOPER
        ? projectId
          ? { projectId: String(projectId) }
          : {}
        : {
            project: { clientId: req.user!.id },
            ...(projectId ? { projectId: String(projectId) } : {}),
          };

    const orders = await prisma.order.findMany({
      where: projectFilter,
      include: {
        project: {
          select: { id: true, name: true, clientId: true },
        },
        _count: { select: { tasks: true } },
      },
      orderBy: [{ status: "asc" }, { position: "asc" }],
    });

    res.json({ orders });
  } catch (error) {
    console.error("Orders list error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.get("/kanban", async (req, res) => {
  try {
    const { projectId } = req.query;

    const where =
      req.user!.role === Role.DEVELOPER
        ? projectId
          ? { projectId: String(projectId) }
          : {}
        : {
            project: { clientId: req.user!.id },
            ...(projectId ? { projectId: String(projectId) } : {}),
          };

    const orders = await prisma.order.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
    });

    const columns: Record<OrderStatus, typeof orders> = {
      NEW: [],
      IN_PROGRESS: [],
      REVIEW: [],
      COMPLETED: [],
      CANCELLED: [],
    };

    for (const order of orders) {
      columns[order.status].push(order);
    }

    res.json({ columns });
  } catch (error) {
    console.error("Kanban error:", error);
    res.status(500).json({ error: "Failed to fetch kanban board" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: paramId(req.params.id) },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            clientId: true,
            client: {
              select: {
                profile: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        tasks: {
          orderBy: [{ position: "asc" }, { createdAt: "desc" }],
          include: {
            _count: { select: { comments: true, attachments: true } },
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
              select: { profile: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
    });

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    if (req.user!.role === Role.CLIENT && order.project.clientId !== req.user!.id) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    res.json({ order });
  } catch (error) {
    console.error("Order detail error:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

router.post("/", requireRole(Role.DEVELOPER), async (req, res) => {
  try {
    const { projectId, title, description, status, deadline, budget } = req.body;

    if (!projectId || !title) {
      res.status(400).json({ error: "projectId and title are required" });
      return;
    }

    const maxPosition = await prisma.order.aggregate({
      where: { projectId, status: status || OrderStatus.NEW },
      _max: { position: true },
    });

    const order = await prisma.order.create({
      data: {
        projectId,
        title,
        description,
        status: status || OrderStatus.NEW,
        deadline: deadline ? new Date(deadline) : null,
        budget: budget != null && budget !== "" ? budget : null,
        position: (maxPosition._max.position ?? -1) + 1,
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({ order });
  } catch (error) {
    console.error("Order create error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const existing = await getOrderWithAccess(paramId(req.params.id), req.user!.id, req.user!.role);
    if (!existing) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const isDeveloper = req.user!.role === Role.DEVELOPER;
    const { title, description, status, deadline, position, budget } = req.body;

    if (!isDeveloper && (title !== undefined || description !== undefined)) {
      res.status(403).json({ error: "Clients can only update status" });
      return;
    }

    const order = await prisma.order.update({
      where: { id: paramId(req.params.id) },
      data: {
        ...(title !== undefined && isDeveloper && { title }),
        ...(description !== undefined && isDeveloper && { description }),
        ...(status !== undefined && { status }),
        ...(deadline !== undefined && isDeveloper && { deadline: deadline ? new Date(deadline) : null }),
        ...(position !== undefined && isDeveloper && { position }),
        ...(budget !== undefined && isDeveloper && { budget: budget === null || budget === "" ? null : budget }),
      },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    res.json({ order });
  } catch (error) {
    console.error("Order update error:", error);
    res.status(500).json({ error: "Failed to update order" });
  }
});

router.delete("/:id", requireRole(Role.DEVELOPER), async (req, res) => {
  try {
    await prisma.order.delete({ where: { id: paramId(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    console.error("Order delete error:", error);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

export default router;
