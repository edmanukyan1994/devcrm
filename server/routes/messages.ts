import { Router } from "express";
import { MessageType, Role } from "@prisma/client";
import { isStaff } from "../lib/permissions";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { paramId } from "../lib/params";
import {
  getOrCreateDirectConversation,
  notifyNewMessage,
  getSenderName,
} from "../lib/messages";
import { chatUpload, deleteUploadFile, toPublicPath } from "../lib/upload";

const router = Router();

router.use(authMiddleware);

const messageInclude = {
  sender: {
    select: {
      id: true,
      role: true,
      profile: { select: { firstName: true, lastName: true, avatar: true } },
    },
  },
  attachments: true,
};

const conversationInclude = {
  participants: {
    include: {
      user: {
        select: {
          id: true,
          role: true,
          profile: { select: { firstName: true, lastName: true, company: true } },
        },
      },
    },
  },
  project: { select: { id: true, name: true } },
  messages: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    include: messageInclude,
  },
};

async function userInConversation(conversationId: string, userId: string) {
  const p = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  return !!p;
}

function messagePreview(type: MessageType, content: string) {
  if (type === MessageType.VOICE) return "🎤 Голосовое сообщение";
  if (type === MessageType.IMAGE) return content || "📷 Фото";
  if (type === MessageType.FILE) return content || "📎 Файл";
  return content;
}

function detectMessageType(mimeType: string): MessageType {
  if (mimeType.startsWith("audio/")) return MessageType.VOICE;
  if (mimeType.startsWith("image/")) return MessageType.IMAGE;
  return MessageType.FILE;
}

router.get("/", async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { participants: { some: { userId: req.user!.id } } },
      include: conversationInclude,
      orderBy: { updatedAt: "desc" },
    });

    res.json({ conversations });
  } catch (error) {
    console.error("Conversations list error:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId, projectId } = req.body;

    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    if (userId === req.user!.id) {
      res.status(400).json({ error: "Cannot chat with yourself" });
      return;
    }

    const other = await prisma.user.findUnique({ where: { id: userId } });
    if (!other) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (req.user!.role === Role.CLIENT && !isStaff(other.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const conversation = await getOrCreateDirectConversation(req.user!.id, userId, projectId);

    const full = await prisma.conversation.findUnique({
      where: { id: conversation.id },
      include: conversationInclude,
    });

    res.status(201).json({ conversation: full });
  } catch (error) {
    console.error("Conversation create error:", error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = paramId(req.params.id);
    const allowed = await userInConversation(id, req.user!.id);
    if (!allowed) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        ...conversationInclude,
        messages: {
          orderBy: { createdAt: "asc" },
          include: messageInclude,
        },
      },
    });

    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId: id, userId: req.user!.id } },
      data: { lastReadAt: new Date() },
    });

    res.json({ conversation });
  } catch (error) {
    console.error("Conversation detail error:", error);
    res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

router.post("/:id/messages", async (req, res) => {
  try {
    const id = paramId(req.params.id);
    const { content } = req.body;

    if (!content?.trim()) {
      res.status(400).json({ error: "content is required" });
      return;
    }

    const allowed = await userInConversation(id, req.user!.id);
    if (!allowed) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const message = await prisma.directMessage.create({
      data: {
        conversationId: id,
        senderId: req.user!.id,
        type: MessageType.TEXT,
        content: content.trim(),
      },
      include: messageInclude,
    });

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    const senderName = await getSenderName(req.user!.id);
    await notifyNewMessage(id, req.user!.id, content.trim(), senderName);

    res.status(201).json({ message });
  } catch (error) {
    console.error("Message send error:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

router.post("/:id/messages/media", chatUpload.single("file"), async (req, res) => {
  try {
    const id = paramId(req.params.id);
    const allowed = await userInConversation(id, req.user!.id);
    if (!allowed) {
      if (req.file) deleteUploadFile(toPublicPath(req.file.filename));
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "file is required" });
      return;
    }

    const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
    const duration = req.body.duration ? parseInt(req.body.duration, 10) : undefined;
    const typeParam = req.body.type as MessageType | undefined;
    const type =
      typeParam && Object.values(MessageType).includes(typeParam)
        ? typeParam
        : detectMessageType(req.file.mimetype);

    const message = await prisma.directMessage.create({
      data: {
        conversationId: id,
        senderId: req.user!.id,
        type,
        content,
        attachments: {
          create: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            path: toPublicPath(req.file.filename),
            duration: duration && !Number.isNaN(duration) ? duration : null,
          },
        },
      },
      include: messageInclude,
    });

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    const senderName = await getSenderName(req.user!.id);
    const preview = messagePreview(type, content);
    await notifyNewMessage(id, req.user!.id, preview, senderName);

    res.status(201).json({ message });
  } catch (error) {
    console.error("Media message error:", error);
    if (req.file) deleteUploadFile(toPublicPath(req.file.filename));
    res.status(500).json({ error: "Failed to send media" });
  }
});

export default router;
