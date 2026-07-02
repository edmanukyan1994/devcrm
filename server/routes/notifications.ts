import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { paramId } from "../lib/params";
import { getVapidPublicKey } from "../lib/notifications";
import { ensureTelegramLinkCode, getTelegramBotUsername } from "../lib/telegram";

const router = Router();

router.get("/vapid-public-key", (_req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
});

router.use(authMiddleware);

router.get("/", async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.id, read: false },
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Notifications list error:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.patch("/read-all", async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, read: false },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notifications read" });
  }
});

router.patch("/:id/read", async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { id: paramId(req.params.id), userId: req.user!.id },
      data: { read: true },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notification read" });
  }
});

router.post("/push/subscribe", async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      res.status(400).json({ error: "Invalid subscription" });
      return;
    }

    await prisma.pushSubscription.upsert({
      where: { userId_endpoint: { userId: req.user!.id, endpoint } },
      create: {
        userId: req.user!.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Push subscribe error:", error);
    res.status(500).json({ error: "Failed to save subscription" });
  }
});

router.delete("/push/subscribe", async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (endpoint) {
      await prisma.pushSubscription.deleteMany({
        where: { userId: req.user!.id, endpoint },
      });
    } else {
      await prisma.pushSubscription.deleteMany({ where: { userId: req.user!.id } });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to unsubscribe" });
  }
});

router.get("/telegram/link", async (req, res) => {
  try {
    const code = await ensureTelegramLinkCode(req.user!.id);
    const botUsername = getTelegramBotUsername();
    res.json({
      code,
      botUsername,
      link: botUsername ? `https://t.me/${botUsername}?start=${code}` : null,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate telegram link" });
  }
});

export default router;
