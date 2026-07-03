import { Router } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { authMiddleware, requireStaff } from "../middleware/auth";
import { isStaff } from "../lib/permissions";
import { paramId } from "../lib/params";

const router = Router();

router.use(authMiddleware);

router.get("/summary", async (req, res) => {
  try {
    const isStaffUser = isStaff(req.user!.role);
    const projectWhere = isStaffUser ? {} : { clientId: req.user!.id };

    const projects = await prisma.project.findMany({
      where: projectWhere,
      select: {
        id: true,
        name: true,
        budget: true,
        orders: { select: { id: true, title: true, budget: true } },
        payments: { select: { amount: true } },
      },
    });

    const orderIds = projects.flatMap((p) => p.orders.map((o) => o.id));
    const orderPayments = orderIds.length
      ? await prisma.payment.findMany({
          where: { orderId: { in: orderIds } },
          select: { orderId: true, amount: true },
        })
      : [];

    const paidByOrder = new Map<string, number>();
    for (const p of orderPayments) {
      if (!p.orderId) continue;
      paidByOrder.set(p.orderId, (paidByOrder.get(p.orderId) || 0) + Number(p.amount));
    }

    const items = projects.map((project) => {
      const projectPaid = project.payments.reduce((s, p) => s + Number(p.amount), 0);
      const ordersBudget = project.orders.reduce((s, o) => s + Number(o.budget || 0), 0);
      const ordersPaid = project.orders.reduce((s, o) => s + (paidByOrder.get(o.id) || 0), 0);
      const budget = Number(project.budget || 0) || ordersBudget;
      const paid = projectPaid + ordersPaid;
      return {
        id: project.id,
        name: project.name,
        budget,
        paid,
        remaining: Math.max(0, budget - paid),
      };
    });

    const totalBudget = items.reduce((s, i) => s + i.budget, 0);
    const totalPaid = items.reduce((s, i) => s + i.paid, 0);

    res.json({
      summary: {
        totalBudget,
        totalPaid,
        totalRemaining: Math.max(0, totalBudget - totalPaid),
        projects: items,
      },
    });
  } catch (error) {
    console.error("Finance summary error:", error);
    res.status(500).json({ error: "Failed to fetch finance summary" });
  }
});

router.get("/project/:projectId", async (req, res) => {
  try {
    const projectId = paramId(req.params.projectId);
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        orders: {
          include: {
            payments: { orderBy: { paidAt: "desc" } },
          },
        },
        payments: { orderBy: { paidAt: "desc" } },
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

    const orders = project.orders.map((order) => {
      const paid = order.payments.reduce((s, p) => s + Number(p.amount), 0);
      const budget = Number(order.budget || 0);
      return {
        id: order.id,
        title: order.title,
        budget,
        paid,
        remaining: Math.max(0, budget - paid),
        payments: order.payments,
      };
    });

    const projectPaid = project.payments.reduce((s, p) => s + Number(p.amount), 0);
    const ordersPaid = orders.reduce((s, o) => s + o.paid, 0);
    const ordersBudget = orders.reduce((s, o) => s + o.budget, 0);
    const budget = Number(project.budget || 0) || ordersBudget;

    res.json({
      finance: {
        projectId: project.id,
        budget,
        paid: projectPaid + ordersPaid,
        remaining: Math.max(0, budget - projectPaid - ordersPaid),
        projectPayments: project.payments,
        orders,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch project finance" });
  }
});

router.get("/order/:orderId", async (req, res) => {
  try {
    const orderId = paramId(req.params.orderId);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        project: { select: { id: true, name: true, clientId: true } },
        payments: { orderBy: { paidAt: "desc" } },
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

    const paid = order.payments.reduce((s, p) => s + Number(p.amount), 0);
    const budget = Number(order.budget || 0);

    res.json({
      finance: {
        orderId: order.id,
        budget,
        paid,
        remaining: Math.max(0, budget - paid),
        payments: order.payments,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch order finance" });
  }
});

router.post("/", requireStaff(), async (req, res) => {
  try {
    const { orderId, projectId, amount, note, paidAt } = req.body;

    if (!amount || (!orderId && !projectId)) {
      res.status(400).json({ error: "amount and orderId or projectId required" });
      return;
    }

    const payment = await prisma.payment.create({
      data: {
        orderId: orderId || null,
        projectId: projectId || null,
        amount,
        note: note || null,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
      },
    });

    res.status(201).json({ payment });
  } catch (error) {
    console.error("Payment create error:", error);
    res.status(500).json({ error: "Failed to create payment" });
  }
});

router.delete("/:id", requireStaff(), async (req, res) => {
  try {
    await prisma.payment.delete({ where: { id: paramId(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete payment" });
  }
});

export default router;
